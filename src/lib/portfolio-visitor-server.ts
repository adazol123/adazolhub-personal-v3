import { createHash, randomUUID } from 'node:crypto'
import { createRedisVisitorRecorder, recordLocalVisitor } from './portfolio-visitor-store.ts'
import { isTrackedVisitorPath } from './portfolio-visitors.ts'

const maxBodyBytes = 512
const cookieName = 'adazol_visitor'
const cookieMaxAge = 365 * 24 * 60 * 60
const visitorIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]'])

type VisitorDependencies = {
  env?: Record<string, string | undefined>,
  send?: typeof fetch,
  isTrackedPath?: (path: string) => boolean | Promise<boolean>
}

function sameOrigin (request: Request, onVercel: boolean): URL | null {
  const site = request.headers.get('sec-fetch-site')
  const purpose = request.headers.get('sec-purpose') ?? request.headers.get('purpose')
  if ((site && site !== 'same-origin') || purpose?.includes('prefetch')) return null

  const url = new URL(request.url)
  const host = request.headers.get('host') ?? url.host
  const forwarded = onVercel ? request.headers.get('x-forwarded-proto') : null
  const protocol = forwarded === 'https' || forwarded === 'http' ? `${forwarded}:` : url.protocol
  try {
    const origin = new URL(request.headers.get('origin') ?? '')
    return origin.href === `${origin.origin}/` && origin.origin === new URL(`${protocol}//${host}`).origin ? origin : null
  } catch {
    return null
  }
}

async function readPath (request: Request): Promise<string | 400 | 413> {
  if (Number(request.headers.get('content-length')) > maxBodyBytes) return 413
  if (!request.body) return 400

  const reader = request.body.getReader()
  const decoder = new TextDecoder('utf-8', { fatal: true })
  let size = 0
  let text = ''

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBodyBytes) {
        void reader.cancel().catch(() => {})
        return 413
      }
      text += decoder.decode(value, { stream: true })
    }

    const payload = JSON.parse(text + decoder.decode())
    return typeof payload?.path === 'string' ? payload.path : 400
  } catch {
    return 400
  } finally {
    reader.releaseLock()
  }
}

function reply (body: object, status: number, headers: HeadersInit = {}) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store', ...headers } })
}

function readVisitorId (request: Request) {
  const prefix = `${cookieName}=`
  const value = request.headers.get('cookie')?.split(';').map(entry => entry.trim())
    .find(entry => entry.startsWith(prefix))?.slice(prefix.length)
  return value && visitorIdPattern.test(value) ? value : null
}

export function createVisitorHandler ({ env = process.env, send = fetch, isTrackedPath = isTrackedVisitorPath }: VisitorDependencies = {}) {
  const onVercel = env.VERCEL === '1'
  const localPath = env.PORTFOLIO_VISITOR_DB_PATH?.trim() || '.local/portfolio-visitors.sqlite'
  const redis = createRedisVisitorRecorder(env.UPSTASH_REDIS_REST_URL, env.UPSTASH_REDIS_REST_TOKEN, send)

  return async function handleVisit (request: Request) {
    if (request.method !== 'POST') return reply({ status: 'error' }, 405, { allow: 'POST' })

    const origin = sameOrigin(request, onVercel)
    if (!origin) return reply({ status: 'error' }, 403)
    const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase()
    if (contentType !== 'application/json') return reply({ status: 'error' }, 415)

    const path = await readPath(request)
    if (typeof path === 'number') return reply({ status: 'error' }, path)
    if (!await isTrackedPath(path)) return reply({ status: 'error' }, 400)
    const local = !onVercel && loopbackHosts.has(origin.hostname) && loopbackHosts.has(new URL(request.url).hostname)
    if (!local && !redis) return reply({ status: 'unavailable' }, 503)

    const visitorId = readVisitorId(request)
    if (!visitorId) {
      const secure = origin.protocol === 'https:' ? '; Secure' : ''
      const cookie = `${cookieName}=${randomUUID()}; Path=/api/visitors; Max-Age=${cookieMaxAge}; HttpOnly; SameSite=Lax${secure}`
      return reply({ status: 'cookie-required' }, 202, { 'set-cookie': cookie })
    }

    const fingerprint = createHash('sha256').update(`${path}\0${visitorId}`).digest('hex')
    try {
      const count = local
        ? recordLocalVisitor(localPath, path, fingerprint)
        : await redis!(path, fingerprint, request.signal)
      return reply({ status: 'counted', count }, 200)
    } catch {
      return reply({ status: 'unavailable' }, 503)
    }
  }
}

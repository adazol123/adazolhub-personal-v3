import { isIP } from 'node:net'
import { renderContactEmail } from './contact-email-templates.ts'
import { parseContactEmailCredential, readServiceCredentials } from './service-credentials.ts'
import { readContactTemplates } from './site-content-store.ts'
import { readContactAddresses, validateContactFields, type ContactErrors } from './portfolio-contact.ts'

const MAX_BODY_BYTES = 32_768
const WINDOW_MS = 600_000
const MAX_ATTEMPTS = 5
const MAX_CLIENTS = 2_048
const UUID_V4 = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i

type ContactEnv = Record<string, string | undefined>

export function readContactConfig (env: ContactEnv = process.env, apiKey = env.RESEND_API_KEY?.trim()) {
  const addresses = readContactAddresses(env.CONTACT_FROM_EMAIL, env.CONTACT_TO_EMAIL)
  return apiKey && addresses ? { apiKey, ...addresses } : null
}

export async function getContactConfig () {
  const [apiKey, value] = await readServiceCredentials(['resend', 'contactEmail'])
  const addresses = parseContactEmailCredential(value)
  return apiKey && addresses ? { apiKey, ...addresses } : null
}

function isSameOrigin (request: Request, onVercel: boolean) {
  const site = request.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin') return false

  const url = new URL(request.url)
  const host = request.headers.get('host') ?? url.host
  const forwarded = onVercel ? request.headers.get('x-forwarded-proto') : null
  const protocol = forwarded === 'https' || forwarded === 'http' ? `${forwarded}:` : url.protocol
  return request.headers.get('origin') === `${protocol}//${host}`
}

type ContactBody = { status: 'parsed', data: unknown } | { status: 'too-large' | 'invalid' }

async function readContactBody (request: Request): Promise<ContactBody> {
  const contentLength = Number(request.headers.get('content-length'))
  if (contentLength > MAX_BODY_BYTES) return { status: 'too-large' }
  if (!request.body) return { status: 'invalid' }

  const reader = request.body.getReader()
  const decoder = new TextDecoder('utf-8', { fatal: true })
  let content = ''
  let byteLength = 0

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      byteLength += value.byteLength
      if (byteLength > MAX_BODY_BYTES) {
        void reader.cancel().catch(() => {})
        return { status: 'too-large' }
      }
      content += decoder.decode(value, { stream: true })
    }
    return { status: 'parsed', data: JSON.parse(content + decoder.decode()) }
  } catch {
    return { status: 'invalid' }
  } finally {
    reader.releaseLock()
  }
}

/**
 * Bound memory usage and fail closed if all buckets are active. Each server
 * instance has its own counters.
 */
function createRateLimit (now: () => number) {
  const buckets = new Map<string, { count: number, expiresAt: number }>()

  return function retryAfter (client: string) {
    const time = now()
    const bucket = buckets.get(client)
    if (bucket && bucket.expiresAt > time) {
      if (bucket.count >= MAX_ATTEMPTS) return Math.ceil((bucket.expiresAt - time) / 1000)
      bucket.count += 1
      return 0
    }

    if (buckets.size >= MAX_CLIENTS) {
      for (const [key, entry] of buckets) {
        if (entry.expiresAt <= time) buckets.delete(key)
      }
      if (buckets.size >= MAX_CLIENTS) return Math.ceil(WINDOW_MS / 1000)
    }

    buckets.set(client, { count: 1, expiresAt: time + WINDOW_MS })
    return 0
  }
}

function errorResponse (status: number, message: string, options: { errors?: ContactErrors, retryAfter?: number } = {}) {
  const headers = new Headers({ 'cache-control': 'no-store' })
  if (options.retryAfter) headers.set('retry-after', String(options.retryAfter))
  return Response.json({
    status: status === 503 ? 'unavailable' : 'error',
    message,
    ...(options.errors ? { errors: options.errors } : {})
  }, { status, headers })
}

type ContactDependencies = {
  env?: ContactEnv
  send?: typeof fetch
  now?: () => number
  providerTimeoutMs?: number
  getConfig?: () => ReturnType<typeof readContactConfig> | Promise<ReturnType<typeof readContactConfig>>
}

export function createContactHandler ({
  env = process.env, send = fetch, now = Date.now, providerTimeoutMs = 8_000,
  getConfig = () => readContactConfig(env)
}: ContactDependencies = {}) {
  const retryAfter = createRateLimit(now)

  async function acceptEmail (apiKey: string, key: string, email: ReturnType<typeof renderContactEmail>, signal: AbortSignal) {
    const result = await send('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
        'idempotency-key': key
      },
      body: JSON.stringify(email),
      cache: 'no-store',
      redirect: 'error',
      signal
    })
    if (!result.ok) {
      void result.body?.cancel().catch(() => {})
      return false
    }
    const accepted = await result.json()
    return typeof accepted?.id === 'string' && Boolean(accepted.id.trim())
  }

  return async function handleContactRequest (request: Request) {
    const onVercel = env.VERCEL === '1'
    if (!isSameOrigin(request, onVercel)) return errorResponse(403, 'Send your message from the contact page.')
    const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase()
    if (contentType !== 'application/json') return errorResponse(415, 'Send your message from the contact page.')

    const body = await readContactBody(request)
    if (body.status === 'too-large') return errorResponse(413, 'The message is too large. Please shorten it and try again.')
    if (body.status !== 'parsed' || !body.data || typeof body.data !== 'object' || Array.isArray(body.data)) {
      return errorResponse(400, 'Enter your name, email address, and message.')
    }

    const data = body.data as Record<string, unknown>
    if ((data.website !== undefined && data.website !== '') ||
        typeof data.requestId !== 'string' || data.requestId.length !== 36 || !UUID_V4.test(data.requestId)) {
      return errorResponse(400, 'The form could not be submitted. Please email me directly.')
    }

    const { fields, errors } = validateContactFields(data)
    if (Object.keys(errors).length) return errorResponse(400, 'Check the highlighted fields.', { errors })

    // The Vercel edge overwrites this header. For other runtimes, use a shared bucket.
    const forwardedIp = onVercel ? request.headers.get('x-vercel-forwarded-for') : null
    const delay = retryAfter(forwardedIp && isIP(forwardedIp) ? forwardedIp : 'anonymous')
    if (delay) return errorResponse(429, 'Too many attempts. Please wait a few minutes or email me directly.', { retryAfter: delay })

    const settings = await Promise.all([getConfig(), readContactTemplates()]).catch(() => null)
    if (!settings?.[0]) return errorResponse(503, 'The contact form is unavailable. Please email me directly.')
    const [config, templates] = settings

    const timeout = AbortSignal.timeout(providerTimeoutMs)
    const unconfirmed = 'I couldn’t confirm your message was sent. Please try again or email me directly.'
    const requestId = data.requestId.toLowerCase()
    try {
      const notification = renderContactEmail(templates.notification, fields, config)
      if (!await acceptEmail(config.apiKey, `portfolio-contact/${requestId}`, notification, timeout)) return errorResponse(502, unconfirmed)
    } catch {
      return errorResponse(timeout.aborted ? 504 : 502, unconfirmed)
    }

    const confirmation = renderContactEmail(templates.confirmation, fields, config, true)
    const summaryAccepted = await acceptEmail(
      config.apiKey, `portfolio-contact-summary/${requestId}`, confirmation, AbortSignal.timeout(Math.min(providerTimeoutMs, 5000))
    ).catch(() => false)
    return Response.json(
      { status: 'accepted', summary: summaryAccepted ? 'accepted' : 'unconfirmed' },
      { status: 202, headers: { 'cache-control': 'no-store' } }
    )
  }
}

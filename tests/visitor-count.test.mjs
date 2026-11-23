import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import test from 'node:test'
import { createVisitorHandler } from '../src/lib/portfolio-visitor-server.ts'
import { requestVisitorCount } from '../src/lib/portfolio-visitors.ts'

const localOrigin = 'http://localhost:3000'
const hostedOrigin = 'https://portfolio.example.com'
const redisEnv = {
  VERCEL: '1',
  UPSTASH_REDIS_REST_URL: 'https://portfolio.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'test-token'
}

function visit (path = '/', options = {}) {
  const { origin = localOrigin, headers = {}, method = 'POST', body = JSON.stringify({ path }) } = options
  return new Request(`${origin}/api/visitors`, {
    method,
    headers: { origin, 'sec-fetch-site': 'same-origin', 'content-type': 'application/json', ...headers },
    ...(method === 'POST' && { body })
  })
}

function localDatabase (t) {
  const directory = mkdtempSync(join(tmpdir(), 'portfolio-visitors-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  return { PORTFOLIO_VISITOR_DB_PATH: join(directory, 'data', 'visits.sqlite') }
}

async function bootstrap (handle, { origin = localOrigin, ...options } = {}) {
  const response = await handle(visit('/', { origin, ...options }))
  assert.equal(response.status, 202)
  assert.deepEqual(await response.json(), { status: 'cookie-required' })
  assert.equal(response.headers.get('cache-control'), 'no-store')
  const cookie = response.headers.get('set-cookie')
  assert.match(cookie, /adazol_visitor=[0-9a-f-]{36};/)
  assert.match(cookie, /; HttpOnly(?:;|$)/)
  assert.match(cookie, /; SameSite=Lax(?:;|$)/)
  assert.match(cookie, /; Max-Age=31536000(?:;|$)/)
  assert.match(cookie, /; Path=\/api\/visitors(?:;|$)/)
  assert.equal(/; Secure(?:;|$)/.test(cookie), new URL(origin).protocol === 'https:')
  return cookie.split(';')[0]
}

test('a returning cookie counts once per page across route instances and only per-page hashes are stored', async (t) => {
  const env = localDatabase(t)
  const handle = createVisitorHandler({ env })
  const first = await bootstrap(handle)
  const second = await bootstrap(handle)
  assert.notEqual(first, second)

  for (const [handler, path, cookie, count] of [
    [handle, '/', first, 1],
    [handle, '/', first, 1],
    [handle, '/portfolio/prodsight-ai', first, 1],
    [createVisitorHandler({ env }), '/', second, 2],
    [handle, '/portfolio/prodsight-ai', first, 1]
  ]) {
    const response = await handler(visit(path, { headers: { cookie } }))
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { status: 'counted', count })
  }

  const database = new DatabaseSync(env.PORTFOLIO_VISITOR_DB_PATH, { readOnly: true })
  try {
    const rows = database.prepare('SELECT * FROM portfolio_visitors').all()
    assert.equal(rows.length, 3)
    assert.equal(new Set(rows.map(row => row.fingerprint)).size, 3)
    for (const row of rows) {
      assert.deepEqual(Object.keys(row).sort(), ['fingerprint', 'path'])
      assert.match(row.fingerprint, /^[0-9a-f]{64}$/)
    }
  } finally {
    database.close()
  }
})

test('unknown paths, prefetches, cross-origin requests and oversized streams are rejected before any cookie is issued', async (t) => {
  const handle = createVisitorHandler({ env: localDatabase(t) })
  for (const [input, status] of [
    [visit('/portfolio/unknown'), 400],
    [visit('/about?utm_source=example'), 400],
    [visit('/api/visitors'), 400],
    [visit('/', { method: 'GET' }), 405],
    [visit('/', { headers: { origin: 'https://other.example.com' } }), 403],
    [visit('/', { headers: { 'sec-fetch-site': 'same-site' } }), 403],
    [visit('/', { headers: { 'sec-purpose': 'prefetch;prerender' } }), 403],
    [visit('/', { headers: { 'content-type': 'text/plain' } }), 415],
    [visit('/', { headers: { 'content-length': '1000' } }), 413],
    [visit(`/${'x'.repeat(1000)}`), 413],
    [visit('/', { body: '{' }), 400]
  ]) {
    const response = await handle(input)
    assert.equal(response.status, status)
    assert.equal(response.headers.get('set-cookie'), null)
  }
})

test('unconfigured public and Vercel requests return unavailable without assigning a cookie', async (t) => {
  const env = localDatabase(t)
  for (const [config, origin] of [[env, hostedOrigin], [{ ...env, VERCEL: '1' }, localOrigin]]) {
    const response = await createVisitorHandler({ env: config })(visit('/', { origin }))
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { status: 'unavailable' })
    assert.equal(response.headers.get('set-cookie'), null)
  }
})

test('hosted counts use one atomic Redis request and accept a verified numeric result', async () => {
  const outbound = []
  const handle = createVisitorHandler({
    env: redisEnv,
    send: async (url, options) => {
      outbound.push({ url: String(url), options })
      return Response.json([{ result: 0 }, { result: 398 }])
    }
  })
  const cookie = await bootstrap(handle, { origin: hostedOrigin })
  assert.equal(outbound.length, 0)
  const response = await handle(new Request('http://n/api/visitors', {
    method: 'POST',
    headers: { cookie, origin: hostedOrigin, host: 'portfolio.example.com', 'x-forwarded-proto': 'https', 'content-type': 'application/json' },
    body: JSON.stringify({ path: '/about' })
  }))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { status: 'counted', count: 398 })
  assert.equal(response.headers.get('set-cookie'), null)
  assert.equal(outbound.length, 1)
  const [{ url, options }] = outbound
  assert.equal(url, 'https://portfolio.upstash.io/multi-exec')
  assert.equal(options.method, 'POST')
  assert.equal(new Headers(options.headers).get('authorization'), 'Bearer test-token')
  assert.equal(options.redirect, 'error')
  const [[add, key, fingerprint], [cardinality, sameKey]] = JSON.parse(options.body)
  assert.deepEqual([add, cardinality], ['SADD', 'SCARD'])
  assert.equal(key, sameKey)
  assert.match(key, /:\/about$/)
  assert.match(fingerprint, /^[0-9a-f]{64}$/)
  assert.ok(!options.body.includes(cookie.split('=')[1]))
})

test('failed or malformed Redis replies return unavailable', async () => {
  for (const upstream of [
    () => Response.json({ error: 'provider details' }, { status: 401 }),
    () => Response.json([{ error: 'provider details' }, { result: 42 }]),
    () => Response.json([{ result: 1 }, { result: '42' }]),
    () => Response.json([{ result: 1 }, { result: 0 }]),
    () => { throw new Error('provider details') }
  ]) {
    const handle = createVisitorHandler({ env: redisEnv, send: async () => upstream() })
    const cookie = await bootstrap(handle, { origin: hostedOrigin })
    const response = await handle(visit('/', { origin: hostedOrigin, headers: { cookie } }))
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { status: 'unavailable' })
  }
})

test('the client sends one retry for the cookie bootstrap and reports unavailable when cookies are blocked', async () => {
  const outbound = []
  const send = async (url, options) => {
    outbound.push({ url, options })
    return Response.json({ status: 'cookie-required' }, { status: 202 })
  }
  assert.equal(await requestVisitorCount('/contact', send), null)
  assert.equal(outbound.length, 2)
  for (const { url, options } of outbound) {
    assert.equal(url, '/api/visitors')
    assert.equal(options.method, 'POST')
    assert.equal(options.credentials, 'same-origin')
    assert.deepEqual(JSON.parse(options.body), { path: '/contact' })
  }

  assert.equal(await requestVisitorCount('/contact', async () => Response.json({ status: 'counted', count: 41 })), 41)
  assert.equal(await requestVisitorCount('/contact', async () => Response.json({ status: 'counted', count: '41' })), null)
  assert.equal(await requestVisitorCount('/contact', async () => Response.json({ status: 'counted', count: 0 })), null)
})

test('counts published Work routes and rejects projects removed from the published list', async (t) => {
  const handle = createVisitorHandler({
    env: localDatabase(t),
    isTrackedPath: async path => path === '/portfolio/published-project'
  })
  assert.equal((await handle(visit('/portfolio/published-project'))).status, 202)
  assert.equal((await handle(visit('/portfolio/prodsight-ai'))).status, 400)
})

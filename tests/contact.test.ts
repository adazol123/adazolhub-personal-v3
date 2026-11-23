import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createContactHandler } from '../src/lib/portfolio-contact-server.ts'
import { contactDraftHref } from '../src/lib/portfolio-contact.ts'
import { defaultEditorContent, validateSiteSection } from '../src/lib/site-content.ts'
import { publishSiteSection } from '../src/lib/site-content-store.ts'

const origin = 'https://portfolio.example.com'
const validFields = {
  name: '  A Researcher  ',
  email: '  research+hello@example.net  ',
  message: '  Can we talk about your work?\nThanks!  ',
  website: '',
  requestId: '3adc2413-49c6-421c-84d5-39597cde8f4b'
}
const env = {
  RESEND_API_KEY: 'fake-key',
  CONTACT_FROM_EMAIL: 'Portfolio <contact@example.com>',
  CONTACT_TO_EMAIL: 'owner@example.com',
  VERCEL: '1'
}

function request (payload: unknown = validFields, headers: HeadersInit = {}) {
  return new Request(`${origin}/api/contact`, {
    method: 'POST',
    headers: {
      origin,
      'sec-fetch-site': 'same-origin',
      'content-type': 'application/json',
      ...headers
    },
    body: JSON.stringify(payload)
  })
}

const neverSend = async () => assert.fail('The provider must not be called')

test('the email draft encodes the subject and message without allowing additional recipients or headers', () => {
  const href = contactDraftHref('owner@example.com', {
    name: 'María & Co.',
    email: 'visitor+hello@example.net',
    message: 'Hello!\nPlease sign #42?bcc=someone@example.net & send it back.\r\nThanks.'
  })
  assert.match(href, /^mailto:owner@example\.com\?subject=Portfolio%20contact%20message&body=/)
  const draft = new URL(href)
  assert.equal(draft.pathname, 'owner@example.com')
  assert.deepEqual([...draft.searchParams.keys()], ['subject', 'body'])
  assert.equal(draft.searchParams.get('body'), 'Name: María & Co.\r\nEmail: visitor+hello@example.net\r\n\r\nHello!\r\nPlease sign #42?bcc=someone@example.net & send it back.\r\nThanks.')
})

test('an accepted submission sends separate owner and visitor emails with stable idempotency keys', async () => {
  const outbound = []
  const handle = createContactHandler({
    env,
    send: async (url, options) => {
      outbound.push({ url, options })
      return Response.json({ id: 'provider-email-id' })
    }
  })

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await handle(request())
    assert.equal(response.status, 202)
    assert.deepEqual(await response.json(), { status: 'accepted', summary: 'accepted' })
  }

  assert.equal(outbound.length, 4)
  for (const [index, { url, options }] of outbound.entries()) {
    assert.equal(url, 'https://api.resend.com/emails')
    assert.equal(options.method, 'POST')
    const headers = new Headers(options.headers)
    assert.equal(headers.get('authorization'), 'Bearer fake-key')
    assert.equal(typeof options.body, 'string')
    const payload = JSON.parse(options.body as string)
    assert.equal(payload.from, env.CONTACT_FROM_EMAIL)
    if (index % 2) {
      assert.equal(headers.get('idempotency-key'), `portfolio-contact-summary/${validFields.requestId}`)
      assert.deepEqual(payload.to, ['research+hello@example.net'])
      assert.equal(payload.reply_to, undefined)
      assert.equal(payload.headers['Auto-Submitted'], 'auto-replied')
      assert.match(payload.text, /Name: A Researcher\nEmail: research\+hello@example.net\n\nCan we talk about your work\?\nThanks!/)
      continue
    }
    assert.equal(headers.get('idempotency-key'), `portfolio-contact/${validFields.requestId}`)
    assert.deepEqual(payload.to, [env.CONTACT_TO_EMAIL])
    assert.equal(payload.reply_to, 'research+hello@example.net')
    assert.equal(payload.text, 'Name: A Researcher\nEmail: research+hello@example.net\n\nCan we talk about your work?\nThanks!')
  }
})

test('a rejected confirmation leaves the owner submission accepted', async () => {
  let attempts = 0
  const handle = createContactHandler({
    env,
    send: async () => ++attempts === 1
      ? Response.json({ id: 'owner-email-id' })
      : Response.json({ message: 'Private provider error' }, { status: 429 })
  })
  const response = await handle(request())
  assert.equal(response.status, 202)
  assert.deepEqual(await response.json(), { status: 'accepted', summary: 'unconfirmed' })
})

test('published templates render both email payloads and escape form input in HTML', async t => {
  const directory = mkdtempSync(join(tmpdir(), 'portfolio-contact-templates-'))
  const originalEnv = process.env
  process.env = { NODE_ENV: 'test', PORTFOLIO_CONTENT_DB_PATH: join(directory, 'content.sqlite') }
  t.after(() => {
    process.env = originalEnv
    rmSync(directory, { recursive: true, force: true })
  })
  const templates = structuredClone(defaultEditorContent.contactTemplates)
  templates.notification.subject = 'Inquiry from {{name}}'
  templates.notification.replyTo = 'support@example.org'
  templates.notification.customHeaders = 'X-Portfolio-Type: inquiry'
  templates.confirmation.text = 'Hello {{name}}.\n{{email}}\n{{message}}'
  templates.confirmation.html = '<p>Hello {{name}}</p><pre>{{message}}</pre>'
  const outbound = []
  const handle = createContactHandler({
    env,
    send: async (_url, options) => {
      outbound.push(JSON.parse(options.body as string))
      return Response.json({ id: 'provider-email-id' })
    }
  })
  assert.equal(validateSiteSection('contactTemplates', templates), null)
  assert.ok(await publishSiteSection('contactTemplates', '', templates))
  const message = '<img src=x onerror=alert(1)> {{email}}'
  assert.equal((await handle(request({ ...validFields, name: 'A & B', message }))).status, 202)
  assert.equal(outbound[0].subject, 'Inquiry from A & B')
  assert.equal(outbound[0].reply_to, 'support@example.org')
  assert.deepEqual(outbound[0].headers, { 'X-Portfolio-Type': 'inquiry' })
  assert.equal(outbound[1].text, `Hello A & B.\nresearch+hello@example.net\n${message}`)
  assert.equal(outbound[1].html, '<p>Hello A &amp; B</p><pre>&lt;img src=x onerror=alert(1)&gt; {{email}}</pre>')
})

test('template validation rejects routing headers, duplicate custom headers and unsafe placeholder contexts', () => {
  const defaults = defaultEditorContent.contactTemplates
  for (const patch of [
    { customHeaders: 'Bcc: extra@example.org' },
    { customHeaders: 'X-Example: one\nx-example: two' },
    { subject: 'Hello\nBcc: extra@example.org' },
    { subject: '{{message}}' },
    { html: '<a href="{{message}}">Open</a>' },
    { replyTo: 'first@example.org, second@example.org' }
  ]) {
    assert.ok(validateSiteSection('contactTemplates', { ...defaults, confirmation: { ...defaults.confirmation, ...patch } }))
  }
})

test('the unconfigured form returns an explicit unavailable result', async () => {
  const handle = createContactHandler({ env: {}, send: neverSend })
  const response = await handle(request())
  assert.equal(response.status, 503)
  assert.equal((await response.json()).status, 'unavailable')
})

test('the same-origin check uses the public protocol and host behind the Vercel proxy', async () => {
  const response = await createContactHandler({ env, send: async () => Response.json({ id: 'provider-email-id' }) })(
    new Request('http://n/api/contact', {
      method: 'POST',
      headers: {
        origin,
        host: 'portfolio.example.com',
        'x-forwarded-proto': 'https',
        'sec-fetch-site': 'same-origin',
        'content-type': 'application/json'
      },
      body: JSON.stringify(validFields)
    })
  )
  assert.equal(response.status, 202)
})

test('cross-site origins, other request types and malformed or automated submissions are rejected', async () => {
  const handle = createContactHandler({ env, send: neverSend })
  assert.equal((await handle(request(validFields, { origin: 'https://elsewhere.example.com' }))).status, 403)
  assert.equal((await handle(request(validFields, { origin: 'http://portfolio.example.com' }))).status, 403)
  assert.equal((await handle(request(validFields, { 'sec-fetch-site': 'same-site' }))).status, 403)
  assert.equal((await handle(request(validFields, { 'content-type': 'text/plain' }))).status, 415)
  assert.equal((await handle(request({ ...validFields, website: 'https://example.com' }))).status, 400)
  assert.equal((await handle(request({ ...validFields, requestId: 'header injection' }))).status, 400)
  assert.equal((await handle(request({ ...validFields, website: null }))).status, 400)

  const invalidFields = await handle(request({ ...validFields, name: ' ', email: 'person@example.net\nBcc: another@example.net', message: 19 }))
  assert.equal(invalidFields.status, 400)
  assert.deepEqual(Object.keys((await invalidFields.json()).errors), ['name', 'email', 'message'])
})

test('the handler enforces the limit while reading a body without Content-Length', async () => {
  const handle = createContactHandler({ env, send: neverSend })
  const response = await handle(request({ ...validFields, message: 'X'.repeat(32768) }))
  assert.equal(response.status, 413)
  assert.equal((await handle(request(validFields, { 'content-length': '32769' }))).status, 413)
})

test('a rejection or missing provider email id never looks like success', async () => {
  for (const providerResponse of [
    Response.json({ message: 'private rejection details' }, { status: 403 }),
    Response.json({ error: 'unexpected payload' }),
    new Response('not JSON', { status: 200 })
  ]) {
    let attempts = 0
    const handle = createContactHandler({ env, send: async () => { attempts += 1; return providerResponse } })
    const response = await handle(request())
    assert.equal(response.status, 502)
    assert.equal(attempts, 1)
    const body = await response.json()
    assert.equal(body.status, 'error')
    assert.doesNotMatch(JSON.stringify(body), /private rejection details/)
  }
})

test('a provider timeout reports an unconfirmed submission', async () => {
  const wait = setTimeout(() => {}, 1000)
  try {
    const handle = createContactHandler({
      env,
      providerTimeoutMs: 5,
      send: (_url, { signal }) => new Promise<Response>((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(signal.reason), { once: true })
      })
    })
    const response = await handle(request())
    assert.equal(response.status, 504)
    assert.equal((await response.json()).status, 'error')
  } finally {
    clearTimeout(wait)
  }
})

test('the rate limit keeps distinct client buckets and expires them', async () => {
  let time = 0
  const handle = createContactHandler({
    env,
    now: () => time,
    send: async () => Response.json({ id: 'provider-email-id' })
  })
  const client = { 'x-vercel-forwarded-for': '192.0.2.1' }
  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal((await handle(request(validFields, client))).status, 202)
  }
  const rejected = await handle(request(validFields, client))
  assert.equal(rejected.status, 429)
  assert.equal(rejected.headers.get('retry-after'), '600')
  assert.equal((await handle(request(validFields, { 'x-vercel-forwarded-for': '192.0.2.2' }))).status, 202)
  time += 600_000
  assert.equal((await handle(request(validFields, client))).status, 202)
})

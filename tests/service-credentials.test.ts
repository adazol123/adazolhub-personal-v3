import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { getContactConfig } from '../src/lib/portfolio-contact-server.ts'
import { readCredentialStatuses, readServiceToken, saveServiceCredential, removeServiceCredential } from '../src/lib/service-credentials.ts'

test('stores an encrypted override, returns status only, and restores the environment fallback on removal', async t => {
  const directory = mkdtempSync(join(tmpdir(), 'portfolio-credentials-'))
  const originalEnv = process.env
  const dbPath = join(directory, 'content.sqlite')
  const value = 'fake-provider-key-93684dbe5ca701c8'
  process.env = {
    NODE_ENV: 'test',
    PORTFOLIO_CONTENT_DB_PATH: dbPath,
    PORTFOLIO_CREDENTIALS_KEY: 'ab'.repeat(32),
    GEMINI_API_KEY: 'test-environment-fallback'
  }
  t.after(() => {
    process.env = originalEnv
    rmSync(directory, { recursive: true, force: true })
  })
  assert.equal(await readServiceToken('gemini'), 'test-environment-fallback')
  assert.equal(await saveServiceCredential('gemini', '', value), true)
  assert.equal(readFileSync(dbPath).includes(value), false)
  assert.equal(await readServiceToken('gemini'), value)
  assert.equal(await readServiceToken('resend'), undefined)
  const status = await readCredentialStatuses()
  assert.deepEqual(Object.fromEntries(Object.entries(status).map(([name, info]) => [name, info.status])),
    { gemini: 'saved', github: 'missing', resend: 'missing', contactEmail: 'missing' })
  assert.equal(await removeServiceCredential('gemini', ''), false)
  assert.equal(await saveServiceCredential('gemini', '', 'stale-override-test-value'), false)
  assert.equal(await readServiceToken('gemini'), value)
  assert.doesNotMatch(JSON.stringify(status), /fake-provider-key/)
  process.env.PORTFOLIO_CREDENTIALS_KEY = 'cd'.repeat(32)
  assert.equal((await readCredentialStatuses()).gemini.status, 'unreadable')
  assert.equal(await readServiceToken('gemini'), 'test-environment-fallback')
  assert.equal(await removeServiceCredential('gemini', status.gemini.revision), true)
  assert.equal((await readCredentialStatuses()).gemini.status, 'environment')
  assert.equal(await readServiceToken('gemini'), 'test-environment-fallback')
})

test('contact delivery uses an encrypted address pair and restores environment addresses when removed', async t => {
  const directory = mkdtempSync(join(tmpdir(), 'portfolio-contact-settings-'))
  const originalEnv = process.env
  const dbPath = join(directory, 'content.sqlite')
  process.env = {
    NODE_ENV: 'test',
    PORTFOLIO_CONTENT_DB_PATH: dbPath,
    PORTFOLIO_CREDENTIALS_KEY: 'ab'.repeat(32)
  }
  t.after(() => {
    process.env = originalEnv
    rmSync(directory, { recursive: true, force: true })
  })

  const apiKey = 'fake-resend-key-for-contact-config'
  const from = 'Portfolio <sender@example.com>'
  const to = 'owner@example.net'
  assert.equal(await saveServiceCredential('resend', '', apiKey), true)
  assert.equal(await getContactConfig(), null)
  await assert.rejects(saveServiceCredential('contactEmail', '', JSON.stringify({ from, to: `${to},other@example.net` })))
  assert.equal(await saveServiceCredential('contactEmail', '', JSON.stringify({ from, to })), true)
  assert.deepEqual(await getContactConfig(), { apiKey, from, to })
  assert.equal(readFileSync(dbPath).includes(to), false)

  process.env.CONTACT_FROM_EMAIL = 'fallback@example.com'
  process.env.CONTACT_TO_EMAIL = 'fallback@example.net'
  assert.deepEqual(await getContactConfig(), { apiKey, from, to })
  const { contactEmail } = await readCredentialStatuses()
  assert.equal(contactEmail.status, 'saved')
  assert.equal(await removeServiceCredential('contactEmail', contactEmail.revision), true)
  assert.deepEqual(await getContactConfig(), { apiKey, from: 'fallback@example.com', to: 'fallback@example.net' })
})

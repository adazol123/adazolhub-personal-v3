import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { readCredentialStatuses, readServiceToken, saveServiceToken, removeServiceToken } from '../src/lib/service-credentials.ts'

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
  assert.equal(await saveServiceToken('gemini', '', value), true)
  assert.equal(readFileSync(dbPath).includes(value), false)
  assert.equal(await readServiceToken('gemini'), value)
  assert.equal(await readServiceToken('resend'), undefined)
  const status = await readCredentialStatuses()
  assert.deepEqual(Object.fromEntries(Object.entries(status).map(([name, info]) => [name, info.status])),
    { gemini: 'saved', github: 'missing', resend: 'missing' })
  assert.equal(await removeServiceToken('gemini', ''), false)
  assert.equal(await saveServiceToken('gemini', '', 'stale-override-test-value'), false)
  assert.equal(await readServiceToken('gemini'), value)
  assert.doesNotMatch(JSON.stringify(status), /fake-provider-key/)
  process.env.PORTFOLIO_CREDENTIALS_KEY = 'cd'.repeat(32)
  assert.equal((await readCredentialStatuses()).gemini.status, 'unreadable')
  assert.equal(await readServiceToken('gemini'), 'test-environment-fallback')
  assert.equal(await removeServiceToken('gemini', status.gemini.revision), true)
  assert.equal((await readCredentialStatuses()).gemini.status, 'environment')
  assert.equal(await readServiceToken('gemini'), 'test-environment-fallback')
})

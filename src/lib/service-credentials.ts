import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import { contentStore, openContentDatabase, redisCommand } from './site-content-store.ts'

export const credentialProviders = {
  gemini: 'GEMINI_API_KEY',
  github: 'GITHUB_TOKEN',
  resend: 'RESEND_API_KEY'
} as const

export type CredentialProvider = keyof typeof credentialProviders
export type CredentialStatus = 'saved' | 'environment' | 'missing' | 'unreadable'
export type CredentialSummary = { status: CredentialStatus; revision: string }

const providers = Object.keys(credentialProviders) as CredentialProvider[]
const keyPrefix = 'adazol:portfolio:credentials:v1:'

function encryptionKey() {
  const value = process.env.PORTFOLIO_CREDENTIALS_KEY?.trim()
  return value && /^[a-f0-9]{64}$/i.test(value) ? Buffer.from(value, 'hex') : null
}

export function credentialStorageEnabled() {
  return Boolean(encryptionKey() && contentStore())
}

export function isCredentialProvider(value: unknown): value is CredentialProvider {
  return typeof value === 'string' && Object.hasOwn(credentialProviders, value)
}

export function isServiceToken(value: unknown): value is string {
  return typeof value === 'string' && /^[\x21-\x7e]{16,2048}$/.test(value)
}

// The random nonce is also an opaque revision for compare-and-set updates.
function revisionOf(entry: string | null) {
  return entry === null ? '' : /^v1\.([\w-]{16})\./.exec(entry)?.[1] ?? 'invalid'
}

export function isCredentialRevision(value: unknown): value is string {
  return typeof value === 'string' && (value === '' || value === 'invalid' || /^[\w-]{16}$/.test(value))
}

function encrypt(provider: CredentialProvider, token: string, key: Buffer) {
  const nonce = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, nonce)
  cipher.setAAD(Buffer.from(keyPrefix + provider))
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  return ['v1', nonce.toString('base64url'), cipher.getAuthTag().toString('base64url'), ciphertext.toString('base64url')].join('.')
}

function decrypt(provider: CredentialProvider, entry: string, key: Buffer) {
  const [version, nonce, tag, ciphertext, extra] = entry.split('.')
  if (version !== 'v1' || !nonce || !tag || !ciphertext || extra !== undefined) throw new Error('Invalid credential record')
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(nonce, 'base64url'), { authTagLength: 16 })
  decipher.setAAD(Buffer.from(keyPrefix + provider))
  decipher.setAuthTag(Buffer.from(tag, 'base64url'))
  const token = Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8')
  if (!isServiceToken(token)) throw new Error('Invalid credential value')
  return token
}

type Store = NonNullable<ReturnType<typeof contentStore>>

function openCredentialDatabase(file: string) {
  const db = openContentDatabase(file)
  try {
    db.exec('CREATE TABLE IF NOT EXISTS service_credentials (provider TEXT PRIMARY KEY, ciphertext TEXT NOT NULL) WITHOUT ROWID')
    return db
  } catch (error) {
    db.close()
    throw error
  }
}

async function readEntries(store: Store, selected: CredentialProvider[]): Promise<(string | null)[]> {
  if (store.driver === 'sqlite') {
    if (!existsSync(store.file)) return selected.map(() => null)
    const db = openCredentialDatabase(store.file)
    try {
      const rows = db.prepare('SELECT provider, ciphertext FROM service_credentials').all<{ provider: string; ciphertext: string }>()
      const entries = new Map(rows.map(row => [row.provider, row.ciphertext]))
      return selected.map(provider => entries.get(provider) ?? null)
    } finally {
      db.close()
    }
  }
  const entries = await redisCommand(store, ['MGET', ...selected.map(provider => keyPrefix + provider)])
  if (!Array.isArray(entries) || entries.length !== selected.length ||
      entries.some(entry => entry !== null && typeof entry !== 'string')) throw new Error('Invalid credential records')
  return entries
}

function environmentToken(provider: CredentialProvider) {
  return process.env[credentialProviders[provider]]?.trim() || undefined
}

export async function readServiceToken(provider: CredentialProvider) {
  const fallback = environmentToken(provider)
  const key = encryptionKey()
  const store = key ? contentStore() : null
  if (!store || !key) return fallback
  try {
    const [entry] = await readEntries(store, [provider])
    return entry ? decrypt(provider, entry, key) : fallback
  } catch {
    return fallback
  }
}

export async function readCredentialStatuses(): Promise<Record<CredentialProvider, CredentialSummary>> {
  const key = encryptionKey()
  const store = key ? contentStore() : null
  const entries = store ? await readEntries(store, providers) : providers.map(() => null)
  const statuses = {} as Record<CredentialProvider, CredentialSummary>
  for (const [index, provider] of providers.entries()) {
    const entry = entries[index]
    let status: CredentialStatus = environmentToken(provider) ? 'environment' : 'missing'
    if (entry !== null && key) {
      try {
        decrypt(provider, entry, key)
        status = 'saved'
      } catch {
        status = 'unreadable'
      }
    }
    statuses[provider] = { status, revision: revisionOf(entry) }
  }
  return statuses
}

const compareAndSet = `
  local entry = redis.call('GET', KEYS[1])
  local revision = ''
  if entry then
    revision = string.match(entry, '^v1%.([%w_%-]+)%.') or 'invalid'
    if revision ~= 'invalid' and string.len(revision) ~= 16 then revision = 'invalid' end
  end
  if revision ~= ARGV[1] then return 0 end
  if ARGV[2] == '' then
    redis.call('DEL', KEYS[1])
  else
    redis.call('SET', KEYS[1], ARGV[2])
  end
  return 1
`

async function updateEntry(store: Store, provider: CredentialProvider, revision: string, value: string) {
  if (!isCredentialRevision(revision)) throw new Error('Invalid credential revision')
  if (store.driver === 'redis') {
    const result = await redisCommand(store, ['EVAL', compareAndSet, '1', keyPrefix + provider, revision, value])
    if (result !== 0 && result !== 1) throw new Error('Credential change was not confirmed')
    return result === 1
  }
  const db = openCredentialDatabase(store.file)
  try {
    db.exec('BEGIN IMMEDIATE')
    const [current] = db.prepare('SELECT ciphertext FROM service_credentials WHERE provider = ?')
      .all<{ ciphertext: string }>(provider)
    if (revision !== revisionOf(current?.ciphertext ?? null)) {
      db.exec('ROLLBACK')
      return false
    }
    if (value) {
      db.prepare(`
        INSERT INTO service_credentials (provider, ciphertext) VALUES (?, ?)
        ON CONFLICT (provider) DO UPDATE SET ciphertext = excluded.ciphertext
      `).run(provider, value)
    } else {
      db.prepare('DELETE FROM service_credentials WHERE provider = ?').run(provider)
    }
    db.exec('COMMIT')
    return true
  } finally {
    db.close()
  }
}

export async function saveServiceToken(provider: CredentialProvider, revision: string, token: string) {
  const key = encryptionKey()
  const store = key ? contentStore() : null
  if (!store || !key || !isServiceToken(token)) throw new Error('Credential cannot be saved')
  return updateEntry(store, provider, revision, encrypt(provider, token, key))
}

export async function removeServiceToken(provider: CredentialProvider, revision: string) {
  const store = credentialStorageEnabled() ? contentStore() : null
  if (!store) throw new Error('Credential storage is unavailable')
  return updateEntry(store, provider, revision, '')
}

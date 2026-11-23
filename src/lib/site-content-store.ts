import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { cache } from 'react'
import { connection } from 'next/server.js'
import { defaultSiteContent, siteSections, validateSiteSection, type SiteContent, type SiteSection } from './site-content.ts'

type Entry = { revision: string; value: unknown }

const sections = Object.keys(siteSections) as SiteSection[]
const keyPrefix = 'adazol:portfolio:content:v1:'

export function contentStore() {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (redisUrl || redisToken) {
    if (!redisUrl || !redisToken) return null
    try {
      const url = new URL(redisUrl)
      if (url.protocol === 'https:' && !url.username && !url.password && url.pathname === '/' && !url.search && !url.hash) {
        return { driver: 'redis' as const, url, token: redisToken }
      }
    } catch {}
    return null
  }
  const file = process.env.PORTFOLIO_CONTENT_DB_PATH?.trim()
  if (!process.env.VERCEL && (file || process.env.NODE_ENV === 'development')) {
    return { driver: 'sqlite' as const, file: file || '.local/portfolio-content.sqlite' }
  }
  return null
}

type Store = NonNullable<ReturnType<typeof contentStore>>
type Database = {
  close(): void
  exec(sql: string): void
  prepare(sql: string): {
    all<Row>(...args: string[]): Row[]
    run(...args: string[]): { changes: number | bigint }
  }
}

export function openContentDatabase(file: string): Database {
  const sqlite = process.getBuiltinModule('node:sqlite') as { DatabaseSync: new (path: string) => Database } | undefined
  if (!sqlite) throw new Error('SQLite is unavailable')
  mkdirSync(dirname(file), { recursive: true })
  const db = new sqlite.DatabaseSync(file)
  try {
    db.exec(`
      PRAGMA busy_timeout = 3000;
      CREATE TABLE IF NOT EXISTS site_content (
        section TEXT PRIMARY KEY,
        revision TEXT NOT NULL,
        value TEXT NOT NULL
      ) WITHOUT ROWID;
    `)
    return db
  } catch (error) {
    db.close()
    throw error
  }
}

export async function redisCommand(store: Extract<Store, { driver: 'redis' }>, command: string[]): Promise<unknown> {
  const reply = await fetch(store.url, {
    method: 'POST',
    headers: { authorization: `Bearer ${store.token}`, 'content-type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(3500)
  })
  if (!reply.ok) {
    void reply.body?.cancel().catch(() => {})
    throw new Error('Content database request failed')
  }
  const payload = await reply.json()
  if (!payload || !Object.hasOwn(payload, 'result') || payload.error) throw new Error('Invalid content database response')
  return payload.result
}

async function readEntries(store: Store): Promise<(Entry | null)[]> {
  if (store.driver === 'sqlite') {
    if (!existsSync(store.file)) return sections.map(() => null)
    const db = openContentDatabase(store.file)
    try {
      const rows = new Map(db.prepare('SELECT section, revision, value FROM site_content').all<{ section: string; revision: string; value: string }>().map(row => [row.section, row]))
      return sections.map(section => {
        const row = rows.get(section)
        return row ? { revision: row.revision, value: JSON.parse(row.value) } : null
      })
    } finally {
      db.close()
    }
  }

  const results = await redisCommand(store, ['MGET', ...sections.map(section => keyPrefix + section)])
  if (!Array.isArray(results) || results.length !== sections.length) throw new Error('Invalid content database response')
  return results.map(result => {
    if (result === null) return null
    if (typeof result !== 'string') throw new Error('Invalid content database entry')
    return JSON.parse(result) as Entry
  })
}

export function isContentRevision(value: unknown): value is string {
  return typeof value === 'string' && (value === '' || /^[a-f0-9-]{36}$/.test(value))
}

// Preserve published values when future versions add fields to a section.
function restoreSection(template: unknown, published: unknown): unknown {
  if (Array.isArray(template)) {
    return Array.isArray(published) ? published.map(item => restoreSection(template[0], item)) : published
  }
  if (template && typeof template === 'object' && published && typeof published === 'object' && !Array.isArray(published)) {
    const saved = published as Record<string, unknown>
    return Object.fromEntries(Object.entries(template).map(([key, fallback]) =>
      [key, Object.hasOwn(saved, key) ? restoreSection(fallback, saved[key]) : fallback]
    ))
  }
  return published
}

export async function readPublishedContent() {
  const store = contentStore()
  const entries = store ? await readEntries(store) : sections.map(() => null)
  const content = { ...defaultSiteContent }
  const revisions = {} as Record<SiteSection, string>
  for (const [index, section] of sections.entries()) {
    const entry = entries[index]
    revisions[section] = ''
    if (!entry) continue
    const restored = restoreSection(defaultSiteContent[section], entry.value)
    if (!entry.revision || !isContentRevision(entry.revision) || validateSiteSection(section, restored)) {
      throw new Error('Invalid published content')
    }
    Object.assign(content, { [section]: restored })
    revisions[section] = entry.revision
  }
  return { content, revisions }
}

export const getSiteContent = cache(async (): Promise<SiteContent> => {
  await connection()
  if (!contentStore()) return defaultSiteContent
  try {
    return (await readPublishedContent()).content
  } catch {
    console.error('Unable to read published portfolio content')
    return defaultSiteContent
  }
})

const compareAndSet = `
  local current = redis.call('GET', KEYS[1])
  if (not current and ARGV[1] ~= '') or (current and cjson.decode(current).revision ~= ARGV[1]) then
    return 0
  end
  redis.call('SET', KEYS[1], ARGV[2])
  return 1
`

export async function publishSiteSection(section: SiteSection, previousRevision: string, value: unknown) {
  const store = contentStore()
  if (!store) throw new Error('Content database has not been configured')
  const revision = randomUUID()
  if (store.driver === 'sqlite') {
    const db = openContentDatabase(store.file)
    try {
      const result = previousRevision === ''
        ? db.prepare('INSERT OR IGNORE INTO site_content (section, revision, value) VALUES (?, ?, ?)').run(section, revision, JSON.stringify(value))
        : db.prepare('UPDATE site_content SET revision = ?, value = ? WHERE section = ? AND revision = ?').run(revision, JSON.stringify(value), section, previousRevision)
      return Number(result.changes) === 1 ? revision : null
    } finally {
      db.close()
    }
  }

  const result = await redisCommand(store, ['EVAL', compareAndSet, '1', keyPrefix + section, previousRevision, JSON.stringify({ revision, value })])
  if (result !== 0 && result !== 1) throw new Error('Invalid publish response')
  return result === 1 ? revision : null
}

import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { isVisitorCount } from './portfolio-visitors.ts'

// The repository's Node type package predates the runtime's built-in SQLite module.
type LocalDatabase = {
  close: () => void,
  exec: (sql: string) => void,
  prepare: (sql: string) => {
    run: (path: string, fingerprint: string) => unknown,
    get: (path: string) => { count: number } | undefined
  }
}

export function recordLocalVisitor (filename: string, path: string, fingerprint: string): number {
  const sqlite = process.getBuiltinModule('node:sqlite') as { DatabaseSync: new (path: string) => LocalDatabase } | undefined
  if (!sqlite) throw new Error('SQLite is unavailable')

  mkdirSync(dirname(filename), { recursive: true })
  const database = new sqlite.DatabaseSync(filename)
  try {
    database.exec(`
      PRAGMA busy_timeout = 3000;
      CREATE TABLE IF NOT EXISTS portfolio_visitors (
        path TEXT NOT NULL,
        fingerprint TEXT NOT NULL,
        PRIMARY KEY (path, fingerprint)
      ) WITHOUT ROWID;
    `)
    database.prepare(`
      INSERT INTO portfolio_visitors (path, fingerprint) VALUES (?, ?)
      ON CONFLICT (path, fingerprint) DO NOTHING
    `).run(path, fingerprint)

    const count = database.prepare('SELECT COUNT(*) AS count FROM portfolio_visitors WHERE path = ?').get(path)?.count
    if (!isVisitorCount(count)) throw new Error('Invalid SQLite count')
    return count
  } finally {
    database.close()
  }
}

export function createRedisVisitorRecorder (url: string | undefined, token: string | undefined, send: typeof fetch) {
  if (!url?.trim() || !token?.trim()) return null
  let endpoint: URL
  try {
    endpoint = new URL(url.trim())
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.pathname !== '/' || endpoint.search || endpoint.hash) return null
    endpoint.pathname = '/multi-exec'
  } catch {
    return null
  }

  return async function recordRedisVisitor (path: string, fingerprint: string, signal: AbortSignal): Promise<number> {
    const key = `adazol:portfolio:visitors:v1:${path}`
    const response = await send(endpoint, {
      method: 'POST',
      headers: { authorization: `Bearer ${token.trim()}`, 'content-type': 'application/json' },
      body: JSON.stringify([['SADD', key, fingerprint], ['SCARD', key]]),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.any([signal, AbortSignal.timeout(4_000)])
    })
    if (!response.ok) {
      void response.body?.cancel().catch(() => {})
      throw new Error('Redis request failed')
    }

    const result = await response.json()
    if (!Array.isArray(result) || result.length !== 2) throw new Error('Invalid Redis transaction')
    const [added, counted] = result
    if ((added?.result !== 0 && added?.result !== 1) || !isVisitorCount(counted?.result)) {
      throw new Error('Invalid Redis count')
    }
    return counted.result
  }
}

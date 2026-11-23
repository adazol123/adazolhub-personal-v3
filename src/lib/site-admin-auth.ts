import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { cookies, headers } from 'next/headers'
import { isIP } from 'node:net'

export const adminCookie = 'adazol_admin'
export const adminSessionSeconds = 60 * 60 * 8

function accessPath() {
  const path = process.env.PORTFOLIO_ADMIN_PATH?.trim()
  return path && /^[a-z0-9][a-z0-9-]{15,79}$/.test(path) ? path : null
}

function adminAccounts(): Record<string, string> | null {
  try {
    const value = JSON.parse(process.env.PORTFOLIO_ADMIN_ACCOUNTS ?? '{}')
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    const entries = Object.entries(value)
    if (!entries.length || entries.some(([name, password]) =>
      !/^[a-zA-Z0-9._@+-]{1,100}$/.test(name) || typeof password !== 'string' ||
      password.length < 24 || password.length > 256
    )) return null
    return value
  } catch {
    return null
  }
}

function sameSecret(a: string, b: string) {
  const hash = (value: string) => createHash('sha256').update(value).digest()
  return timingSafeEqual(hash(a), hash(b))
}

export function adminEnabled(path: string) {
  const configured = accessPath()
  return Boolean(typeof path === 'string' && path.length <= 80 && configured && sameSecret(configured, path) && adminAccounts())
}

function accountPassword(username: string) {
  const accounts = adminAccounts()
  return accounts && Object.hasOwn(accounts, username) ? accounts[username] : null
}

function signature(path: string, payload: string, password: string) {
  return createHmac('sha256', password).update('adazol-admin:v1:').update(path).update(':').update(payload).digest('base64url')
}

export function createAdminSession(path: string, username: string, password: string) {
  if (!adminEnabled(path)) return null
  const configured = accountPassword(username)
  if (!sameSecret(password, configured ?? '\0') || !configured) return null
  const expires = Math.floor(Date.now() / 1000) + adminSessionSeconds
  const payload = Buffer.from(JSON.stringify({ username, expires })).toString('base64url')
  return `${payload}.${signature(path, payload, configured)}`
}

export async function getAdminSession(path: string): Promise<string | null> {
  if (!adminEnabled(path)) return null
  const token = (await cookies()).get(adminCookie)?.value
  if (!token || token.length > 512 || !/^[\w-]+\.[\w-]{43}$/.test(token)) return null
  const [payload, proof] = token.split('.')
  try {
    const { username, expires } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (typeof username !== 'string' || !Number.isSafeInteger(expires) || expires <= Date.now() / 1000) return null
    const password = accountPassword(username)
    return password && sameSecret(proof, signature(path, payload, password)) ? username : null
  } catch {
    return null
  }
}

export function adminCookieOptions(path: string) {
  return { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: `/admin/${path}` } as const
}

let loginWindowEnds = 0
let loginWindowAttempts = 0
const loginAttempts = new Map<string, number>()

export async function allowAdminLogin() {
  const forwarded = process.env.VERCEL === '1' ? (await headers()).get('x-vercel-forwarded-for')?.trim() : null
  const client = forwarded && isIP(forwarded) ? forwarded : 'anonymous'
  if (Date.now() >= loginWindowEnds) {
    loginWindowEnds = Date.now() + 60_000
    loginWindowAttempts = 0
    loginAttempts.clear()
  }
  const attempts = loginAttempts.get(client) ?? 0
  if (attempts >= 10 || loginWindowAttempts >= 100) return false
  loginAttempts.set(client, attempts + 1)
  loginWindowAttempts++
  return true
}

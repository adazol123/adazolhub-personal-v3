'use server'

import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { adminCookie, adminCookieOptions, adminEnabled, adminSessionSeconds, allowAdminLogin, createAdminSession, getAdminSession } from '@/lib/site-admin-auth'
import { isSiteSection, maxSectionBytes, validateSiteSection } from '@/lib/site-content'
import { isContentRevision, publishSiteSection } from '@/lib/site-content-store'

export async function signIn(path: string, _previous: string, form: FormData) {
  if (!adminEnabled(path)) notFound()
  if (!await allowAdminLogin()) return 'Too many sign-in attempts. Try again in one minute.'
  if (!(form instanceof FormData)) return 'Check your username and password.'
  const username = form.get('username')
  const password = form.get('password')
  if (typeof username !== 'string' || typeof password !== 'string' || username.length > 100 || password.length > 256) {
    return 'Check your username and password.'
  }
  const session = createAdminSession(path, username.trim(), password)
  if (!session) return 'Check your username and password.'

  const jar = await cookies()
  jar.set(adminCookie, session, { ...adminCookieOptions(path), maxAge: adminSessionSeconds })
  redirect(`/admin/${path}`)
}

export async function signOut(path: string) {
  if (!adminEnabled(path)) notFound()
  const jar = await cookies()
  jar.set(adminCookie, '', { ...adminCookieOptions(path), maxAge: 0 })
  redirect(`/admin/${path}`)
}

export async function publish(path: string, section: string, revision: string, json: string) {
  if (!await getAdminSession(path)) return { error: 'Your session has ended. Reload this page and sign in again.' }
  if (typeof section !== 'string' || !isSiteSection(section) || !isContentRevision(revision) ||
      typeof json !== 'string' || Buffer.byteLength(json) > maxSectionBytes) {
    return { error: 'This section could not be read or exceeds the publish limit.' }
  }
  let value: unknown
  try {
    value = JSON.parse(json)
  } catch {
    return { error: 'This section could not be read.' }
  }
  const error = validateSiteSection(section, value)
  if (error) return { error }
  let saved: string | null
  try {
    saved = await publishSiteSection(section, revision, value)
  } catch {
    return { error: 'The content database could not confirm the update. Reload to check the published version before trying again.' }
  }
  if (!saved) return { error: 'This section changed since you opened it. Reload to get the current version before publishing again.' }
  revalidatePath('/', 'layout')
  return { revision: saved }
}

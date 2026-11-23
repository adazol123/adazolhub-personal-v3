'use server'

import { revalidatePath } from 'next/cache'
import { readContactAddresses } from '@/lib/portfolio-contact'
import { getAdminSession } from '@/lib/site-admin-auth'
import {
  credentialStorageEnabled, isCredentialProvider, isCredentialRevision, isServiceToken, readServiceToken,
  removeServiceCredential, saveServiceCredential, type CredentialProvider
} from '@/lib/service-credentials'

type Result = { message: string; error: boolean }

export async function updateCredential(path: string, provider: CredentialProvider, revision: string, _prior: Result, form: FormData): Promise<Result> {
  if (!await getAdminSession(path)) return { message: 'Your session has ended. Reload this page and sign in again.', error: true }
  if (!isCredentialProvider(provider) || !(form instanceof FormData)) return { message: 'Unknown credential.', error: true }
  const intent = form.get('intent')

  if (provider === 'github' && intent === 'check') {
    const token = await readServiceToken('github')
    if (!token) return { message: 'Save a GitHub token before checking the connection.', error: true }
    try {
      const reply = await fetch('https://api.github.com/user', {
        headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' },
        cache: 'no-store',
        redirect: 'error',
        signal: AbortSignal.timeout(5000)
      })
      await reply.body?.cancel().catch(() => {})
      return reply.ok
        ? { message: 'GitHub accepted the token.', error: false }
        : { message: 'GitHub did not accept the token. Check that it is active and try again.', error: true }
    } catch {
      return { message: 'Could not reach GitHub to check the token.', error: true }
    }
  }

  if (!isCredentialRevision(revision)) return { message: 'Reload to get the current credential status.', error: true }
  if (!credentialStorageEnabled()) return { message: 'Encrypted credential storage is unavailable.', error: true }
  let changed: boolean
  try {
    if (intent === 'save') {
      if (provider === 'contactEmail') {
        const addresses = readContactAddresses(form.get('from'), form.get('to'))
        if (!addresses || addresses.from.length > 512) {
          return { message: 'Enter one valid sender and one valid recipient email address.', error: true }
        }
        changed = await saveServiceCredential(provider, revision, JSON.stringify(addresses))
      } else {
        const token = form.get('token')
        const value = typeof token === 'string' ? token.trim() : token
        if (!isServiceToken(value)) return { message: 'Enter a valid token with 16–2,048 characters and no spaces.', error: true }
        changed = await saveServiceCredential(provider, revision, value)
      }
    } else if (intent === 'remove') {
      changed = await removeServiceCredential(provider, revision)
    } else {
      return { message: 'Choose an action to continue.', error: true }
    }
  } catch {
    return { message: 'Could not confirm the change. Reload to check the credential status.', error: true }
  }
  revalidatePath(`/admin/${path}`)
  if (!changed) return { message: 'The credential changed in another session. Check its current status before trying again.', error: true }
  if (provider === 'contactEmail' || provider === 'resend') revalidatePath('/contact')
  if (intent === 'remove') return { message: 'Saved override removed.', error: false }
  return { message: provider === 'contactEmail' ? 'Contact addresses saved.' : 'Credential saved.', error: false }
}

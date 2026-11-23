'use server'

import { revalidatePath } from 'next/cache'
import { getAdminSession } from '@/lib/site-admin-auth'
import {
  credentialStorageEnabled, isCredentialProvider, isCredentialRevision, isServiceToken, readServiceToken,
  removeServiceToken, saveServiceToken, type CredentialProvider
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
      const value = form.get('token')
      const token = typeof value === 'string' ? value.trim() : value
      if (!isServiceToken(token)) return { message: 'Enter a valid token with 16–2,048 characters and no spaces.', error: true }
      changed = await saveServiceToken(provider, revision, token)
    } else if (intent === 'remove') {
      changed = await removeServiceToken(provider, revision)
    } else {
      return { message: 'Choose an action to continue.', error: true }
    }
  } catch {
    return { message: 'Could not confirm the change. Reload to check the credential status.', error: true }
  }
  revalidatePath(`/admin/${path}`)
  if (!changed) return { message: 'The credential changed in another session. Check its current status before trying again.', error: true }
  return { message: intent === 'save' ? 'Credential saved.' : 'Saved override removed.', error: false }
}

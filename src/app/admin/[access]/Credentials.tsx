'use client'

import { useActionState } from 'react'
import type { CredentialProvider, CredentialStatus, CredentialSummary } from '@/lib/service-credentials'
import styles from './admin.module.css'

const providers = {
  gemini: { name: 'Gemini', description: 'API key used by Dan AI to answer portfolio questions.' },
  github: { name: 'GitHub', description: 'Optional token for the connection check below. The public activity feed uses public GitHub data.' },
  resend: { name: 'Resend', description: 'API key used to send contact form messages. Sender and recipient addresses come from the server configuration.' }
}

const statusText: Record<CredentialStatus, string> = {
  saved: 'Saved override',
  environment: 'From server environment',
  missing: 'No credential configured',
  unreadable: 'Saved override could not be decrypted'
}

type Result = { message: string; error: boolean }
type Update = (provider: CredentialProvider, revision: string, previous: Result, form: FormData) => Promise<Result>

function CredentialForm({ provider, summary, enabled, update }: {
  provider: CredentialProvider
  summary: CredentialSummary
  enabled: boolean
  update: Update
}) {
  const { status, revision } = summary
  const [result, action, pending] = useActionState(update.bind(null, provider, revision), { message: '', error: false })
  const { name, description } = providers[provider]
  const hasOverride = status === 'saved' || status === 'unreadable'

  return (
    <form action={action} className={styles.group}>
      <h3>{name}</h3>
      <p>{description}</p>
      <p className={styles.credentialStatus}>{statusText[status]}</p>
      <div className={styles.fields}>
        {enabled && <label>New {name} token
          <input type="password" name="token" autoComplete="new-password" spellCheck={false} maxLength={2048} disabled={pending} />
        </label>}
        {result.message && <p role={result.error ? 'alert' : 'status'} className={result.error ? styles.error : styles.success}>{result.message}</p>}
        <div className={styles.rowActions}>
          {enabled && <button type="submit" name="intent" value="save" className={styles.primary} disabled={pending}>Save token</button>}
          {provider === 'github' && <button type="submit" name="intent" value="check" className={styles.button}
            disabled={pending || status === 'missing' || status === 'unreadable'}>Check connection</button>}
          {enabled && hasOverride && <button type="submit" name="intent" value="remove" className={styles.button} disabled={pending}>Remove override</button>}
        </div>
      </div>
    </form>
  )
}

export function Credentials({ enabled, statuses, update }: {
  enabled: boolean
  statuses: Record<CredentialProvider, CredentialSummary> | null
  update: Update
}) {
  return (
    <section className={styles.content} aria-labelledby="credentials-heading">
      <div className={styles.sectionHeader}><h2 id="credentials-heading">Service credentials</h2></div>
      <div className={styles.fields}>
        {!enabled && <p>Set a server-side <code>PORTFOLIO_CREDENTIALS_KEY</code> and configure the content database to enable saved overrides.</p>}
        {!statuses
          ? <p role="alert">Credential storage is temporarily unavailable.</p>
          : <>
            {enabled && <p>Saved tokens are encrypted and never displayed. Removing an override restores the server environment value, if configured.</p>}
            {(Object.keys(providers) as CredentialProvider[]).map(provider => (
              <CredentialForm key={provider} provider={provider} summary={statuses[provider]} enabled={enabled} update={update} />
            ))}
          </>}
      </div>
    </section>
  )
}

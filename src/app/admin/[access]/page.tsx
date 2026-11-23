import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { adminEnabled, getAdminSession } from '@/lib/site-admin-auth'
import { contentStore, readPublishedContent } from '@/lib/site-content-store'
import { credentialStorageEnabled, readCredentialStatuses } from '@/lib/service-credentials'
import { Credentials } from './Credentials'
import { updateCredential } from './credential-actions'
import { signIn, signOut, publish } from './actions'
import { Editor, LoginForm } from './Editor'
import styles from './admin.module.css'

export const metadata: Metadata = { title: 'Site administration', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function AdminPage({ params }: { params: Promise<{ access: string }> }) {
  const { access } = await params
  if (!adminEnabled(access)) notFound()
  const username = await getAdminSession(access)
  if (!username) return (
    <section className={styles.login}>
      <h1>Admin sign-in</h1>
      <LoginForm action={signIn.bind(null, access)} />
    </section>
  )

  const [published, statuses] = await Promise.all([
    contentStore() ? readPublishedContent().catch(() => null) : null,
    readCredentialStatuses().catch(() => null)
  ])
  const credentials = <Credentials enabled={credentialStorageEnabled()} statuses={statuses} update={updateCredential.bind(null, access)} />
  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <h1>Site administration</h1>
          <p>Publish updates to the live portfolio.</p>
        </div>
        <form action={signOut.bind(null, access)}>
          <button className={styles.button} type="submit">Sign out</button>
        </form>
      </header>
      {published
        ? <Editor {...published} publish={publish.bind(null, access)} credentials={credentials} />
        : <p role="alert" className={styles.feedback}>The content database is unavailable. Check the server configuration before publishing.</p>}
    </section>
  )
}

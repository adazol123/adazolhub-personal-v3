import type { Metadata } from 'next'
import { ArrowUpRight } from 'lucide-react'
import ContactForm from '@/components/portfolio/ContactForm'
import styles from '@/components/portfolio/ContactForm.module.css'
import { publicEmail } from '@/lib/portfolio-content'
import { getSiteContent } from '@/lib/site-content-store'
import { getContactConfig } from '@/lib/portfolio-contact-server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Daniel Lozada about a role, a project, or his work.'
}

export default async function ContactPage() {
  const { site } = await getSiteContent()
  return (
    <section className={`interior-page ${styles.page}`}>
      <header className={`page-heading ${styles.intro}`}>
        <h1>Get in <em>touch.</em></h1>
        <p>Have a role, project, or question in mind? I’d be glad to hear from you.</p>
        <dl className={styles.channels}>
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${publicEmail}`}>
                <span>{publicEmail}</span><ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </dd>
          </div>
          <div>
            <dt>LinkedIn</dt>
            <dd>
              <a href={site.profiles.LinkedIn}>
                <span>Daniel Lozada</span><ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </dd>
          </div>
        </dl>
      </header>
      <ContactForm enabled={Boolean(await getContactConfig())} />
    </section>
  )
}

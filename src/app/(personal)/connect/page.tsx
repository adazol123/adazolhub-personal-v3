import type { Metadata } from 'next'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { getSiteContent } from '@/lib/site-content-store'

export const metadata: Metadata = { title: 'Connect', alternates: { canonical: '/connect' } }

export default async function ConnectPage() {
  const { site } = await getSiteContent()
  return (
    <div className="interior-page">
      <header className="page-heading"><h1>Find me <em>elsewhere.</em></h1><p>Code, design, and professional profiles.</p></header>
      <ul className="note-index profile-index">
        {Object.entries(site.profiles).map(([label, href]) => <li key={label}><a href={href}>{label}<ArrowUpRight size={16} aria-hidden="true" /></a></li>)}
      </ul>
      <div className="hero-actions"><Link className="portfolio-button" href="/contact">Get in touch</Link></div>
    </div>
  )
}

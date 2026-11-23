import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'References', alternates: { canonical: '/testimonial' } }

export default function ReferencesPage() {
  return (
    <div className="interior-page">
      <header className="page-heading">
        <h1>References</h1>
      </header>
      <div className="reading-body reading-card">
        <p>For a hiring process or collaboration, tell me what you’d like a reference to speak to and when you need it.</p>
        <div className="hero-actions"><Link className="portfolio-button" href="/contact">Request a reference</Link><Link className="text-link" href="/portfolio">Read the case studies</Link></div>
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { getSiteContent } from '@/lib/site-content-store'

export const metadata: Metadata = { title: 'Availability', alternates: { canonical: '/availability' } }

export default async function AvailabilityPage() {
  const { site } = await getSiteContent()
  return (
    <div className="interior-page">
      <header className="page-heading">
        <h1>{site.availability}</h1>
        <p>{site.availabilityIntroduction}</p>
      </header>
      <div className="reading-body reading-card">
        <h2>{site.availabilityHeading}</h2>
        <p>{site.availabilityDetails}</p>
        <div className="hero-actions"><Link className="portfolio-button" href="/contact">Get in touch</Link><Link className="text-link" href="/cv">Read my resume</Link></div>
      </div>
    </div>
  )
}

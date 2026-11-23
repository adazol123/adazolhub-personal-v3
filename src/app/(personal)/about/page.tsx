import type { Metadata } from 'next'
import SkeletonImage from '@/components/portfolio/SkeletonImage'
import Link from 'next/link'
import { getSiteContent } from '@/lib/site-content-store'

export const metadata: Metadata = { title: 'About', alternates: { canonical: '/about' } }

export default async function AboutPage() {
  const { about } = await getSiteContent()
  return (
    <article className="interior-page interior-page--contained">
      <header className="page-heading">
        <h1>{about.title} <em>{about.titleAccent}</em></h1>
        <p>{about.introduction}</p>
      </header>
      <div className="reading-layout">
        <div className="reading-body reading-card">
          <h2>{about.careerHeading}</h2>
          {about.careerParagraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          <h2>{about.siteHeading}</h2>
          <p>{about.siteDescription}</p>
          <div className="hero-actions">
            <Link className="quiet-link" href="/thread">{about.notesLink}</Link>
            <Link className="text-link" href="/competencies">{about.skillsLink}</Link>
          </div>
        </div>
        <aside className="detail-aside about-photo">
          <div className="about-photo-image skeleton-media"><SkeletonImage src="/work/daniel.webp" alt="Daniel Lozada" width={320} height={320} /></div>
          <Link className="text-link" href="/cv">{about.resumeLink}</Link>
        </aside>
      </div>
    </article>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { getSiteContent } from '@/lib/site-content-store'

export const metadata: Metadata = { title: 'Engineering skills', alternates: { canonical: '/competencies' } }

export default async function CompetenciesPage() {
  const { resume } = await getSiteContent()
  return (
    <div className="interior-page interior-page--contained">
      <header data-reveal-children className="page-heading"><h1>Engineering <em>skills.</em></h1></header>
      <div data-reveal-children className="thread-list">
        {resume.skills.map((skill, index) => <section className="reading-body reading-card" key={index}><h2>{skill.label}</h2><p>{skill.description}</p></section>)}
      </div>
      <div className="hero-actions"><Link className="portfolio-button" href="/portfolio">Explore the case studies</Link></div>
    </div>
  )
}

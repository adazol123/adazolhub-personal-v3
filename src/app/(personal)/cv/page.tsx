import type { Metadata } from 'next'
import { ArrowUpRight } from 'lucide-react'
import { resumeDocuments } from '@/lib/portfolio-content'
import { getSiteContent } from '@/lib/site-content-store'

export const metadata: Metadata = { title: 'Resume', alternates: { canonical: '/cv' } }

export default async function ResumePage() {
  const { resume } = await getSiteContent()
  const labels = [resume.standard.label, resume.ats.label]
  return (
    <article className="interior-page interior-page--contained resume-page">
      <header className="page-heading">
        <h1>{resume.title}</h1>
        <p>{resume.introduction}</p>
        <div className="hero-actions">
          {resumeDocuments.map(({ path }, index) => (
            <a className="portfolio-button" href={path} key={path} target="_blank" rel="noreferrer"
              aria-label={`${labels[index]} PDF (opens in a new tab)`}>
              {labels[index]} PDF <ArrowUpRight aria-hidden="true" size={16} />
            </a>
          ))}
        </div>
      </header>
      <div className="reading-layout">
        <section className="reading-body reading-card">
          <h2>{resume.experienceHeading}</h2>
          <ol className="career-list">
            {resume.career.map((job, index) => <li key={index}>
              <p className="eyebrow">{job.period}</p>
              <h3>{job.role}{job.organization && <span> · {job.organization}</span>}</h3>
              <p>{job.description}</p>
            </li>)}
          </ol>
        </section>
        <aside className="detail-aside" aria-label={resume.skillsHeading}>
          <h2 className="eyebrow">{resume.skillsHeading}</h2>
          <ul className="plain-list compact-skills">{resume.skills.map((skill, index) => <li key={index}><strong>{skill.label}</strong><p>{skill.description}</p></li>)}</ul>
        </aside>
      </div>
    </article>
  )
}

import Link from 'next/link'
import { ArrowDown, ArrowUpRight } from 'lucide-react'
import AskDan from '@/components/portfolio/AskDan'
import GitHubActivityOverview from '@/components/portfolio/GitHubActivityOverview'
import JumpLink from '@/components/portfolio/JumpLink'
import Portrait from '@/components/portfolio/Portrait'
import WorkList from '@/components/portfolio/WorkList'
import { getSiteContent } from '@/lib/site-content-store'

export const revalidate = 21600

export default async function Home() {
  const { landing, notes, site, work } = await getSiteContent()
  return (
    <>
      <section className="portfolio-hero" data-portrait={landing.showPortrait} aria-labelledby="intro-title">
        <div className="hero-copy">
          <p className="eyebrow hero-kicker">{landing.role} <span aria-hidden="true">/</span> {landing.location}</p>
          <h1 id="intro-title">{landing.firstName} <em>{landing.lastName}</em></h1>
          <p className="hero-description">{landing.introduction}</p>
          <div className="hero-actions">
            <JumpLink className="portfolio-button" href="#featured-work" smooth>{landing.workButton} <ArrowDown aria-hidden="true" size={16} /></JumpLink>
            <JumpLink className="quiet-link" href="#ask-dan" smooth>{landing.assistantButton} <ArrowDown aria-hidden="true" size={15} /></JumpLink>
          </div>
          <Link className="hero-availability" href="/availability"><span aria-hidden="true" />{site.availability}</Link>
        </div>
        {landing.showPortrait && <div className="hero-portrait"><Portrait /></div>}
        <div className="home-assistant"><AskDan /></div>
      </section>
      <section className="editorial-section" aria-labelledby="featured-work">
        <div className="section-heading">
          <h2 id="featured-work" tabIndex={-1}>{landing.selectedWorkHeading}</h2>
          <Link className="quiet-link" href="/portfolio">{landing.portfolioLink} <ArrowUpRight aria-hidden="true" size={16} /></Link>
        </div>
        <WorkList work={work} />
      </section>
      {landing.showActivity && <GitHubActivityOverview />}
      {landing.showNotes && notes.entries.length > 0 && <section className="editorial-section" aria-labelledby="field-notes">
        <div className="section-heading">
          <h2 id="field-notes">{landing.notesHeading}</h2>
          <Link className="quiet-link" href="/thread">{landing.notesLink} <ArrowUpRight aria-hidden="true" size={16} /></Link>
        </div>
        <ul className="note-index">
          {notes.entries.map(note => <li key={note.slug}>
            <Link href={`/thread#${note.slug}`}><span>{note.title}</span><small>{note.topic}</small></Link>
          </li>)}
        </ul>
      </section>}
      <section className="footer-invitation" aria-labelledby="want-to-talk">
        <h2 id="want-to-talk">{landing.contactHeading}</h2>
        <div><Link className="portfolio-button" href="/contact">{landing.contactButton}</Link><a className="text-link" href={site.profiles.LinkedIn}>LinkedIn</a></div>
      </section>
    </>
  )
}

import Link from 'next/link'
import { AudioLines, Compass, MapPin, Mouse } from 'lucide-react'
import AskDan from '@/components/portfolio/AskDan'
import GitHubActivityOverview from '@/components/portfolio/GitHubActivityOverview'
import JumpLink from '@/components/portfolio/JumpLink'
import Portrait from '@/components/portfolio/Portrait'
import TerrainStudy from '@/components/portfolio/TerrainStudy'
import WorkList from '@/components/portfolio/WorkList'
import { getSiteContent } from '@/lib/site-content-store'

export const revalidate = 21600

export default async function Home() {
  const { landing, notes, site, work } = await getSiteContent()
  return (
    <>
      <section className="atlas-hero" aria-labelledby="intro-title">
        <div className="atlas-intro">
          <p className="atlas-kicker"><span aria-hidden="true" />{landing.role}</p>
          <h1 id="intro-title"><span>{landing.firstName}</span> <em>{landing.lastName}</em></h1>
          <p className="atlas-description">{landing.introduction}</p>
          <div className="hero-actions">
            <JumpLink className="portfolio-button" href="#featured-work" smooth><Compass size={17} aria-hidden="true" />{landing.workButton}</JumpLink>
            <JumpLink className="quiet-link" href="#ask-dan" smooth><AudioLines size={17} aria-hidden="true" />{landing.assistantButton}</JumpLink>
          </div>
        </div>
        <TerrainStudy />
      </section>
      <div className="field-strip">
        <div><span><MapPin size={14} aria-hidden="true"/>{landing.location}</span>
          <Link className="field-status" href="/availability"><i aria-hidden="true"/>{site.availability}</Link></div>
        <JumpLink href="#featured-work" smooth><Mouse size={14} aria-hidden="true"/> Scroll to work</JumpLink>
      </div>
      <section className="editorial-section work-section" aria-labelledby="featured-work">
        <div className="section-heading">
          <h2 id="featured-work" tabIndex={-1}>{landing.selectedWorkHeading}</h2>
          <Link className="index-link" href="/portfolio">{landing.portfolioLink}</Link>
        </div>
        <WorkList work={work} />
      </section>
      <div className="assistant-desk" data-portrait={landing.showPortrait}>
        {landing.showPortrait && <Portrait />}
        <AskDan />
      </div>
      {landing.showActivity && <GitHubActivityOverview />}
      {landing.showNotes && notes.entries.length > 0 && <section className="editorial-section" aria-labelledby="field-notes">
        <div className="section-heading">
          <h2 id="field-notes">{landing.notesHeading}</h2>
          <Link className="index-link" href="/thread">{landing.notesLink}</Link>
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

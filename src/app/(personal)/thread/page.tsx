import type { Metadata } from 'next'
import Link from 'next/link'
import { getSiteContent } from '@/lib/site-content-store'

export const metadata: Metadata = { title: 'Field notes', alternates: { canonical: '/thread' } }

export default async function ThreadsPage() {
  const { notes } = await getSiteContent()
  return (
    <div className="interior-page interior-page--contained">
      <header className="page-heading">
        <h1>{notes.title} <em>{notes.titleAccent}</em></h1>
        <p>{notes.introduction}</p>
      </header>
      <div className="thread-list">
        {!notes.entries.length && <p>{notes.emptyMessage}</p>}
        {notes.entries.map(note => <article className="reading-body reading-card" id={note.slug} key={note.slug} aria-labelledby={`${note.slug}-heading`} tabIndex={-1}>
          <p className="eyebrow">{note.topic}</p>
          <h2 id={`${note.slug}-heading`}>{note.title}</h2>
          {note.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          <Link className="text-link" href={note.link.href}>{note.link.label}</Link>
        </article>)}
      </div>
    </div>
  )
}

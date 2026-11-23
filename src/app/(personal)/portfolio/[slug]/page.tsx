import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { projectPath, shouldOptimizeProjectImage } from '@/lib/portfolio-content'
import { getSiteContent } from '@/lib/site-content-store'

type Props = { params: Promise<{ slug: string }> }

async function findPublishedProject(params: Props['params']) {
  const { slug } = await params
  const { work } = await getSiteContent()
  return work.projects.find(project => project.slug === slug)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await findPublishedProject(params)
  if (!project) return {}
  return { title: project.name, description: project.summary, alternates: { canonical: projectPath(project.slug) } }
}

export default async function CaseStudyPage({ params }: Props) {
  const project = await findPublishedProject(params)
  if (!project) notFound()
  return (
    <article className="interior-page">
      <Link className="text-link back-link" href="/portfolio"><ArrowLeft aria-hidden="true" size={16} /> All work</Link>
      <header className="page-heading">
        <p className="eyebrow">{project.category}</p>
        <h1>{project.name}</h1>
        <p>{project.summary}</p>
      </header>
      {project.image && <div className="case-study-cover">
        <Image src={project.image} alt={project.alt} fill sizes="(max-width: 960px) 94vw, 900px"
          priority unoptimized={!shouldOptimizeProjectImage(project.image)} />
      </div>}
      <div className="reading-layout">
        <div className="reading-body reading-card case-study-copy">
          <h2>The problem</h2>
          <p>{project.problem}</p>
          <h2>My contribution</h2>
          <p>{project.implementation}</p>
          <h2>Outcome</h2>
          <p>{project.outcome}</p>
        </div>
        <aside className="detail-aside" aria-label="Project details">
          <dl><dt className="eyebrow">My role</dt><dd>{project.role}</dd></dl>
          {project.stack.length > 0 && <>
            <h2 className="eyebrow">Stack</h2>
            <ul className="plain-list">{project.stack.map((tool, index) => <li key={index}>{tool}</li>)}</ul>
          </>}
          {project.links.map((link, index) => <Link className="text-link" href={link.href} key={index}>{link.label}</Link>)}
        </aside>
      </div>
    </article>
  )
}

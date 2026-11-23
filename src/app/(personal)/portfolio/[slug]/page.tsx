import type { Metadata } from 'next'
import SkeletonImage from '@/components/portfolio/SkeletonImage'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { projectPath, shouldOptimizeProjectImage } from '@/lib/portfolio-content'
import { getSiteContent } from '@/lib/site-content-store'

type Props = { params: Promise<{ slug: string }> }

async function getProjectNavigation(params: Props['params']) {
  const { slug } = await params
  const { work } = await getSiteContent()
  const index = work.projects.findIndex(project => project.slug === slug)
  return {
    project: work.projects[index],
    nextProject: work.projects.length > 1 ? work.projects[(index + 1) % work.projects.length] : undefined
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { project } = await getProjectNavigation(params)
  if (!project) return {}
  return { title: project.name, description: project.summary, alternates: { canonical: projectPath(project.slug) } }
}

export default async function CaseStudyPage({ params }: Props) {
  const { project, nextProject } = await getProjectNavigation(params)
  if (!project) notFound()
  const sections = [
    { label: 'The problem', id: 'problem', text: project.problem },
    { label: 'My contribution', id: 'contribution', text: project.implementation },
    { label: 'Outcome', id: 'outcome', text: project.outcome }
  ]
  return (
    <article className="interior-page study-page">
      <Link className="index-link" href="/portfolio">All work</Link>
      <header className="study-intro">
        <div data-reveal-children className="page-heading">
          <p className="atlas-kicker"><span aria-hidden="true" />{project.category}</p>
          <h1>{project.name}</h1>
          <p>{project.summary}</p>
        </div>
        <div data-reveal className="study-facts">
          <dl><dt>My role</dt><dd>{project.role}</dd></dl>
          {project.stack.length > 0 && <dl><dt>Stack</dt><dd><ul>{project.stack.map(tool => <li key={tool}>{tool}</li>)}</ul></dd></dl>}
          {project.links.map((link, index) => <Link className="index-link" href={link.href} key={index}>{link.label}</Link>)}
        </div>
      </header>
      {project.image && <div data-reveal className="case-study-cover skeleton-media">
        <SkeletonImage src={project.image} alt={project.alt} fill sizes="(min-width: 1200px) 1100px, 94vw"
          priority unoptimized={!shouldOptimizeProjectImage(project.image)} />
      </div>}
      <div className="study-reading">
        <nav aria-label="In this case study">
          {sections.map(section => <a key={section.id} className="index-link" href={'#' + section.id}>{section.label}</a>)}
        </nav>
        <div data-reveal-children className="study-chapters">
          {sections.map(section => <section key={section.id} aria-labelledby={section.id}>
            <h2 id={section.id} tabIndex={-1}>{section.label}</h2>
            <p>{section.text}</p>
          </section>)}
        </div>
      </div>
      {nextProject && <Link data-reveal className="study-next" href={projectPath(nextProject.slug)}>
        <span>Next case study</span><strong>{nextProject.name}</strong>
      </Link>}
    </article>
  )
}

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { projectPath, shouldOptimizeProjectImage } from '@/lib/portfolio-content'
import type { SiteContent } from '@/lib/site-content'

export default function WorkList({ work, heading: Heading = 'h3' }: { work: SiteContent['work']; heading?: 'h2' | 'h3' }) {
  if (!work.projects.length) return <p>{work.emptyMessage}</p>
  return (
    <ul className="work-grid">
      {work.projects.map((project, index) => (
        <li key={project.slug}>
          <Link href={projectPath(project.slug)} className={`work-card ${index === 0 ? 'work-card-featured' : 'work-card-compact'}`} data-cover={Boolean(project.image)}>
            {project.image && <div className="work-cover">
              <Image
                src={project.image}
                alt=""
                fill
                unoptimized={!shouldOptimizeProjectImage(project.image)}
                sizes={index === 0 ? '(min-width: 960px) 55vw, 94vw' : '(min-width: 960px) 185px, 27vw'}
              />
            </div>}
            <div className="work-card-copy">
              <p className="eyebrow">{project.category}</p>
              <div className="work-card-title">
                <Heading>{project.name}</Heading>
                <ArrowUpRight aria-hidden="true" size={19} />
              </div>
              <p className="work-card-description">{index === 0 ? project.outcome : project.summary}</p>
              {index === 0 && <dl className="work-card-role"><dt>My role</dt><dd>{project.role}</dd></dl>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

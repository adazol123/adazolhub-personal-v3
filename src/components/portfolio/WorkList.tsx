import Link from 'next/link'
import { Layers3 } from 'lucide-react'
import SkeletonImage from './SkeletonImage'
import { projectPath, shouldOptimizeProjectImage } from '@/lib/portfolio-content'
import type { SiteContent } from '@/lib/site-content'

export default function WorkList({ work, heading: Heading = 'h3' }: { work: SiteContent['work']; heading?: 'h2' | 'h3' }) {
  if (!work.projects.length) return <p>{work.emptyMessage}</p>
  return (
    <ul data-reveal-children className="project-gallery">
      {work.projects.map(project => (
        <li key={project.slug}>
          <Link href={projectPath(project.slug)} className="project-entry">
            <div className="project-art skeleton-media">
              {project.image ? <SkeletonImage
                src={project.image} alt="" fill unoptimized={!shouldOptimizeProjectImage(project.image)}
                sizes="(min-width: 960px) 390px, (min-width: 680px) 45vw, 92vw"
              /> : <Layers3 aria-hidden="true" size={46}/>}
              <span className="project-cue">Read case study</span>
            </div>
            <div className="project-meta"><span>{project.category}</span></div>
            <Heading>{project.name}</Heading>
            <p>{project.summary}</p>
          </Link>
        </li>
      ))}
    </ul>
  )
}

import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { profiles } from '@/lib/portfolio-content'
import { githubHandle } from '@/lib/portfolio-github-server'
import styles from './activity.module.css'

export default function ActivityLayout({ children }: { children: ReactNode }) {
  return (
    <article className="interior-page interior-page--contained">
      <header className={`page-heading ${styles.heading}`}>
        <div>
          <h1>GitHub <em>activity.</em></h1>
          <p>A year of contributions as displayed on my public GitHub profile.</p>
        </div>
        <a className="portfolio-button" href={profiles.GitHub}>
          View @{githubHandle}<ArrowUpRight size={17} aria-hidden="true" />
        </a>
      </header>
      {children}
    </article>
  )
}

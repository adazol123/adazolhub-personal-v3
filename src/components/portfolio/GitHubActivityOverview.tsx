import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { summarizeGitHubContributions } from '@/lib/portfolio-github'
import { getGitHubActivity } from '@/lib/portfolio-github-server'
import ContributionCalendar from './ContributionCalendar'
import styles from './GitHubActivityOverview.module.css'

const activityDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' })

export default async function GitHubActivityOverview() {
  const { days, updatedOn, isSnapshot } = await getGitHubActivity()
  const { total } = summarizeGitHubContributions(days)
  const range = activityDate.formatRange(new Date(days[0].date), new Date(days.at(-1).date))

  return (
    <section className="editorial-section" aria-labelledby="home-github-activity">
      <div className={`section-heading ${styles.heading}`}>
        <h2 id="home-github-activity">GitHub activity</h2>
        <Link className="quiet-link" href="/activity">View full activity <ArrowUpRight aria-hidden="true" size={16} /></Link>
      </div>
      <div className={styles.overview}>
        <div className={styles.summary}>
          <p><strong>{total.toLocaleString('en-US')}</strong> contributions</p>
          <p>{range}</p>
        </div>
        <ContributionCalendar days={days} />
        {isSnapshot && <p className={styles.snapshot}>Saved snapshot from <time dateTime={updatedOn}>{activityDate.format(new Date(updatedOn))}</time></p>}
      </div>
    </section>
  )
}

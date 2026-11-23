import type { Metadata } from 'next'
import { connection } from 'next/server'
import ContributionCalendar from '@/components/portfolio/ContributionCalendar'
import { summarizeGitHubContributions, type GitHubContributionDay } from '@/lib/portfolio-github'
import { getGitHubActivity } from '@/lib/portfolio-github-server'
import DailyContributions from './DailyContributions'
import styles from './activity.module.css'

export const metadata: Metadata = {
  title: 'GitHub activity',
  description: 'A year of contributions visible on Daniel Lozada’s GitHub profile.',
  alternates: { canonical: '/activity' }
}

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' })
const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const numberFormat = new Intl.NumberFormat('en-US')

function MonthlyTotals({ days }: { days: readonly GitHubContributionDay[] }) {
  const months = new Map<string, GitHubContributionDay[]>()
  for (const day of days) {
    const month = day.date.slice(0, 7)
    if (!months.has(month)) months.set(month, [])
    months.get(month).push(day)
  }

  return (
    <details data-reveal className={styles.details}>
      <summary>Monthly totals</summary>
      <table>
        <thead><tr><th scope="col">Month</th><th scope="col">Active days</th><th scope="col">Contributions</th></tr></thead>
        <tbody>
          {[...months.entries()].reverse().map(([month, monthDays]) => {
            const { total, activeDays } = summarizeGitHubContributions(monthDays)
            return (
              <tr key={month}>
                <th scope="row">{monthFormat.format(new Date(monthDays[0].date))}</th>
                <td>{numberFormat.format(activeDays)}</td>
                <td>{numberFormat.format(total)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </details>
  )
}

export default async function ActivityPage() {
  await connection()
  const { days, updatedOn, isSnapshot } = await getGitHubActivity()
  const { total, activeDays, dailyHigh } = summarizeGitHubContributions(days)
  const dateRange = dateFormat.formatRange(new Date(days[0].date), new Date(days.at(-1).date))
  const stats = [
    { label: 'Contributions', value: total },
    { label: 'Active days', value: activeDays },
    { label: 'Most in one day', value: dailyHigh }
  ]

  return (
    <>
      <section className={styles.panel} aria-labelledby="calendar-heading">
        <header data-reveal className={styles.calendarHeading}>
          <h2 id="calendar-heading">Contribution calendar</h2>
          <p>{dateRange}</p>
        </header>
        <dl data-reveal-children className={styles.stats}>
          {stats.map(({ label, value }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{numberFormat.format(value)}</dd>
            </div>
          ))}
        </dl>
        <ContributionCalendar days={days} />
        <DailyContributions days={days} />
        <p className={styles.updated}>
          {isSnapshot ? 'Saved snapshot from ' : 'Last fetched '}
          <time dateTime={updatedOn}>{dateFormat.format(new Date(updatedOn))}</time>
        </p>
      </section>
      <MonthlyTotals days={days} />
    </>
  )
}

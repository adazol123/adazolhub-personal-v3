import { Fragment, type CSSProperties } from 'react'
import type { GitHubContributionDay } from '@/lib/portfolio-github'
import styles from './ContributionCalendar.module.css'

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' })
const shortMonthFormat = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
const numberFormat = new Intl.NumberFormat('en-US')

function CalendarSegment({ days, weeks, offset }: {
  days: readonly GitHubContributionDay[]
  weeks: number
  offset: number
}) {
  return (
    <div className={styles.segment} style={{ '--weeks': weeks } as CSSProperties}>
      <span className={styles.weekday} style={{ gridRow: '3 / 4' }}>Mon</span>
      <span className={styles.weekday} style={{ gridRow: '5 / 6' }}>Wed</span>
      <span className={styles.weekday} style={{ gridRow: '7 / 8' }}>Fri</span>
      {days.map(({ date, count, level }, index) => {
        const slot = index + offset
        const gridColumn = Math.floor(slot / 7) + 1
        const gridRow = (slot % 7) + 2

        return (
          <Fragment key={date}>
            {date.endsWith('-01') && (
              <span className={styles.month} style={{ gridColumn, gridRow: 1 }}>
                {shortMonthFormat.format(new Date(date))}
              </span>
            )}
            <span className={styles.day} style={{ gridColumn, gridRow }} data-level={level}
              title={`${dateFormat.format(new Date(date))} · ${numberFormat.format(count)} ${count === 1 ? 'contribution' : 'contributions'}`} />
          </Fragment>
        )
      })}
    </div>
  )
}

export default function ContributionCalendar({ days }: { days: readonly GitHubContributionDay[] }) {
  const offset = new Date(days[0].date).getUTCDay()
  const weeks = Math.ceil((days.length + offset) / 7)
  const firstWeeks = Math.floor(weeks / 2)
  const splitIndex = firstWeeks * 7 - offset

  return (
    <figure className={styles.figure}>
      <div className={styles.calendar} aria-hidden="true">
        <CalendarSegment days={days.slice(0, splitIndex)} weeks={firstWeeks} offset={offset} />
        <CalendarSegment days={days.slice(splitIndex)} weeks={weeks - firstWeeks} offset={0} />
      </div>
      <figcaption className={styles.caption}>
        <p>Each square represents a day.</p>
        <div className={styles.legend} role="img" aria-label="Brighter squares indicate more contributions">
          <span aria-hidden="true">Less</span>
          {[0, 1, 2, 3, 4].map(level => <span key={level} className={styles.swatch} data-level={level} aria-hidden="true" />)}
          <span aria-hidden="true">More</span>
        </div>
      </figcaption>
    </figure>
  )
}

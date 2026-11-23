'use client'

import { useState } from 'react'
import type { GitHubContributionDay } from '@/lib/portfolio-github'
import styles from './activity.module.css'

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' })
const numberFormat = new Intl.NumberFormat('en-US')

export default function DailyContributions({ days }: { days: readonly GitHubContributionDay[] }) {
  const first = days[0].date
  const last = days[days.length - 1].date
  const [date, setDate] = useState(last)
  const day = days.find(day => day.date === date)

  return (
    <div className={styles.daily}>
      <label htmlFor="contribution-date">Daily contributions</label>
      <input
        id="contribution-date"
        type="date"
        min={first}
        max={last}
        value={date}
        onChange={event => setDate(event.target.value)}
      />
      <output htmlFor="contribution-date" className={styles.dailyCount}>
        {day
          ? `${dateFormat.format(new Date(day.date))} · ${numberFormat.format(day.count)} ${day.count === 1 ? 'contribution' : 'contributions'}`
          : 'Choose a date in the calendar range.'}
      </output>
    </div>
  )
}

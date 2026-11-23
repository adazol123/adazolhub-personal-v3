import assert from 'node:assert/strict'
import test from 'node:test'
import { parseGitHubContributions, summarizeGitHubContributions } from '../src/lib/portfolio-github.ts'

function calendarFixture() {
  const days = Array.from({ length: 365 }, (_, index) => {
    const date = new Date(Date.UTC(2025, 0, index + 1)).toISOString().slice(0, 10)
    const count = index === 0 ? 1 : index === 31 ? 1234 : 0
    const level = count === 1 ? 1 : count > 0 ? 4 : 0

    return {
      cell: `<td data-level="${level}" data-date="${date}" class="day ContributionCalendar-day" id="day-${index}"></td>`,
      tooltip: `<tool-tip data-direction="n" for="day-${index}">${count > 0 ? `${count.toLocaleString('en-US')} contribution${count === 1 ? '' : 's'}` : 'No contributions'} on ${date}.</tool-tip>`
    }
  }).reverse()

  return days.map(({ cell, tooltip }) => `${cell}\n${tooltip}`).join('\n')
}

test('reads actual counts, pairs tooltip IDs, and sorts the calendar by date', () => {
  const days = parseGitHubContributions(calendarFixture())

  assert.equal(days.length, 365)
  assert.deepEqual(days[0], { date: '2025-01-01', count: 1, level: 1 })
  assert.deepEqual(days[31], { date: '2025-02-01', count: 1234, level: 4 })
  assert.deepEqual(days.at(-1), { date: '2025-12-31', count: 0, level: 0 })
  assert.deepEqual(summarizeGitHubContributions(days), { total: 1235, activeDays: 2, dailyHigh: 1234 })
})

test('rejects invalid or incomplete calendar responses instead of publishing inaccurate counts', () => {
  const html = calendarFixture()

  for (const broken of [
    '<html>Sign in to GitHub</html>',
    html.replace('2025-02-28', '2025-02-30'),
    html.replace('data-date="2025-01-02"', 'data-date="2025-01-01"'),
    html.replace('for="day-1"', 'for="missing"'),
    html.replace('No contributions on 2025-01-02.', 'Contributions unavailable'),
    html.replace('data-level="4"', 'data-level="0"'),
    html.replace(/[^\n]*id="day-1"[^\n]*\n/, ''),
  ]) {
    assert.throws(() => parseGitHubContributions(broken), /contribution calendar/i)
  }
})

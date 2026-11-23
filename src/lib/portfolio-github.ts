type ContributionLevel = 0 | 1 | 2 | 3 | 4

export type GitHubContributionDay = {
  date: string
  count: number
  level: ContributionLevel
}

function readAttribute(attributes: string, name: string) {
  return attributes.match(new RegExp(`\\s${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2]
}

export function parseGitHubContributions(html: string): GitHubContributionDay[] {
  // GitHub renders the dates and intensity in cells, with the exact counts in their tooltips.
  const tooltips = new Map<string, string>()
  for (const [, attributes, label] of html.matchAll(/<tool-tip\b([^>]*)>([\s\S]*?)<\/tool-tip>/gi)) {
    const cellId = readAttribute(attributes, 'for')
    if (cellId) tooltips.set(cellId, label.trim())
  }

  const days: GitHubContributionDay[] = []
  for (const [, attributes] of html.matchAll(/<td\b([^>]*)>/gi)) {
    if (!readAttribute(attributes, 'class')?.split(/\s+/).includes('ContributionCalendar-day')) continue

    const date = readAttribute(attributes, 'data-date')
    const level = readAttribute(attributes, 'data-level')
    const label = tooltips.get(readAttribute(attributes, 'id') ?? '')
    const countText = label?.match(/^(No|(\d+|\d{1,3}(?:,\d{3})+))\s+contributions?\s+on\s+/i)?.[1]
    const count = countText?.toLowerCase() === 'no' ? 0 : Number(countText?.replaceAll(',', ''))
    const dateMs = date ? Date.parse(date) : NaN

    if (!date || !Number.isFinite(dateMs) || new Date(dateMs).toISOString().slice(0, 10) !== date ||
      !level || !/^[0-4]$/.test(level) || !Number.isSafeInteger(count) || (count === 0) !== (level === '0')) {
      throw new Error('GitHub contribution calendar contains an invalid day')
    }

    days.push({ date, count, level: Number(level) as ContributionLevel })
  }

  days.sort((first, second) => first.date.localeCompare(second.date))
  const dayMs = 86_400_000
  if (days.length < 365 || days.length > 371 || days.some(({ date }, index) =>
    index > 0 && Date.parse(date) - Date.parse(days[index - 1].date) !== dayMs)) {
    throw new Error('GitHub contribution calendar is incomplete')
  }

  return days
}

export function summarizeGitHubContributions(days: readonly GitHubContributionDay[]) {
  return days.reduce((summary, { count }) => ({
    total: summary.total + count,
    activeDays: summary.activeDays + Number(count > 0),
    dailyHigh: Math.max(summary.dailyHigh, count)
  }), { total: 0, activeDays: 0, dailyHigh: 0 })
}

import { unstable_cache } from 'next/cache'
import { profiles } from './portfolio-content'
import { parseGitHubContributions, type GitHubContributionDay } from './portfolio-github'
import { snapshotCapturedOn, snapshotDays } from './portfolio-github-snapshot'

export const githubHandle = new URL(profiles.GitHub).pathname.slice(1)

type GitHubActivity = {
  days: readonly GitHubContributionDay[]
  updatedOn: string
  isSnapshot: boolean
}

const readPublicCalendar = unstable_cache(async (handle: string) => {
  const response = await fetch(`https://github.com/users/${encodeURIComponent(handle)}/contributions`, {
    headers: { Accept: 'text/html', 'Accept-Language': 'en-US' },
    cache: 'no-store',
    credentials: 'omit',
    redirect: 'error',
    signal: AbortSignal.timeout(3500)
  })

  if (!response.ok) throw new Error(`GitHub contribution calendar returned ${response.status}`)

  return {
    days: parseGitHubContributions(await response.text()),
    updatedOn: new Date().toISOString().slice(0, 10),
    isSnapshot: false
  }
}, ['portfolio-github-calendar-v1'], { revalidate: 6 * 60 * 60 })

export async function getGitHubActivity(): Promise<GitHubActivity> {
  try {
    return await readPublicCalendar(githubHandle)
  } catch {
    return { days: snapshotDays, updatedOn: snapshotCapturedOn, isSnapshot: true }
  }
}

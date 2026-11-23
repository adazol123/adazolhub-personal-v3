import { caseStudies, publicPagePaths } from './portfolio-content.ts'

const defaultProjectPaths = caseStudies.map(study => study.path)

export function isTrackedVisitorPath (path: unknown, projectPaths: readonly string[] = defaultProjectPaths): path is string {
  return typeof path === 'string' && (publicPagePaths.includes(path) || projectPaths.includes(path))
}

export function isVisitorCount (count: unknown): count is number {
  return typeof count === 'number' && Number.isSafeInteger(count) && count > 0
}

export async function requestVisitorCount (path: string, send: typeof fetch = fetch): Promise<number | null> {
  const postVisit = async () => {
    const response = await send('/api/visitors', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path }),
      cache: 'no-store',
      credentials: 'same-origin',
      redirect: 'error',
      signal: AbortSignal.timeout(6_000)
    })
    return response.ok ? response.json() : null
  }

  try {
    let reply = await postVisit()
    if (reply?.status === 'cookie-required') reply = await postVisit()
    return reply?.status === 'counted' && isVisitorCount(reply.count) ? reply.count : null
  } catch {
    return null
  }
}

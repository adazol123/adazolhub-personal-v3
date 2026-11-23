import { projectPath } from '@/lib/portfolio-content'
import { getSiteContent } from '@/lib/site-content-store'
import { isTrackedVisitorPath } from '@/lib/portfolio-visitors'
import { createVisitorHandler } from '@/lib/portfolio-visitor-server'

export const runtime = 'nodejs'

export const POST = createVisitorHandler({
  async isTrackedPath(path) {
    if (!path.startsWith('/portfolio/')) return isTrackedVisitorPath(path, [])
    const { work } = await getSiteContent()
    return work.projects.some(project => projectPath(project.slug) === path)
  }
})

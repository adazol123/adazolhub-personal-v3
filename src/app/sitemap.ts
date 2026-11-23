import type { MetadataRoute } from 'next'
import { projectPath, publicPagePaths, siteOrigin } from '@/lib/portfolio-content'
import { getSiteContent } from '@/lib/site-content-store'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { work } = await getSiteContent()
  return [...publicPagePaths, ...work.projects.map(project => projectPath(project.slug))].map(path => ({ url: new URL(path, siteOrigin).href }))
}

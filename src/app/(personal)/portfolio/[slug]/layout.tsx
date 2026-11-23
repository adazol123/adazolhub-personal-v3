import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'
import { getSiteContent } from '@/lib/site-content-store'

export default async function CaseStudyLayout({ children, params }: { children: ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { work } = await getSiteContent()

  // Resolve missing projects before the loading boundary can commit a 200.
  if (!work.projects.some(project => project.slug === slug)) notFound()
  return children
}

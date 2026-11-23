import type { Metadata } from 'next'
import WorkList from '@/components/portfolio/WorkList'
import { getSiteContent } from '@/lib/site-content-store'

export async function generateMetadata(): Promise<Metadata> {
  const { work } = await getSiteContent()
  return { title: work.metadataTitle, description: work.introduction, alternates: { canonical: '/portfolio' } }
}

export default async function PortfolioPage() {
  const { work } = await getSiteContent()
  return (
    <div className="interior-page">
      <header data-reveal-children className="page-heading">
        <h1>{work.title} <em>{work.titleAccent}</em></h1>
        <p>{work.introduction}</p>
      </header>
      <WorkList work={work} heading="h2" />
    </div>
  )
}

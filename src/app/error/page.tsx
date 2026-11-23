import Link from 'next/link'

export default function ErrorPage() {
  return (
    <div className="interior-page">
      <header className="page-heading"><h1>Something went wrong</h1><p>Start again from the homepage or browse the project archive.</p></header>
      <div className="hero-actions"><Link className="portfolio-button" href="/">Back home</Link><Link className="text-link" href="/portfolio">View work</Link></div>
    </div>
  )
}

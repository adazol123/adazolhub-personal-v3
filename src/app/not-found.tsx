import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="interior-page">
      <header className="page-heading"><p className="eyebrow">404</p><h1>Page not found</h1><p>Find your way back through the homepage or the project archive.</p></header>
      <div className="hero-actions"><Link className="portfolio-button" href="/">Back home</Link><Link className="text-link" href="/portfolio">View work</Link></div>
    </div>
  )
}

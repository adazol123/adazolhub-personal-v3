import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import AmbientBackground from '@/components/portfolio/AmbientBackground'
import JumpLink from '@/components/portfolio/JumpLink'
import PortfolioMain from '@/components/portfolio/PortfolioMain'
import PortfolioNavigation, { HeaderContact } from '@/components/portfolio/PortfolioNavigation'
import VisitorCount from '@/components/portfolio/VisitorCount'
import { projectPath, siteOrigin } from '@/lib/portfolio-content'
import { getSiteContent } from '@/lib/site-content-store'
import './globals.css'
import './portfolio.css'
import './atlas.css'

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: { default: 'Daniel Lozada — Adazol', template: '%s · Daniel Lozada' },
  description: 'Selected work, engineering notes, and experience from Daniel Lozada, a software engineer in the Philippines.',
  openGraph: { type: 'website', siteName: 'Adazol', locale: 'en_PH' }
}

export const viewport: Viewport = { viewportFit: 'cover' }

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { appearance, site, work } = await getSiteContent()
  return (
    <html lang="en">
      <body className="portfolio-site" data-theme={appearance.theme}>
        {appearance.ambientBackground && <AmbientBackground theme={appearance.theme} animate={appearance.scrollBackground} />}
        <JumpLink className="skip-link" href="#main-content">Skip to content</JumpLink>
        <header className="site-header">
          <div className="site-shell site-header-row">
            <Link href="/" className="site-mark" aria-label="Adazol home"><span className="brand-symbol" aria-hidden="true">a</span>adazol<span className="brand-dot">.</span></Link>
            <PortfolioNavigation placement="desktop" />
            <HeaderContact />
          </div>
        </header>
        <PortfolioNavigation placement="mobile" />
        <PortfolioMain>{children}</PortfolioMain>
        <footer className="site-footer">
          <div className="site-shell">
            <div data-reveal-children className="site-footer-main">
              <div>
                <Link href="/" className="site-mark"><span className="brand-symbol" aria-hidden="true">a</span>adazol<span className="brand-dot">.</span></Link>
                <p>{site.footerName} <span className="separator-dot">·</span> {site.footerRole}</p>
              </div>
              <nav aria-label="More about Daniel" className="site-footer-links">
                <Link href="/availability">Availability</Link>
                <Link href="/testimonial">References</Link>
                <Link href="/connect">Connect</Link>
                <Link href="/contact">Contact</Link>
              </nav>
              <nav aria-label="Social profiles" className="site-footer-links">
                {Object.entries(site.profiles).map(([label, href]) => <a href={href} key={label}>{label}</a>)}
              </nav>
            </div>
            <div data-reveal className="site-footer-end">
              <p>© {new Date().getFullYear()} {site.footerName}</p>
              {appearance.visitorCount && <VisitorCount projectPaths={work.projects.map(project => projectPath(project.slug))} />}
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}

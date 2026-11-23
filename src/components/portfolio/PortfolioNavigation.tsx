'use client'

import { ArrowUpRight, Briefcase, ChartNoAxesColumn, FileText, NotebookPen, UserRound } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  { label: 'Work', href: '/portfolio', icon: Briefcase },
  { label: 'Activity', href: '/activity', icon: ChartNoAxesColumn },
  { label: 'About', href: '/about', icon: UserRound },
  { label: 'Notes', href: '/thread', icon: NotebookPen },
  { label: 'Resume', href: '/cv', icon: FileText }
]

export default function PortfolioNavigation({ placement }: { placement: 'desktop' | 'mobile' }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Main navigation" className={`site-nav site-nav-${placement}`}>
      {navigation.map(({ label, href, icon: Icon }) => {
        const current = pathname === href ? 'page' : pathname?.startsWith(href + '/') ? 'location' : undefined

        return (
          <Link href={href} key={href} aria-current={current}>
            <Icon aria-hidden="true" size={17} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

export function HeaderContact() {
  const pathname = usePathname()

  return (
    <Link href="/contact" className="site-contact-link" aria-current={pathname === '/contact' ? 'page' : undefined}>
      Get in touch <ArrowUpRight aria-hidden="true" size={15} />
    </Link>
  )
}

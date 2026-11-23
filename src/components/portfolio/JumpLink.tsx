'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

type JumpLinkProps = {
  href: `#${string}`
  className?: string
  smooth?: boolean
  children: ReactNode
}

export default function JumpLink({ href, className, smooth, children }: JumpLinkProps) {
  function goToSection() {
    const section = document.getElementById(href.slice(1))
    if (!section) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    section.focus({ preventScroll: true })
    section.scrollIntoView({ behavior: smooth && !reduceMotion ? 'smooth' : 'instant' })
  }

  return <Link className={className} href={href} scroll={false} onNavigate={goToSection}>{children}</Link>
}

'use client'

import { usePathname } from 'next/navigation'
import { useLayoutEffect, useRef, type ReactNode } from 'react'

export default function PortfolioMain({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const previousPath = useRef(pathname)
  const historyDestination = useRef<string | null>(null)
  const mainRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    function rememberHistoryDestination() {
      const destination = window.location.pathname
      historyDestination.current = destination === previousPath.current ? null : destination
    }

    window.addEventListener('popstate', rememberHistoryDestination, true)
    return () => window.removeEventListener('popstate', rememberHistoryDestination, true)
  }, [])

  useLayoutEffect(() => {
    const main = mainRef.current
    if (!main || previousPath.current === pathname) return

    previousPath.current = pathname
    const restoringHistory = historyDestination.current === pathname
    historyDestination.current = null
    const fragment = window.location.hash

    // A new page starts at its heading. Keep the router's scroll position for
    // fragment links and Back/Forward.
    if (!fragment && !restoringHistory && window.scrollY !== 0) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    if (!main.contains(document.activeElement)) main.focus({ preventScroll: true })

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (fragment || motion.matches || !main.animate) return

    const animation = main.animate([{ opacity: 0.84 }, { opacity: 1 }], {
      duration: 160,
      easing: 'ease-out'
    })
    const stop = () => animation.cancel()
    motion.addEventListener('change', stop, { once: true })

    return () => {
      motion.removeEventListener('change', stop)
      stop()
    }
  }, [pathname])

  return <main id="main-content" className="site-shell" tabIndex={-1} ref={mainRef}>{children}</main>
}

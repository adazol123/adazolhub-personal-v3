'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { isTrackedVisitorPath, requestVisitorCount } from '@/lib/portfolio-visitors'
import styles from './VisitorCount.module.css'

// Serialize requests in this document so concurrent effects do not race to set the first cookie.
let pendingVisit = Promise.resolve()

export default function VisitorCount ({ projectPaths }: { projectPaths: string[] }) {
  const pathname = usePathname()
  const tracked = isTrackedVisitorPath(pathname, projectPaths)
  const [result, setResult] = useState<{ path: string, count: number | null } | null>(null)

  useEffect(() => {
    if (!tracked) return
    let active = true

    function trackVisiblePage () {
      if (document.visibilityState !== 'visible') return
      document.removeEventListener('visibilitychange', trackVisiblePage)
      pendingVisit = pendingVisit.then(async () => {
        const count = await requestVisitorCount(pathname)
        if (active) setResult({ path: pathname, count })
      })
    }

    document.addEventListener('visibilitychange', trackVisiblePage)
    trackVisiblePage()
    return () => {
      active = false
      document.removeEventListener('visibilitychange', trackVisiblePage)
    }
  }, [pathname, tracked])

  if (!tracked) return null
  const count = result?.path === pathname ? result.count : undefined
  const value = count === undefined ? '…' : count === null ? 'Unavailable' : count.toLocaleString()

  return (
    <span className={styles.metric} role="status" aria-busy={count === undefined}>
      <span>Unique visitors on this page</span>
      <strong className={styles.value}>{value}</strong>
    </span>
  )
}

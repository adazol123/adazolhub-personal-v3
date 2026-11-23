'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { isTrackedVisitorPath, requestVisitorCount } from '@/lib/portfolio-visitors'
import { Skeleton } from './Skeleton'
import styles from './VisitorCount.module.css'

// Serialize requests in this document so concurrent effects do not race to set the first cookie.
let pendingVisit = Promise.resolve()

export default function VisitorCount ({ projectPaths }: { projectPaths: string[] }) {
  const pathname = usePathname()
  const tracked = isTrackedVisitorPath(pathname, projectPaths)
  const [count, setCount] = useState<number | null>()

  useEffect(() => {
    if (!tracked) return
    let active = true

    function trackVisiblePage () {
      if (document.visibilityState !== 'visible') return
      document.removeEventListener('visibilitychange', trackVisiblePage)
      pendingVisit = pendingVisit.then(async () => {
        if (!active) return
        const count = await requestVisitorCount(pathname)
        if (active) setCount(count)
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
  return (
    <span className={styles.metric} role="status">
      <span>Unique site visitors</span>
      <strong className={styles.value}>
        {count === undefined
          ? <><span className="sr-only">Loading visitor count</span><Skeleton className="skeleton-inline" /></>
          : count === null ? 'Unavailable' : count.toLocaleString()}
      </strong>
    </span>
  )
}

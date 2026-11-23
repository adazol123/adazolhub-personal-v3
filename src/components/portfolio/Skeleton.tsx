import type { ReactNode } from 'react'

export function Skeleton({ className = '' }: { className?: string }) {
  return <span className={`skeleton ${className}`} aria-hidden="true" />
}

export function SkeletonRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="skeleton-region">
      <span className="sr-only" role="status">{label}</span>
      <div aria-hidden="true">{children}</div>
    </div>
  )
}

export function SkeletonLines() {
  return (
    <div className="skeleton-lines">
      <Skeleton />
      <Skeleton />
      <Skeleton className="skeleton-short" />
    </div>
  )
}

export function CalendarSkeleton() {
  return (
    <div className="skeleton-calendar" data-skeleton="calendar" aria-hidden="true">
      <Skeleton className="skeleton-short" />
      <div className="skeleton-calendar-grid"><span /><span /></div>
      <Skeleton className="skeleton-short" />
    </div>
  )
}

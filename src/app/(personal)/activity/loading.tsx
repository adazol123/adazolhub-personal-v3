import { CalendarSkeleton, Skeleton, SkeletonRegion } from '@/components/portfolio/Skeleton'
import styles from './activity.module.css'

export default function ActivityLoading() {
  return (
    <section className={styles.panel} aria-labelledby="calendar-heading">
      <header className={styles.calendarHeading}>
        <h2 id="calendar-heading">Contribution calendar</h2>
      </header>
      <SkeletonRegion label="Loading GitHub contributions">
        <div className={styles.stats}>
          {[0, 1, 2].map(item => <div className={styles.loadingStat} key={item}><Skeleton /><Skeleton className="skeleton-subtitle" /></div>)}
        </div>
        <CalendarSkeleton />
        <div className={styles.daily}><Skeleton className="skeleton-button" /><Skeleton className="skeleton-short" /></div>
      </SkeletonRegion>
    </section>
  )
}

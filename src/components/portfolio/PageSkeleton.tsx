import { CalendarSkeleton, Skeleton, SkeletonLines, SkeletonRegion } from './Skeleton'
import contactStyles from './ContactForm.module.css'

export function WorkSkeleton() {
  return (
    <ul className="project-gallery" aria-hidden="true">
      {[0, 1, 2].map(index => <li key={index} className="project-entry">
        <div className="project-art"><Skeleton className="skeleton-fill" /></div>
        <div className="project-meta"><Skeleton className="skeleton-short" /></div>
        <Skeleton className="skeleton-subtitle" /><SkeletonLines />
      </li>)}
    </ul>
  )
}

export function HomeSkeleton() {
  return (
    <SkeletonRegion label="Loading home">
      <div className="atlas-hero">
        <div className="atlas-intro skeleton-stack">
          <Skeleton className="skeleton-short" />
          <Skeleton className="skeleton-hero-title" />
          <Skeleton className="skeleton-hero-title" />
          <SkeletonLines />
          <div className="hero-actions"><Skeleton className="skeleton-button" /><Skeleton className="skeleton-button" /></div>
        </div>
        <div className="terrain-study terrain-placeholder"><Skeleton className="skeleton-fill" /></div>
      </div>
      <div className="field-strip"><Skeleton className="skeleton-short" /></div>
      <div className="editorial-section">
        <div className="section-heading"><Skeleton className="skeleton-subtitle" /><Skeleton className="skeleton-button" /></div>
        <WorkSkeleton />
      </div>
      <div className="editorial-section"><CalendarSkeleton /></div>
    </SkeletonRegion>
  )
}

export function ContactFormSkeleton() {
  return (
    <div className={contactStyles.form}>
      <div className="skeleton-stack">
        <div className={contactStyles.fields}>
          <div className="skeleton-stack"><Skeleton className="skeleton-short" /><Skeleton className="skeleton-field" /></div>
          <div className="skeleton-stack"><Skeleton className="skeleton-short" /><Skeleton className="skeleton-field" /></div>
          <div className={`${contactStyles.message} skeleton-stack`}><Skeleton className="skeleton-short" /><Skeleton className="skeleton-textarea" /></div>
        </div>
        <Skeleton className="skeleton-button" />
      </div>
    </div>
  )
}

export default function PageSkeleton({ label = 'Loading page', layout = 'article' }: {
  label?: string
  layout?: 'article' | 'work' | 'case-study' | 'about' | 'resume' | 'list' | 'contact'
}) {
  const contained = layout === 'about' || layout === 'resume' || layout === 'list'

  return (
    <SkeletonRegion label={label}>
      <div className={`interior-page${contained ? ' interior-page--contained' : ''}${layout === 'contact' ? ` ${contactStyles.page}` : ''}`}>
        {layout === 'case-study' && <div className="back-link"><Skeleton className="skeleton-button" /></div>}
        <div className="page-heading skeleton-stack">
          <Skeleton className="skeleton-page-title" />
          <Skeleton className="skeleton-description" />
          {layout === 'contact' && <div className={contactStyles.channels}><Skeleton className="skeleton-field" /><Skeleton className="skeleton-field" /></div>}
          {layout === 'resume' && <div className="hero-actions"><Skeleton className="skeleton-button" /><Skeleton className="skeleton-button" /></div>}
        </div>
        {layout === 'work' && <WorkSkeleton />}
        {layout === 'case-study' && <div className="case-study-cover"><Skeleton className="skeleton-fill" /></div>}
        {layout === 'contact' && <ContactFormSkeleton />}
        {layout === 'list' && <div className="thread-list">
          {[0, 1, 2].map(item => <div className="reading-card skeleton-stack" key={item}><Skeleton className="skeleton-subtitle" /><SkeletonLines /></div>)}
        </div>}
        {(layout === 'article' || layout === 'about' || layout === 'resume' || layout === 'case-study') && (
          <div className={layout === 'article' ? undefined : 'reading-layout'}>
            <div className="reading-body reading-card skeleton-stack">
              <Skeleton className="skeleton-subtitle" /><SkeletonLines /><SkeletonLines />
              <Skeleton className="skeleton-button" />
            </div>
            {layout === 'about' && <div className="detail-aside about-photo"><Skeleton className="skeleton-square" /><Skeleton className="skeleton-button" /></div>}
            {(layout === 'case-study' || layout === 'resume') && <div className="detail-aside"><Skeleton className="skeleton-subtitle" /><SkeletonLines /></div>}
          </div>
        )}
      </div>
    </SkeletonRegion>
  )
}

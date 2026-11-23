import styles from './activity.module.css'

export default function ActivityLoading() {
  return (
    <section className={`${styles.panel} ${styles.loading}`} aria-labelledby="calendar-heading">
      <header className={styles.calendarHeading}>
        <h2 id="calendar-heading">Contribution calendar</h2>
      </header>
      <p className={styles.loadingStatus} role="status">Loading GitHub contributions…</p>
    </section>
  )
}

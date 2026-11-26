import styles from './WaitingDots.module.css'

/** Three bouncing dots: "something is happening on another phone". */
export function WaitingDots() {
  return (
    <span className={styles.dots} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  )
}

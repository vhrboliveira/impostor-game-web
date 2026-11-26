import styles from './ProgressBar.module.css'

interface ProgressBarProps {
  value: number
  max: number
  /** Read by screen readers ("2 de 4 votaram"). */
  label: string
}

/** A thin bar for "how many already did it" (confirmations, votes). Scales, never resizes. */
export function ProgressBar({ value, max, label }: ProgressBarProps) {
  const ratio = max > 0 ? Math.min(1, value / max) : 0
  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
    >
      <div className={styles.fill} style={{ transform: `scaleX(${ratio})` }} />
    </div>
  )
}

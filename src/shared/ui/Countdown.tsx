import { useEffect, useState } from 'react'
import styles from './Countdown.module.css'
import { Icon } from './Icon'

interface CountdownProps {
  /** ISO timestamp. TODO: prefer a server-provided remaining time to avoid client clock skew. */
  deadlineAt: string | null
  /** Seconds left from which the clock turns into a warning (the spec asks for 30). */
  warnAtSeconds?: number
  size?: 'md' | 'lg'
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Isolated on purpose: only this tiny component re-renders every second. Fixed-width digits keep
// it from wobbling as the numbers change.
export function Countdown({ deadlineAt, warnAtSeconds = 30, size = 'md' }: CountdownProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!deadlineAt) return undefined
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [deadlineAt])

  if (!deadlineAt) return null

  const remainingSeconds = Math.max(0, Math.ceil((Date.parse(deadlineAt) - now) / 1000))

  return (
    <span
      className={styles.pill}
      data-size={size}
      data-warning={remainingSeconds <= warnAtSeconds || undefined}
    >
      <Icon name="clock" size={size === 'lg' ? 22 : 16} />
      <span role="timer" aria-live="off" className={styles.time}>
        {formatClock(remainingSeconds)}
      </span>
    </span>
  )
}

import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'
import { Icon } from './Icon'
import type { IconName } from './Icon'

interface EmptyStateProps {
  icon: IconName
  tone?: 'default' | 'danger'
  children?: ReactNode
}

/** A big glowing icon for full-screen states (room gone, not found, waiting). */
export function EmptyState({ icon, tone = 'default', children }: EmptyStateProps) {
  return (
    <div className={styles.state}>
      <span className={styles.icon} data-tone={tone}>
        <Icon name={icon} size={40} />
      </span>
      {children}
    </div>
  )
}

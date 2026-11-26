import type { ReactNode } from 'react'
import styles from './Badge.module.css'
import { Icon } from './Icon'
import type { IconName } from './Icon'

interface BadgeProps {
  children: ReactNode
  tone?: 'default' | 'primary' | 'danger' | 'success' | 'gold'
  icon?: IconName
}

/** A small pill label: "anfitrião", "+1", "você". */
export function Badge({ children, tone = 'default', icon }: BadgeProps) {
  return (
    <span className={styles.badge} data-tone={tone}>
      {icon && <Icon name={icon} size={14} />}
      {children}
    </span>
  )
}

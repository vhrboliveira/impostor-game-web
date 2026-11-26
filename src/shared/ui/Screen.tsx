import type { ReactNode } from 'react'
import styles from './Screen.module.css'

interface ScreenProps {
  children?: ReactNode
  /** Small line above the title: where the game is ("Rodada 2 de 5 · Comidas"). */
  kicker?: ReactNode
  title?: ReactNode
  subtitle?: ReactNode
  /** Shown at the right of the title (a timer, a badge). */
  aside?: ReactNode
  /** Actions pinned to the bottom of the screen, within thumb reach. */
  footer?: ReactNode
  /** Centers the content vertically (empty and waiting states). */
  centered?: boolean
}

/**
 * The layout every screen shares: header (kicker, title, subtitle, aside), content, and a footer
 * that stays at the bottom of the viewport above the home indicator.
 */
export function Screen({
  children,
  kicker,
  title,
  subtitle,
  aside,
  footer,
  centered = false,
}: ScreenProps) {
  const hasHeader = kicker || title || subtitle || aside
  return (
    <section className={styles.screen} data-centered={centered || undefined}>
      {hasHeader && (
        <header className={styles.header}>
          <div className={styles.heading}>
            {kicker && <p className={styles.kicker}>{kicker}</p>}
            {title && <h2 className={styles.title}>{title}</h2>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {aside && <div className={styles.aside}>{aside}</div>}
        </header>
      )}
      <div className={styles.body}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </section>
  )
}

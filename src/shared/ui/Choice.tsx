import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Choice.module.css'

interface ChoiceProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Renders aria-pressed; leave undefined for plain actions. */
  selected?: boolean
  leading?: ReactNode
  trailing?: ReactNode
  /** `row` for lists of players, `tile` for grids (themes, guess options). */
  layout?: 'row' | 'tile'
}

/** A big tappable option, the same everywhere: themes, votes, guesses. */
export function Choice({
  selected,
  leading,
  trailing,
  layout = 'row',
  className,
  children,
  type = 'button',
  ...rest
}: ChoiceProps) {
  return (
    <button
      type={type}
      className={[styles.choice, className].filter(Boolean).join(' ')}
      data-layout={layout}
      aria-pressed={selected}
      {...rest}
    >
      {leading}
      <span className={styles.label}>{children}</span>
      {trailing}
    </button>
  )
}

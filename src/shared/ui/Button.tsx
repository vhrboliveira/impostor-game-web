import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'
import { Icon } from './Icon'
import type { IconName } from './Icon'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** `lg` for the main action of a screen, `md` (default) for the rest. */
  size?: 'md' | 'lg'
  fullWidth?: boolean
  icon?: IconName
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], fullWidth ? styles.fullWidth : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} data-size={size} {...rest}>
      {icon && <Icon name={icon} size={size === 'lg' ? 22 : 18} />}
      {children}
    </button>
  )
}

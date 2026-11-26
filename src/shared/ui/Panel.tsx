import type { HTMLAttributes } from 'react'
import styles from './Panel.module.css'

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  /** `highlight` for what matters now, `danger` and `success` for outcomes. */
  tone?: 'default' | 'highlight' | 'danger' | 'success'
  as?: 'div' | 'section' | 'article'
}

/** A raised card: the one surface every screen uses to group content. */
export function Panel({ tone = 'default', as: Tag = 'div', className, ...rest }: PanelProps) {
  return (
    <Tag
      className={[styles.panel, className].filter(Boolean).join(' ')}
      data-tone={tone}
      {...rest}
    />
  )
}

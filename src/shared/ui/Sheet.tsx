import type { ReactNode } from 'react'
import { Button } from './Button'
import styles from './Sheet.module.css'

interface SheetProps {
  /** Accessible name of the dialog. */
  label: string
  /** `danger` (the default) for confirmations, `neutral` for menus. */
  tone?: 'danger' | 'neutral'
  onClose: () => void
  children: ReactNode
}

/** A bottom sheet; a tap on the backdrop closes it. */
export function Sheet({ label, tone = 'danger', onClose, children }: SheetProps) {
  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.sheet}
        data-tone={tone}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

interface ConfirmSheetProps {
  title: string
  /** What happens, in one sentence. */
  text: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/** The second step of an action that is hard to undo (end the match, leave, remove someone). */
export function ConfirmSheet({
  title,
  text,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  return (
    <Sheet label={title} onClose={onCancel}>
      <h3>{title}</h3>
      <p>{text}</p>
      <Button variant="danger" size="lg" fullWidth onClick={onConfirm}>
        {confirmLabel}
      </Button>
      <Button variant="secondary" size="lg" fullWidth onClick={onCancel}>
        Cancelar
      </Button>
    </Sheet>
  )
}

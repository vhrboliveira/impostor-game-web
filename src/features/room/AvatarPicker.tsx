import { useRef } from 'react'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/Icon'
import styles from './AvatarPicker.module.css'

interface AvatarPickerProps {
  /** For the initials while there is no photo. */
  name: string
  src: string | null
  title: string
  hint: string
  busy?: boolean
  error?: string | null
  onPick: (file: File) => void
  onRemove?: () => void
}

/**
 * The player's optional photo. One file input without `capture`, so phones offer both the
 * camera and the gallery.
 */
export function AvatarPicker({
  name,
  src,
  title,
  hint,
  busy = false,
  error,
  onPick,
  onRemove,
}: AvatarPickerProps) {
  const input = useRef<HTMLInputElement>(null)
  const open = () => input.current?.click()

  return (
    <div className={styles.picker}>
      {/* A bigger target for the same action as the button; hidden from assistive tech. */}
      <button
        type="button"
        className={styles.preview}
        onClick={open}
        disabled={busy}
        tabIndex={-1}
        aria-hidden="true"
      >
        <Avatar name={name.trim() || '?'} src={src} size="xl" />
        <span className={styles.badge}>
          <Icon name="camera" size={18} />
        </span>
      </button>

      <div className={styles.text}>
        <p className={styles.title}>{title}</p>
        <p className={styles.hint}>{hint}</p>
        <div className={styles.buttons}>
          <Button variant="secondary" icon="camera" onClick={open} disabled={busy}>
            {busy ? 'Carregando…' : src ? 'Trocar foto' : 'Adicionar foto'}
          </Button>
          {src && onRemove && (
            <Button variant="ghost" onClick={onRemove} disabled={busy}>
              Remover
            </Button>
          )}
        </div>
      </div>

      <input
        ref={input}
        type="file"
        accept="image/*"
        className="visually-hidden"
        tabIndex={-1}
        aria-label={title}
        onChange={(event) => {
          const file = event.target.files?.[0]
          // Cleared so picking the same file again still fires a change.
          event.target.value = ''
          if (file) onPick(file)
        }}
      />

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}

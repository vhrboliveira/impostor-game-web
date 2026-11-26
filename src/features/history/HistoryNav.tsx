import { Icon } from '@/shared/ui/Icon'
import styles from './HistoryNav.module.css'

interface HistoryNavProps {
  index: number
  total: number
  canGoBack: boolean
  canGoForward: boolean
  onBack: () => void
  onForward: () => void
}

// TODO: add horizontal swipe gestures on top of the arrow buttons.
export function HistoryNav({
  index,
  total,
  canGoBack,
  canGoForward,
  onBack,
  onForward,
}: HistoryNavProps) {
  return (
    <nav className={styles.nav} aria-label="Histórico de perguntas">
      <button
        type="button"
        className={styles.arrow}
        onClick={onBack}
        disabled={!canGoBack}
        aria-label="Pergunta anterior"
      >
        <Icon name="chevronLeft" size={24} />
      </button>
      {/* Only the turns already played are here; the dots show how many. */}
      <span className={styles.label}>Pergunta {index + 1}</span>
      <span className={styles.dots} aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} data-active={i === index || undefined} />
        ))}
      </span>
      <button
        type="button"
        className={styles.arrow}
        onClick={onForward}
        disabled={!canGoForward}
        aria-label="Próxima pergunta"
      >
        <Icon name="chevronRight" size={24} />
      </button>
    </nav>
  )
}

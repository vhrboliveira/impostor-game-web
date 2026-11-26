import { useState } from 'react'
import { useSend } from '@/realtime/sendContext'
import { Button } from '@/shared/ui/Button'
import styles from './EndMatchButton.module.css'

// Host-only. Two steps (button, then a confirmation sheet) to avoid ending a match by accident.
export function EndMatchButton() {
  const send = useSend()
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        icon="x"
        className={styles.trigger}
        onClick={() => setConfirming(true)}
      >
        Encerrar
      </Button>
      {confirming && (
        <div className={styles.backdrop} onClick={() => setConfirming(false)}>
          <div
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label="Confirmar encerramento da partida"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Encerrar partida?</h3>
            <p>O placar atual será o resultado final.</p>
            <Button
              variant="danger"
              size="lg"
              fullWidth
              onClick={() => send({ type: 'end_match' })}
            >
              Sim, encerrar
            </Button>
            <Button variant="secondary" size="lg" fullWidth onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

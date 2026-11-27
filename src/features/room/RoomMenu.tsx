import { useState } from 'react'
import type { RoomSnapshot } from '@/realtime/protocol'
import { isHost } from '@/realtime/selectors'
import { useSend } from '@/realtime/sendContext'
import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/Icon'
import { ConfirmSheet, Sheet } from '@/shared/ui/Sheet'
import styles from './RoomMenu.module.css'
import { useLeaveRoom } from './useLeaveRoom'

interface RoomMenuProps {
  snapshot: RoomSnapshot
}

type Step = 'menu' | 'leave' | 'end' | null

/**
 * The "⋯" of the match bar: leave the room (everyone) and end the match (host). Each action asks
 * for a confirmation first.
 */
export function RoomMenu({ snapshot }: RoomMenuProps) {
  const send = useSend()
  const leave = useLeaveRoom(snapshot.roomCode)
  const [step, setStep] = useState<Step>(null)
  const close = () => setStep(null)

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-label="Opções da sala"
        onClick={() => setStep('menu')}
      >
        <Icon name="more" size={22} />
      </button>

      {step === 'menu' && (
        <Sheet label="Opções da sala" tone="neutral" onClose={close}>
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            icon="logOut"
            onClick={() => setStep('leave')}
          >
            Sair da sala
          </Button>
          {isHost(snapshot) && (
            <Button variant="danger" size="lg" fullWidth icon="x" onClick={() => setStep('end')}>
              Encerrar partida
            </Button>
          )}
          <Button variant="ghost" size="lg" fullWidth onClick={close}>
            Fechar
          </Button>
        </Sheet>
      )}
      {step === 'leave' && (
        <ConfirmSheet
          title="Sair da sala?"
          text="Você perde sua vaga e seus pontos. Para voltar, terá que entrar de novo."
          confirmLabel="Sim, sair"
          onConfirm={leave}
          onCancel={close}
        />
      )}
      {step === 'end' && (
        <ConfirmSheet
          title="Encerrar partida?"
          text="O placar atual será o resultado final."
          confirmLabel="Sim, encerrar"
          onConfirm={() => {
            close()
            send({ type: 'end_match' })
          }}
          onCancel={close}
        />
      )}
    </>
  )
}

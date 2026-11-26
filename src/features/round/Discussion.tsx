import { HistoryViewer } from '@/features/history'
import { isHost } from '@/realtime/selectors'
import { useSend } from '@/realtime/sendContext'
import actions from '@/shared/ui/ActionRow.module.css'
import { Button } from '@/shared/ui/Button'
import { Countdown } from '@/shared/ui/Countdown'
import { Screen } from '@/shared/ui/Screen'
import styles from './Discussion.module.css'
import { SoundButton } from './SoundButton'
import type { PhaseProps } from './types'

// The discussion has a fixed duration set by the server; the voting starts when it ends. The host
// can add a minute or start the voting earlier.
export function Discussion({ snapshot, round }: PhaseProps) {
  const send = useSend()

  return (
    <Screen
      kicker="Discussão"
      title="Hora de discutir"
      subtitle="Conversem e descubram quem é o impostor."
      aside={
        <>
          <SoundButton />
          <Countdown deadlineAt={round.phaseDeadlineAt} />
        </>
      }
      footer={
        isHost(snapshot) ? (
          <div className={actions.row}>
            <Button
              size="lg"
              icon="arrowRight"
              className={actions.main}
              onClick={() => send({ type: 'start_voting' })}
            >
              Ir para a votação
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className={actions.side}
              onClick={() => send({ type: 'extend_discussion' })}
            >
              +1 min
            </Button>
          </div>
        ) : (
          <p className={styles.hint}>A votação começa quando o tempo acabar.</p>
        )
      }
    >
      <HistoryViewer turns={round.turns} players={snapshot.players} />
    </Screen>
  )
}

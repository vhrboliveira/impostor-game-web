import { useState } from 'react'
import { Podium, Scoreboard } from '@/features/scoreboard'
import type { RoomSnapshot } from '@/realtime/protocol'
import { isHost } from '@/realtime/selectors'
import { useSend } from '@/realtime/sendContext'
import { ROUND_OPTIONS } from '@/shared/config/gameRules'
import { Button } from '@/shared/ui/Button'
import { Screen } from '@/shared/ui/Screen'
import { WaitingDots } from '@/shared/ui/WaitingDots'
import formStyles from './RoomForms.module.css'
import styles from './MatchOver.module.css'

interface MatchOverProps {
  snapshot: RoomSnapshot
}

/** The podium. The host can start a new match in the same room ("Jogar de novo"). */
export function MatchOver({ snapshot }: MatchOverProps) {
  const send = useSend()
  const { match } = snapshot
  const [totalRounds, setTotalRounds] = useState<number>(match.totalRounds)

  return (
    <Screen
      kicker="Resultado final"
      title={match.status === 'ended_early' ? 'Partida encerrada' : 'Fim de jogo'}
      footer={
        isHost(snapshot) ? (
          <>
            <fieldset className={formStyles.fieldset}>
              <legend className={formStyles.legend}>Rodadas da próxima partida</legend>
              <div className={formStyles.chips}>
                {ROUND_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={formStyles.chip}
                    aria-pressed={totalRounds === option}
                    onClick={() => setTotalRounds(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>
            <Button
              size="lg"
              fullWidth
              icon="refresh"
              onClick={() => send({ type: 'play_again', payload: { totalRounds } })}
            >
              Jogar de novo
            </Button>
          </>
        ) : (
          <p className={styles.waiting}>
            <WaitingDots />
            Aguardando o anfitrião começar outra partida…
          </p>
        )
      }
    >
      <Podium players={snapshot.players} />
      <Scoreboard players={snapshot.players} title="Pódio" meId={snapshot.me.playerId} />
    </Screen>
  )
}

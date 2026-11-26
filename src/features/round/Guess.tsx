import type { CSSProperties } from 'react'
import { useSend } from '@/realtime/sendContext'
import { Choice } from '@/shared/ui/Choice'
import { Countdown } from '@/shared/ui/Countdown'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Screen } from '@/shared/ui/Screen'
import { WaitingDots } from '@/shared/ui/WaitingDots'
import styles from './Voting.module.css'
import type { PhaseProps } from './types'

// The impostor was found: they get one chance to guess the secret among the options. No pick
// before the countdown ends counts as a wrong guess.
export function Guess({ snapshot, round }: PhaseProps) {
  const send = useSend()

  if (snapshot.me.role !== 'impostor') {
    return (
      <Screen centered footer={<Countdown deadlineAt={round.phaseDeadlineAt} size="lg" />}>
        <EmptyState icon="mask" tone="danger">
          <h2>O impostor foi descoberto!</h2>
          <p>Agora ele tenta adivinhar o segredo.</p>
          <WaitingDots />
        </EmptyState>
      </Screen>
    )
  }

  return (
    <Screen
      kicker="Última chance"
      title="Você foi descoberto!"
      subtitle="Acerte o segredo para ganhar 1 ponto."
      aside={<Countdown deadlineAt={round.phaseDeadlineAt} />}
    >
      <ul className={`${styles.grid} stagger`}>
        {round.guessOptions.map((option, index) => (
          <li key={option.id} style={{ '--i': index } as CSSProperties}>
            <Choice
              layout="tile"
              onClick={() => send({ type: 'guess', payload: { optionId: option.id } })}
            >
              {option.label}
            </Choice>
          </li>
        ))}
      </ul>
    </Screen>
  )
}

import type { CSSProperties } from 'react'
import { isHost } from '@/realtime/selectors'
import { useSend } from '@/realtime/sendContext'
import { Button } from '@/shared/ui/Button'
import { Choice } from '@/shared/ui/Choice'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Screen } from '@/shared/ui/Screen'
import { WaitingDots } from '@/shared/ui/WaitingDots'
import styles from './Voting.module.css'
import type { PhaseProps } from './types'

export function ThemePicker({ snapshot, round }: PhaseProps) {
  const send = useSend()

  if (!isHost(snapshot)) {
    return (
      <Screen centered>
        <EmptyState icon="sparkle">
          <h2>Rodada {round.number}</h2>
          <p>O anfitrião está escolhendo o tema…</p>
          <WaitingDots />
        </EmptyState>
      </Screen>
    )
  }

  return (
    <Screen
      kicker="Nova rodada"
      title="Escolha o tema"
      subtitle="Todos vão receber uma palavra desse tema."
      footer={
        <Button
          size="lg"
          variant="secondary"
          fullWidth
          icon="dice"
          onClick={() => send({ type: 'select_theme', payload: { themeId: 'random' } })}
        >
          Sorteio
        </Button>
      }
    >
      <ul className={`${styles.grid} stagger`}>
        {round.themeOptions.map((theme, index) => (
          <li key={theme.id} style={{ '--i': index } as CSSProperties}>
            <Choice
              layout="tile"
              onClick={() => send({ type: 'select_theme', payload: { themeId: theme.id } })}
            >
              {theme.name}
            </Choice>
          </li>
        ))}
      </ul>
    </Screen>
  )
}

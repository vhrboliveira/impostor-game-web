import { isHost, isInRound } from '@/realtime/selectors'
import { useSend } from '@/realtime/sendContext'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Icon } from '@/shared/ui/Icon'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import { Screen } from '@/shared/ui/Screen'
import styles from './RoleReveal.module.css'
import type { PhaseProps } from './types'
import { roleText, useHoldToReveal } from './useHoldToReveal'

// The role is only visible while the card is held, so nobody can peek at a neighbor's phone.
// The questions start once every connected player tapped "Entendi"; the host can start earlier.
export function RoleReveal({ snapshot, round }: PhaseProps) {
  const send = useSend()
  const { revealed, seen, holdProps } = useHoldToReveal()
  const { role, secret, playerId } = snapshot.me
  const host = isHost(snapshot)
  const theme = round.themeName ? `Tema: ${round.themeName}` : undefined

  if (!isInRound(snapshot)) {
    return (
      <Screen centered>
        <EmptyState icon="clock">
          <h2>Rodada {round.number}</h2>
          {theme && <p>{theme}</p>}
          <p>Você estava offline quando a rodada começou. Você entra na próxima.</p>
        </EmptyState>
      </Screen>
    )
  }

  const confirmed = round.confirmedIds.includes(playerId)

  return (
    <Screen
      kicker="Revelação"
      title="Seu papel"
      subtitle={theme}
      footer={
        <>
          {confirmed ? (
            <>
              <ProgressBar
                value={round.confirmedIds.length}
                max={round.totalTurns}
                label={`${round.confirmedIds.length} de ${round.totalTurns} prontos`}
              />
              <p role="status" className={styles.status}>
                Aguardando os outros ({round.confirmedIds.length}/{round.totalTurns} prontos)
              </p>
            </>
          ) : (
            <Button
              size="lg"
              fullWidth
              icon="check"
              disabled={!seen}
              onClick={() => send({ type: 'confirm_reveal' })}
            >
              Entendi
            </Button>
          )}
          {host && (
            <Button variant="ghost" onClick={() => send({ type: 'start_questions' })}>
              Começar sem esperar
            </Button>
          )}
        </>
      }
    >
      <div className={styles.stage}>
        <button
          type="button"
          className={styles.card}
          data-hold
          data-revealed={revealed}
          {...holdProps}
        >
          <span className={styles.inner}>
            <span className={styles.front} aria-hidden={revealed || undefined}>
              <Icon name="eye" size={36} />
              Segure para ver
            </span>
            <span className={styles.back}>
              {revealed && (
                <>
                  <span className={styles.backLabel}>
                    {role === 'impostor' ? 'Shh…' : 'A palavra é'}
                  </span>
                  <span className={styles.secret}>{roleText(role, secret)}</span>
                </>
              )}
            </span>
          </span>
        </button>
        {/* Constant text: a hint that changed length would move the card while it is held. */}
        <p className={styles.hint}>Segure para ver, solte para esconder.</p>
      </div>
    </Screen>
  )
}

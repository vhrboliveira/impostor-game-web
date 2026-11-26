import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Scoreboard } from '@/features/scoreboard'
import type { RoundResult as Result } from '@/realtime/protocol'
import { getPlayerAvatar, getPlayerName, isHost, roundPlayerIds } from '@/realtime/selectors'
import { useSend } from '@/realtime/sendContext'
import { Button } from '@/shared/ui/Button'
import { Panel } from '@/shared/ui/Panel'
import { Screen } from '@/shared/ui/Screen'
import { WaitingDots } from '@/shared/ui/WaitingDots'
import { ImpostorReveal } from './ImpostorReveal'
import styles from './RoundResult.module.css'
import type { PhaseProps } from './types'

function guessText(guess: Result['guess']): string | null {
  if (!guess) return null
  if (guess.label === null) return 'O tempo acabou sem palpite.'
  return guess.correct
    ? `Ele acertou o segredo (${guess.label}) e ganhou 1 ponto.`
    : `Ele chutou "${guess.label}" e errou.`
}

// The round revealed: first the impostor (ImpostorReveal), then the secret, every vote and the
// points, which stay hidden until the reveal ends (the votes would give it away). The host moves
// on to the next round, or to the podium after the last one.
export function RoundResult({ snapshot, round }: PhaseProps) {
  const send = useSend()
  const [revealed, setRevealed] = useState(false)
  const { result } = round
  const { players, match } = snapshot

  if (!result) {
    return (
      <Screen centered>
        <WaitingDots />
        <p>Apurando os votos…</p>
      </Screen>
    )
  }

  const name = (id: string) => getPlayerName(players, id)
  const lastRound = round.number >= match.totalRounds
  const guess = guessText(result.guess)
  const roundIds = roundPlayerIds(round)
  const candidates = (
    roundIds.includes(result.impostorId) ? roundIds : [...roundIds, result.impostorId]
  ).map((id) => ({ id, name: name(id), src: getPlayerAvatar(players, id) }))

  return (
    <Screen
      kicker="Resultado"
      footer={
        isHost(snapshot) ? (
          <Button
            size="lg"
            fullWidth
            icon={lastRound ? 'trophy' : 'arrowRight'}
            onClick={() => send({ type: 'next_round' })}
          >
            {lastRound ? 'Ver pódio' : 'Próxima rodada'}
          </Button>
        ) : (
          <p className={styles.waiting}>
            <WaitingDots />
            Aguardando o anfitrião…
          </p>
        )
      }
    >
      <Panel
        tone={revealed ? (result.impostorFound ? 'success' : 'danger') : 'default'}
        className={styles.hero}
      >
        <ImpostorReveal
          candidates={candidates}
          impostorId={result.impostorId}
          found={result.impostorFound}
          onDone={() => setRevealed(true)}
        />
        {revealed && (
          <div className={styles.outcome}>
            <h2 className={styles.verdict}>
              {result.impostorFound ? 'O impostor foi descoberto!' : 'O impostor escapou!'}
            </h2>
            <p>
              O impostor era <strong>{name(result.impostorId)}</strong> e o segredo era{' '}
              <strong>{result.secret}</strong>.
            </p>
            {guess && <p className={styles.guess}>{guess}</p>}
          </div>
        )}
      </Panel>

      {revealed && (
        <div className={styles.details}>
          <section aria-label="Votos" className={styles.section}>
            <h3>Votos</h3>
            <ul className={`${styles.votes} stagger`}>
              {result.votes.map((vote, index) => (
                <li
                  key={vote.voterId}
                  style={{ '--i': index } as CSSProperties}
                  data-right={vote.targetId === result.impostorId || undefined}
                  data-abstained={vote.targetId === null || undefined}
                >
                  {vote.targetId
                    ? `${name(vote.voterId)} votou em ${name(vote.targetId)}`
                    : `${name(vote.voterId)} não votou`}
                </li>
              ))}
            </ul>
          </section>

          {result.points.length > 0 && (
            <section aria-label="Pontos da rodada" className={styles.section}>
              <h3>Pontos da rodada</h3>
              <ul className={styles.points}>
                {result.points.map((entry) => (
                  <li key={entry.playerId}>
                    <span>{name(entry.playerId)}</span> <strong>+{entry.points}</strong>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Scoreboard players={players} meId={snapshot.me.playerId} />
        </div>
      )}
    </Screen>
  )
}

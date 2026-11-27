import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import voteSound from '@/assets/sounds/vote.mp3'
import { HistoryViewer } from '@/features/history'
import { getPlayerAvatar, getPlayerName, isInRound, roundPlayerIds } from '@/realtime/selectors'
import { useSend } from '@/realtime/sendContext'
import { playSound, preloadSounds } from '@/shared/lib/sound'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { Choice } from '@/shared/ui/Choice'
import { Countdown } from '@/shared/ui/Countdown'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Icon } from '@/shared/ui/Icon'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import { Screen } from '@/shared/ui/Screen'
import styles from './Voting.module.css'
import type { PhaseProps } from './types'

// The player picks someone and confirms. Until the voting closes they can pick someone else and
// confirm again ("Mudar voto"). The voting closes when every connected player of the round voted
// or when the countdown ends; who voted for whom is only revealed in the result.
export function Voting({ snapshot, round }: PhaseProps) {
  const send = useSend()
  // The pick waiting for confirmation; starts on the confirmed vote, if any.
  const [choice, setChoice] = useState<string | null>(snapshot.me.voteTargetId)

  useEffect(() => {
    preloadSounds([voteSound])
  }, [])
  const { me, players } = snapshot
  const roundPlayers = roundPlayerIds(round)
  const candidates = roundPlayers.filter((id) => id !== me.playerId)
  const progress = `${round.votedIds.length}/${roundPlayers.length} votaram`
  const bar = (
    <ProgressBar value={round.votedIds.length} max={roundPlayers.length} label={progress} />
  )

  if (!isInRound(snapshot)) {
    return (
      <Screen centered aside={<Countdown deadlineAt={round.phaseDeadlineAt} />}>
        <EmptyState icon="clock">
          <h2>Votação</h2>
          <p>Você entra na próxima rodada. Os jogadores estão votando ({progress}).</p>
        </EmptyState>
        {bar}
      </Screen>
    )
  }

  const votedFor = me.voteTargetId
  const pending = choice !== null && choice !== votedFor

  function confirm() {
    if (choice === null || choice === votedFor) return
    playSound(voteSound)
    send({ type: 'vote', payload: { targetId: choice } })
  }

  return (
    <Screen
      kicker="Votação"
      title="Quem é o impostor?"
      subtitle="Escolha e confirme. Dá para trocar até todos votarem."
      aside={<Countdown deadlineAt={round.phaseDeadlineAt} />}
      footer={
        <>
          {bar}
          <p role="status" className={styles.status}>
            {votedFor
              ? `Seu voto: ${getPlayerName(players, votedFor)}. Aguardando os outros (${progress}).`
              : `Você ainda não votou (${progress}).`}
          </p>
          <Button size="lg" fullWidth icon="check" disabled={!pending} onClick={confirm}>
            {votedFor ? 'Mudar voto' : 'Confirmar voto'}
          </Button>
        </>
      }
    >
      <ul className={`${styles.list} stagger`}>
        {candidates.map((id, index) => (
          <li key={id} style={{ '--i': index } as CSSProperties}>
            <Choice
              selected={choice === id}
              leading={
                <Avatar name={getPlayerName(players, id)} src={getPlayerAvatar(players, id)} />
              }
              trailing={votedFor === id ? <Icon name="check" size={22} /> : undefined}
              onClick={() => setChoice(id)}
            >
              {getPlayerName(players, id)}
            </Choice>
          </li>
        ))}
      </ul>
      <HistoryViewer turns={round.turns} players={players} />
    </Screen>
  )
}

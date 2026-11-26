import { useEffect } from 'react'
import { HistoryNav, TurnCard, useHistoryCursor } from '@/features/history'
import type { Turn } from '@/realtime/protocol'
import { getPlayerName, isHost } from '@/realtime/selectors'
import { useSend } from '@/realtime/sendContext'
import { vibrate } from '@/shared/lib/haptics'
import actions from '@/shared/ui/ActionRow.module.css'
import { Button } from '@/shared/ui/Button'
import { Countdown } from '@/shared/ui/Countdown'
import { Icon } from '@/shared/ui/Icon'
import { Screen } from '@/shared/ui/Screen'
import { WaitingDots } from '@/shared/ui/WaitingDots'
import styles from './Questions.module.css'
import { SoundButton } from './SoundButton'
import type { PhaseProps } from './types'

export function Questions({ snapshot, round }: PhaseProps) {
  const send = useSend()
  const history = useHistoryCursor(round.turns.length)
  const viewedTurn: Turn | undefined = round.turns[history.index]
  const latestTurn: Turn | undefined = round.turns[history.latest]

  const { players, me } = snapshot
  const involvesMe = latestTurn?.askerId === me.playerId || latestTurn?.answererId === me.playerId
  const latestPosition = latestTurn?.position

  // Vibration is only a bonus (not supported on iOS). The on-screen alert below is the real cue.
  useEffect(() => {
    if (involvesMe) vibrate(120)
  }, [involvesMe, latestPosition])

  if (!viewedTurn || !latestTurn) {
    return (
      <Screen centered>
        <WaitingDots />
        <p>Preparando as perguntas…</p>
      </Screen>
    )
  }

  const answeringNow = latestTurn.answererId === me.playerId
  const askingNow = latestTurn.askerId === me.playerId
  const canAdvance = answeringNow || isHost(snapshot)
  const isLastTurn = latestTurn.position === round.totalTurns - 1
  // The answerer moves the game on; the host only steps in as a backup ("pular").
  const advanceLabel = answeringNow
    ? isLastTurn
      ? 'Ir para a discussão'
      : 'Prosseguir'
    : isLastTurn
      ? 'Encerrar perguntas'
      : 'Pular turno'

  const yourTurn = answeringNow
    ? 'Sua vez de responder!'
    : askingNow
      ? 'Sua vez de perguntar! Leia em voz alta.'
      : null

  let footer
  if (!history.isViewingLatest) {
    footer = (
      <div className={involvesMe ? styles.alert : styles.notice}>
        <p>{involvesMe ? 'É a sua vez!' : 'Você está vendo uma pergunta anterior.'}</p>
        <Button
          variant={involvesMe ? 'primary' : 'secondary'}
          fullWidth
          onClick={history.goToLatest}
        >
          Ir para o turno atual
        </Button>
      </div>
    )
  } else if (canAdvance) {
    footer = (
      <div className={actions.row}>
        <Button
          size="lg"
          icon="arrowRight"
          className={actions.main}
          onClick={() => send({ type: 'next_turn' })}
        >
          {advanceLabel}
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className={actions.side}
          onClick={() => send({ type: 'extend_turn' })}
        >
          +1 min
        </Button>
      </div>
    )
  } else {
    footer = <p className={styles.hint}>Quem responde toca em “Prosseguir”.</p>
  }

  return (
    <Screen
      kicker="Perguntas"
      title={`Turno ${latestTurn.position + 1} de ${round.totalTurns}`}
      aside={
        <>
          <SoundButton />
          <Countdown deadlineAt={latestTurn.deadlineAt} />
        </>
      }
      footer={footer}
    >
      {history.isViewingLatest && yourTurn && (
        <p role="status" className={styles.yourTurn}>
          <Icon name="message" size={22} />
          {yourTurn}
        </p>
      )}
      <TurnCard
        askerName={getPlayerName(players, viewedTurn.askerId)}
        answererName={getPlayerName(players, viewedTurn.answererId)}
        question={viewedTurn.question}
        live={history.isViewingLatest}
      />
      <HistoryNav
        index={history.index}
        total={round.turns.length}
        canGoBack={history.canGoBack}
        canGoForward={history.canGoForward}
        onBack={history.goBack}
        onForward={history.goForward}
      />
    </Screen>
  )
}

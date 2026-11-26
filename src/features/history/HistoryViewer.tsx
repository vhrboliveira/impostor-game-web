import type { Player, Turn } from '@/realtime/protocol'
import { getPlayerAvatar, getPlayerName } from '@/realtime/selectors'
import { HistoryNav } from './HistoryNav'
import styles from './HistoryViewer.module.css'
import { TurnCard } from './TurnCard'
import { useHistoryCursor } from './useHistoryCursor'

interface HistoryViewerProps {
  turns: Turn[]
  players: Player[]
}

// Read-only history, used during discussion and voting (all turns of the round are visible).
export function HistoryViewer({ turns, players }: HistoryViewerProps) {
  const history = useHistoryCursor(turns.length)
  const turn: Turn | undefined = turns[history.index]

  if (!turn) return null

  return (
    <section className={styles.viewer} aria-label="Perguntas da rodada">
      <h3 className={styles.title}>Perguntas da rodada</h3>
      <TurnCard
        askerName={getPlayerName(players, turn.askerId)}
        answererName={getPlayerName(players, turn.answererId)}
        askerAvatar={getPlayerAvatar(players, turn.askerId)}
        answererAvatar={getPlayerAvatar(players, turn.answererId)}
        question={turn.question}
      />
      <HistoryNav
        index={history.index}
        total={turns.length}
        canGoBack={history.canGoBack}
        canGoForward={history.canGoForward}
        onBack={history.goBack}
        onForward={history.goForward}
      />
    </section>
  )
}

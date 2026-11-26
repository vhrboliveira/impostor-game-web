import type { RoomSnapshot } from '@/realtime/protocol'
import { isHost } from '@/realtime/selectors'
import { MIN_PLAYERS } from '@/shared/config/gameRules'
import { Icon } from '@/shared/ui/Icon'
import { EndMatchButton } from './EndMatchButton'
import styles from './MatchBar.module.css'

interface MatchBarProps {
  snapshot: RoomSnapshot
}

/** The top of every round screen: where the match is, and the host's way out. */
export function MatchBar({ snapshot }: MatchBarProps) {
  const { match, round } = snapshot
  const host = isHost(snapshot)
  const connected = snapshot.players.filter((player) => player.isConnected).length

  return (
    <>
      <div className={styles.bar}>
        <p className={styles.where}>
          <span className={styles.round}>
            Rodada {match.roundNumber} de {match.totalRounds}
          </span>
          {round?.themeName && <span className={styles.theme}>{round.themeName}</span>}
        </p>
        {host && <EndMatchButton />}
      </div>
      {host && connected < MIN_PLAYERS && (
        <p role="status" className={styles.warning}>
          <Icon name="alert" />
          <span>
            Menos de {MIN_PLAYERS} jogadores conectados: não dá para começar outra rodada. Você pode
            encerrar a partida.
          </span>
        </p>
      )}
    </>
  )
}

import type { Player } from '@/realtime/protocol'
import { avatarSrc } from '@/realtime/selectors'
import { PlayerRow } from '@/shared/ui/PlayerRow'
import styles from './Scoreboard.module.css'
import { rankPlayers } from './rank'

interface ScoreboardProps {
  players: Player[]
  title?: string
  /** Highlights the player reading the screen. */
  meId?: string
}

// Highest score first; tied players share the same position (1, 1, 3...).
export function Scoreboard({ players, title = 'Placar', meId }: ScoreboardProps) {
  const ranked = rankPlayers(players)

  return (
    <section className={styles.board} aria-label={title}>
      <h3 className={styles.title}>{title}</h3>
      <ol className={`${styles.list} stagger`}>
        {ranked.map(({ player, position }, index) => (
          <PlayerRow
            key={player.id}
            index={index}
            name={player.name}
            avatarSrc={avatarSrc(player)}
            highlight={player.id === meId}
            leading={
              <span className={styles.position} data-medal={position <= 3 ? position : undefined}>
                {position}
              </span>
            }
            trailing={<span className={styles.score}>{player.score}</span>}
          />
        ))}
      </ol>
    </section>
  )
}

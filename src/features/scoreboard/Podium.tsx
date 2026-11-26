import type { CSSProperties } from 'react'
import type { Player } from '@/realtime/protocol'
import { avatarSrc } from '@/realtime/selectors'
import { Avatar } from '@/shared/ui/Avatar'
import styles from './Podium.module.css'
import { rankPlayers } from './rank'

interface PodiumProps {
  players: Player[]
}

/**
 * The top three on steps (2nd, 1st, 3rd), rising one after the other. Decorative: the full
 * ranking is the Scoreboard right below it.
 */
export function Podium({ players }: PodiumProps) {
  const top = rankPlayers(players).slice(0, 3)
  // Visual order: second, first, third.
  const steps = [top[1], top[0], top[2]].filter(Boolean)

  return (
    <div className={styles.podium} aria-hidden="true">
      {steps.map(({ player, position }, i) => (
        <div
          key={player.id}
          className={styles.step}
          data-place={position}
          style={{ '--i': [1, 0, 2][i] } as CSSProperties}
        >
          <Avatar name={player.name} src={avatarSrc(player)} size={position === 1 ? 'xl' : 'lg'} />
          <span className={styles.name}>{player.name}</span>
          <div className={styles.block}>
            <span className={styles.place}>{position}º</span>
            <span className={styles.points}>{player.score} pts</span>
          </div>
        </div>
      ))}
    </div>
  )
}

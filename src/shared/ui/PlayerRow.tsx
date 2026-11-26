import type { CSSProperties, ReactNode } from 'react'
import { Avatar } from './Avatar'
import styles from './PlayerRow.module.css'

interface PlayerRowProps {
  name: string
  /** The player's photo, if any. */
  avatarSrc?: string | null
  host?: boolean
  online?: boolean
  /** Badges or numbers at the right. */
  trailing?: ReactNode
  /** Small text under the name. */
  detail?: ReactNode
  highlight?: boolean
  /** Before the avatar (a position number). */
  leading?: ReactNode
  /** Position in a staggered list (for the entrance animation). */
  index?: number
}

/** One player in a list: avatar, name, extra info. Used by the lobby, results and scoreboard. */
export function PlayerRow({
  name,
  avatarSrc,
  host,
  online,
  trailing,
  detail,
  highlight,
  leading,
  index = 0,
}: PlayerRowProps) {
  return (
    <li
      className={styles.row}
      data-highlight={highlight || undefined}
      data-offline={online === false || undefined}
      style={{ '--i': index } as CSSProperties}
    >
      {leading}
      <Avatar name={name} src={avatarSrc} host={host} online={online} />
      <span className={styles.text}>
        <span className={styles.name}>{name}</span>
        {detail && <span className={styles.detail}>{detail}</span>}
      </span>
      {trailing}
    </li>
  )
}

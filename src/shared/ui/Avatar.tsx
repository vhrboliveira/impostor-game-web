import { useState } from 'react'
import type { CSSProperties } from 'react'
import styles from './Avatar.module.css'
import { Icon } from './Icon'

interface AvatarProps {
  name: string
  /** The player's photo. Without one (or while it fails to load) the initials show. */
  src?: string | null
  /** `portrait` fills its container (a square up to 18rem), for the impostor's reveal. */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'portrait'
  /** `card` is a rounded square instead of a circle. */
  shape?: 'circle' | 'card'
  /** Shows a crown: the host of the room. */
  host?: boolean
  /** Shows the presence dot; omit to hide it. */
  online?: boolean
}

// Stable hue per name, so each player keeps the same color on every phone.
function hueOf(name: string): number {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.codePointAt(0)!) >>> 0
  return hash % 360
}

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/)
  const first = [...(words[0] ?? '?')][0] ?? '?'
  const last = words.length > 1 ? ([...words[words.length - 1]][0] ?? '') : ''
  return (first + last).toUpperCase()
}

/**
 * A round badge with the player's photo, or their initials on a color of their own. Decorative:
 * the name is always shown next to it.
 */
export function Avatar({
  name,
  src,
  size = 'md',
  shape = 'circle',
  host = false,
  online,
}: AvatarProps) {
  // Remembers which URL failed, so a new photo is tried again.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showPhoto = Boolean(src) && src !== failedSrc

  return (
    <span
      className={styles.avatar}
      data-size={size}
      data-shape={shape}
      data-offline={online === false || undefined}
      style={{ '--hue': hueOf(name) } as CSSProperties}
      aria-hidden="true"
    >
      {showPhoto ? (
        <img
          className={styles.photo}
          src={src ?? undefined}
          alt=""
          decoding="async"
          draggable={false}
          onError={() => setFailedSrc(src ?? null)}
        />
      ) : (
        initialsOf(name)
      )}
      {host && (
        <span className={styles.crown}>
          <Icon name="crown" size={12} />
        </span>
      )}
      {online !== undefined && <span className={styles.dot} data-online={online} />}
    </span>
  )
}

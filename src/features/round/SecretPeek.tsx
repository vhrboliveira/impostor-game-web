import type { RoomSnapshot } from '@/realtime/protocol'
import { Icon } from '@/shared/ui/Icon'
import styles from './SecretPeek.module.css'
import { roleText, useHoldToReveal } from './useHoldToReveal'

interface SecretPeekProps {
  snapshot: RoomSnapshot
}

/**
 * Lets a player of the round see their role again at any moment ("Segure para lembrar"). It looks
 * the same for everyone, the impostor included (who sees "Você é o impostor!"): a button missing
 * from one phone would give the impostor away. The impostor never receives the secret from the
 * server, so there is nothing to reveal.
 *
 * Both faces are stacked in the same box and only their opacity changes, so holding never moves
 * or resizes anything (the button used to "jump").
 */
export function SecretPeek({ snapshot }: SecretPeekProps) {
  const { revealed, holdProps } = useHoldToReveal()
  const { role, secret } = snapshot.me

  return (
    <button
      type="button"
      className={styles.peek}
      data-hold
      data-revealed={revealed}
      aria-label={revealed ? undefined : 'Segure para lembrar seu papel'}
      {...holdProps}
    >
      <span className={styles.face} data-face="front" aria-hidden={revealed || undefined}>
        <Icon name="eye" />
        Segure para lembrar
      </span>
      <span className={styles.face} data-face="back">
        {revealed && roleText(role, secret)}
      </span>
    </button>
  )
}

import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import styles from './RoomInvite.module.css'
import { shareInvite } from './shareInvite'

interface RoomInviteProps {
  roomCode: string
}

/** The room code like a ticket, big enough to read across the table, and the invite button. */
export function RoomInvite({ roomCode }: RoomInviteProps) {
  const [feedback, setFeedback] = useState<string | null>(null)

  async function handleInvite() {
    const outcome = await shareInvite(roomCode)
    setFeedback(outcome === 'copied' ? 'Link copiado!' : null)
  }

  return (
    <header className={styles.ticket}>
      <p className={styles.caption}>Código da sala</p>
      <h1 className={styles.code} aria-label={`Código da sala ${roomCode.split('').join(' ')}`}>
        {roomCode.split('').map((char, i) => (
          <span key={i} className={styles.char} aria-hidden="true">
            {char}
          </span>
        ))}
      </h1>
      <Button variant="secondary" icon="share" onClick={handleInvite}>
        Convidar
      </Button>
      {feedback && (
        <p role="status" className={styles.caption}>
          {feedback}
        </p>
      )}
    </header>
  )
}

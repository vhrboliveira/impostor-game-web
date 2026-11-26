import { Avatar } from '@/shared/ui/Avatar'
import { Icon } from '@/shared/ui/Icon'
import styles from './TurnCard.module.css'

interface TurnCardProps {
  askerName: string
  answererName: string
  askerAvatar?: string | null
  answererAvatar?: string | null
  question: string
  /** Highlights the card (the turn in progress). */
  live?: boolean
}

/** One turn: who asks whom, and the question to read aloud. */
export function TurnCard({
  askerName,
  answererName,
  askerAvatar,
  answererAvatar,
  question,
  live = false,
}: TurnCardProps) {
  return (
    <article className={styles.card} data-live={live || undefined}>
      <p className={styles.pair} aria-label={`${askerName} pergunta para ${answererName}`}>
        <span className={styles.person}>
          <Avatar name={askerName} src={askerAvatar} size="lg" />
          <span className={styles.name}>{askerName}</span>
          <span className={styles.role}>pergunta</span>
        </span>
        <span className={styles.arrow} aria-hidden="true">
          <Icon name="arrowRight" size={28} />
        </span>
        <span className={styles.person}>
          <Avatar name={answererName} src={answererAvatar} size="lg" />
          <span className={styles.name}>{answererName}</span>
          <span className={styles.role}>responde</span>
        </span>
      </p>
      <p className={styles.question}>{question}</p>
    </article>
  )
}

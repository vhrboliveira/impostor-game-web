import { useCallback, useEffect, useRef, useState } from 'react'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/Icon'
import {
  prefersReducedMotion,
  REVEAL_HOLD_MS,
  REVEAL_PAUSE_MS,
  spinDelays,
  spinPath,
} from './impostorSpin'
import styles from './ImpostorReveal.module.css'

export interface RevealCandidate {
  id: string
  name: string
  src: string | null
}

interface ImpostorRevealProps {
  /** The players of the round; must include the impostor. */
  candidates: RevealCandidate[]
  impostorId: string
  found: boolean
  /** Called once the impostor is shown, to bring in the rest of the result. */
  onDone: () => void
}

interface Plan {
  start: number
  path: number[]
  delays: number[]
}

/**
 * The impostor's reveal at the start of the result: a spotlight runs over the photos of the
 * players of the round, slows down and stops on the impostor, whose photo pops with the mask. It
 * plays every time the result opens. A tap on "Pular" jumps to the end, and with reduced motion
 * the impostor shows right away.
 */
export function ImpostorReveal({ candidates, impostorId, found, onDone }: ImpostorRevealProps) {
  const target = candidates.findIndex((c) => c.id === impostorId)
  const [plan] = useState<Plan | null>(() => {
    if (target < 0 || candidates.length < 2 || prefersReducedMotion()) return null
    const start = Math.floor(Math.random() * candidates.length)
    const path = spinPath(candidates.length, target, start)
    return { start, path, delays: spinDelays(path.length) }
  })
  const [step, setStep] = useState(-1)
  const [revealed, setRevealed] = useState(plan === null)

  const timer = useRef<number | undefined>(undefined)
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  })

  useEffect(() => {
    if (!plan) {
      onDoneRef.current()
      return undefined
    }
    let next = 0
    const move = () => {
      setStep(next)
      next += 1
      if (next < plan.path.length) {
        timer.current = window.setTimeout(move, plan.delays[next])
        return
      }
      timer.current = window.setTimeout(() => {
        setRevealed(true)
        timer.current = window.setTimeout(() => onDoneRef.current(), REVEAL_HOLD_MS)
      }, REVEAL_PAUSE_MS)
    }
    timer.current = window.setTimeout(move, plan.delays[0])
    return () => window.clearTimeout(timer.current)
  }, [plan])

  const skip = useCallback(() => {
    window.clearTimeout(timer.current)
    setRevealed(true)
    onDoneRef.current()
  }, [])

  const index = revealed || !plan ? target : step < 0 ? plan.start : plan.path[step]
  const current = candidates[index] ?? candidates[0]
  if (!current) return null

  return (
    <div className={styles.reveal} data-revealed={revealed || undefined} data-found={found}>
      <p className={styles.kicker}>{revealed ? 'O impostor era' : 'Quem era o impostor?'}</p>

      <div className={styles.stage} aria-hidden={!revealed || undefined}>
        <span className={styles.glow} />
        {/* A new key per move replays the flash. */}
        <span key={revealed ? 'revealed' : `${step}`} className={styles.face}>
          <Avatar name={current.name} src={current.src} size="portrait" shape="card" />
        </span>
        {revealed && (
          <span className={styles.mask}>
            <Icon name="mask" size={34} />
          </span>
        )}
      </div>

      <p className={styles.name} aria-hidden={!revealed || undefined}>
        {current.name}
      </p>
      {!revealed && <p className="visually-hidden">Revelando o impostor…</p>}

      {!revealed && (
        <>
          <ul className={styles.strip} aria-hidden="true">
            {candidates.map((candidate, i) => (
              <li key={candidate.id} data-active={i === index || undefined}>
                <Avatar name={candidate.name} src={candidate.src} size="sm" />
              </li>
            ))}
          </ul>
          <Button variant="ghost" onClick={skip}>
            Pular
          </Button>
        </>
      )}
    </div>
  )
}

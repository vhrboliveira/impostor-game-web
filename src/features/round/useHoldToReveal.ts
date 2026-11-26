import { useCallback, useEffect, useState } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'

const isRevealKey = (event: KeyboardEvent) => event.key === ' ' || event.key === 'Enter'

/**
 * Hold-to-reveal: the content is visible only while the element is pressed (touch, mouse, or
 * Space/Enter), so nobody can peek at a neighbor's phone. Releasing, sliding off, losing focus or
 * sending the app to the background hides it again. `seen` stays true once it was revealed.
 */
export function useHoldToReveal() {
  const [revealed, setRevealed] = useState(false)
  const [seen, setSeen] = useState(false)

  const show = useCallback(() => {
    setRevealed(true)
    setSeen(true)
  }, [])
  const hide = useCallback(() => setRevealed(false), [])

  useEffect(() => {
    if (!revealed) return
    const hideWhenHidden = () => {
      if (document.visibilityState !== 'visible') hide()
    }
    document.addEventListener('visibilitychange', hideWhenHidden)
    return () => document.removeEventListener('visibilitychange', hideWhenHidden)
  }, [revealed, hide])

  const holdProps = {
    onPointerDown: show,
    onPointerUp: hide,
    onPointerLeave: hide,
    onPointerCancel: hide,
    onBlur: hide,
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (isRevealKey(event)) show()
    },
    onKeyUp: (event: KeyboardEvent<HTMLElement>) => {
      if (isRevealKey(event)) hide()
    },
    onContextMenu: (event: MouseEvent<HTMLElement>) => event.preventDefault(),
  }

  return { revealed, seen, holdProps }
}

/** What a player of the round sees while holding: the secret, or the impostor notice. */
export function roleText(role: 'insider' | 'impostor' | null, secret: string | null): string {
  return role === 'impostor' ? 'Você é o impostor!' : (secret ?? '')
}

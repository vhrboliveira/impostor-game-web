import type { ReactNode } from 'react'

interface PhaseTransitionProps {
  phaseKey: string
  children: ReactNode
}

// Remounts its content when the key changes, replaying the CSS entrance animation.
export function PhaseTransition({ phaseKey, children }: PhaseTransitionProps) {
  return (
    <div key={phaseKey} className="phase-enter">
      {children}
    </div>
  )
}

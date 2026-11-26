import { PhaseTransition } from '@/shared/ui/PhaseTransition'
import type { ReactNode } from 'react'
import type { Phase, RoomSnapshot, Round } from '@/realtime/protocol'
import { isInRound } from '@/realtime/selectors'
import { Discussion } from './Discussion'
import { Guess } from './Guess'
import { Questions } from './Questions'
import { RoleReveal } from './RoleReveal'
import { RoundResult } from './RoundResult'
import { SecretPeek } from './SecretPeek'
import { ThemePicker } from './ThemePicker'
import { Voting } from './Voting'

interface RoundViewProps {
  snapshot: RoomSnapshot
  round: Round
}

// The server decides the phase; the client only renders it.
function renderPhase(snapshot: RoomSnapshot, round: Round): ReactNode {
  switch (round.phase) {
    case 'theme_selection':
      return <ThemePicker snapshot={snapshot} round={round} />
    case 'reveal':
      return <RoleReveal snapshot={snapshot} round={round} />
    case 'questions':
      return <Questions snapshot={snapshot} round={round} />
    case 'discussion':
      return <Discussion snapshot={snapshot} round={round} />
    case 'voting':
      return <Voting snapshot={snapshot} round={round} />
    case 'guess':
      return <Guess snapshot={snapshot} round={round} />
    case 'result':
      return <RoundResult snapshot={snapshot} round={round} />
  }
}

// Phases in which a player of the round may need to recall their role. The reveal has its own
// card and the result shows the secret to everyone.
const PEEK_PHASES: ReadonlySet<Phase> = new Set(['questions', 'discussion', 'voting', 'guess'])

export function RoundView({ snapshot, round }: RoundViewProps) {
  return (
    <>
      {PEEK_PHASES.has(round.phase) && isInRound(snapshot) && <SecretPeek snapshot={snapshot} />}
      <PhaseTransition phaseKey={`${round.number}-${round.phase}`}>
        {renderPhase(snapshot, round)}
      </PhaseTransition>
    </>
  )
}

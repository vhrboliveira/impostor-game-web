import type { RoomSnapshot, Round } from '@/realtime/protocol'

export interface PhaseProps {
  snapshot: RoomSnapshot
  round: Round
}

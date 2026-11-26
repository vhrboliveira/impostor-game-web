import { endpoints } from '@/shared/config/endpoints'
import type { Player, RoomSnapshot } from './protocol'

export function getPlayerName(players: Player[], playerId: string): string {
  return players.find((player) => player.id === playerId)?.name ?? '?'
}

/** The URL of a player's photo, or null when they have none. */
export function avatarSrc(player: Pick<Player, 'avatarUrl'> | undefined): string | null {
  return player?.avatarUrl ? endpoints.apiPath(player.avatarUrl) : null
}

export function getPlayerAvatar(players: Player[], playerId: string): string | null {
  return avatarSrc(players.find((player) => player.id === playerId))
}

/** True when the player is in the round's turn ring (offline players sit a round out). */
export function isInRound(snapshot: RoomSnapshot): boolean {
  return snapshot.me.role !== null
}

/** Players of the current round, in ring order (the askers of the turn ring). */
export function roundPlayerIds(round: { turns: { askerId: string }[] }): string[] {
  return round.turns.map((turn) => turn.askerId)
}

export function isHost(snapshot: RoomSnapshot): boolean {
  return snapshot.players.some((player) => player.id === snapshot.me.playerId && player.isHost)
}

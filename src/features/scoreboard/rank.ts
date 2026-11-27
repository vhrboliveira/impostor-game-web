import type { Player } from '@/realtime/protocol'

export interface RankedPlayer {
  player: Player
  /** 1-based; tied players share it and the next position skips (1, 1, 3). */
  position: number
}

/**
 * Orders the players still in the room by score (ties keep the room order) and assigns
 * competition-style positions. Who left is out of the scoreboard and the podium.
 */
export function rankPlayers(players: Player[]): RankedPlayer[] {
  const sorted = players.filter((player) => !player.hasLeft).sort((a, b) => b.score - a.score)
  return sorted.map((player, index) => {
    const firstWithScore = sorted.findIndex((other) => other.score === player.score)
    return { player, position: (firstWithScore === -1 ? index : firstWithScore) + 1 }
  })
}

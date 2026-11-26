import type { Player } from '@/realtime/protocol'

export interface RankedPlayer {
  player: Player
  /** 1-based; tied players share it and the next position skips (1, 1, 3). */
  position: number
}

/** Orders players by score (ties keep the room order) and assigns competition-style positions. */
export function rankPlayers(players: Player[]): RankedPlayer[] {
  const sorted = [...players].sort((a, b) => b.score - a.score)
  return sorted.map((player, index) => {
    const firstWithScore = sorted.findIndex((other) => other.score === player.score)
    return { player, position: (firstWithScore === -1 ? index : firstWithScore) + 1 }
  })
}

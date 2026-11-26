import { describe, expect, it } from 'vitest'
import { serverMessageSchema } from './protocol'

const lobbySnapshot = {
  roomCode: 'ABCD',
  match: { status: 'lobby', totalRounds: 5, roundNumber: 0 },
  players: [{ id: 'p1', name: 'Ana', isHost: true, isConnected: true, score: 0 }],
  round: null,
  me: { playerId: 'p1', role: null, secret: null, voteTargetId: null },
}

describe('serverMessageSchema', () => {
  it('accepts a lobby snapshot', () => {
    const result = serverMessageSchema.safeParse({ type: 'room_snapshot', payload: lobbySnapshot })
    expect(result.success).toBe(true)
  })

  it('accepts players with and without a photo', () => {
    const result = serverMessageSchema.safeParse({
      type: 'room_snapshot',
      payload: {
        ...lobbySnapshot,
        players: [
          { ...lobbySnapshot.players[0], avatarUrl: '/api/room/ABCD/players/p1/avatar?v=1' },
          { id: 'p2', name: 'Bia', isHost: false, isConnected: true, score: 0, avatarUrl: null },
        ],
      },
    })
    expect(result.success).toBe(true)
    if (result.success && result.data.type === 'room_snapshot') {
      expect(result.data.payload.players.map((p) => p.avatarUrl)).toEqual([
        '/api/room/ABCD/players/p1/avatar?v=1',
        null,
      ])
    }
  })

  it('fills round defaults', () => {
    const result = serverMessageSchema.safeParse({
      type: 'room_snapshot',
      payload: { ...lobbySnapshot, round: { number: 1, phase: 'questions' } },
    })

    if (!result.success || result.data.type !== 'room_snapshot') {
      throw new Error('unexpected parse result')
    }
    expect(result.data.payload.round?.turns).toEqual([])
    expect(result.data.payload.round?.themeOptions).toEqual([])
    expect(result.data.payload.round?.result).toBeNull()
    expect(result.data.payload.round?.themeName).toBeNull()
    expect(result.data.payload.round?.totalTurns).toBe(0)
    expect(result.data.payload.round?.confirmedIds).toEqual([])
    expect(result.data.payload.round?.phaseDeadlineAt).toBeNull()
    expect(result.data.payload.round?.votedIds).toEqual([])
    expect(result.data.payload.round?.guessOptions).toEqual([])
  })

  it('rejects unknown message types', () => {
    expect(serverMessageSchema.safeParse({ type: 'unknown' }).success).toBe(false)
  })

  it('accepts a result with votes, guess and points', () => {
    const result = serverMessageSchema.safeParse({
      type: 'room_snapshot',
      payload: {
        ...lobbySnapshot,
        round: {
          number: 1,
          phase: 'result',
          result: {
            impostorId: 'p2',
            impostorFound: true,
            secret: 'Pizza',
            votes: [
              { voterId: 'p1', targetId: 'p2' },
              { voterId: 'p2', targetId: null },
            ],
            guess: { label: null, correct: false },
            points: [{ playerId: 'p1', points: 1 }],
          },
        },
      },
    })
    expect(result.success).toBe(true)
  })
})

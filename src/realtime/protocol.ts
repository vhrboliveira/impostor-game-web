import { z } from 'zod'

/*
  Wire protocol of the room WebSocket. Mirrors internal/protocol in the Go API; the contract is
  docs/protocol.md in the API repository. JSON keys are camelCase.

  Every message below is implemented by the server.

  Connection rules:
  - On every (re)connection the server sends a full `room_snapshot` first.
  - The snapshot only contains turns up to the current one, never future questions.
  - `me.secret` is null for the impostor.
  - Close codes 4401 (unauthorized) and 4404 (room not found) are final.
*/

export const phaseSchema = z.enum([
  'theme_selection',
  'reveal',
  'questions',
  'discussion',
  'voting',
  // Only when the impostor was found: they try to guess the secret.
  'guess',
  'result',
])
export type Phase = z.infer<typeof phaseSchema>

export const matchStatusSchema = z.enum(['lobby', 'in_progress', 'finished', 'ended_early'])
export type MatchStatus = z.infer<typeof matchStatusSchema>

const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  isHost: z.boolean(),
  isConnected: z.boolean(),
  score: z.number(),
  /** The player's photo (a versioned path under /api), null or absent without one. */
  avatarUrl: z.string().nullish(),
})
export type Player = z.infer<typeof playerSchema>

const turnSchema = z.object({
  position: z.number(),
  askerId: z.string(),
  answererId: z.string(),
  question: z.string(),
  deadlineAt: z.string().nullable(),
})
export type Turn = z.infer<typeof turnSchema>

const roundSchema = z.object({
  number: z.number(),
  phase: phaseSchema,
  /** The catalog, only in theme_selection. */
  themeOptions: z.array(z.object({ id: z.number(), name: z.string() })).default([]),
  /** The chosen theme, from the reveal on. */
  themeName: z.string().nullable().default(null),
  /** Size of the turn ring (one turn per player in the round); 0 before the theme is chosen. */
  totalTurns: z.number().default(0),
  /** Players who tapped "Entendi" in the reveal. */
  confirmedIds: z.array(z.string()).default([]),
  /** End of the discussion, the voting or the guess; null in the other phases. */
  phaseDeadlineAt: z.string().nullable().default(null),
  /** Players who already voted, during the voting (who they voted for stays secret). */
  votedIds: z.array(z.string()).default([]),
  /** Options of the impostor's guess, during the guess. */
  guessOptions: z.array(z.object({ id: z.string(), label: z.string() })).default([]),
  /** Turns up to the current one during the questions; the whole ring afterwards. */
  turns: z.array(turnSchema).default([]),
  /** Only in the result phase. */
  result: z
    .object({
      impostorId: z.string(),
      impostorFound: z.boolean(),
      secret: z.string(),
      /** Every player of the round in ring order; targetId null is an abstention. */
      votes: z
        .array(z.object({ voterId: z.string(), targetId: z.string().nullable() }))
        .default([]),
      /** The found impostor's guess (label null when time ran out); null when they escaped. */
      guess: z
        .object({ label: z.string().nullable(), correct: z.boolean() })
        .nullable()
        .default(null),
      /** Points earned in this round; players with none are left out. */
      points: z.array(z.object({ playerId: z.string(), points: z.number() })).default([]),
    })
    .nullable()
    .default(null),
})
export type Round = z.infer<typeof roundSchema>
export type RoundResult = NonNullable<Round['result']>

const meSchema = z.object({
  playerId: z.string(),
  role: z.enum(['insider', 'impostor']).nullable(),
  secret: z.string().nullable(),
  voteTargetId: z.string().nullable(),
})

export const roomSnapshotSchema = z.object({
  roomCode: z.string(),
  match: z.object({
    status: matchStatusSchema,
    totalRounds: z.number(),
    roundNumber: z.number(),
  }),
  players: z.array(playerSchema),
  round: roundSchema.nullable(),
  me: meSchema,
})
export type RoomSnapshot = z.infer<typeof roomSnapshotSchema>

export const serverMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('room_snapshot'), payload: roomSnapshotSchema }),
  z.object({ type: z.literal('error'), payload: z.object({ code: z.string() }) }),
  z.object({ type: z.literal('pong') }),
])
export type ServerMessage = z.infer<typeof serverMessageSchema>

export type ClientMessage =
  | { type: 'ping' }
  | { type: 'start_match' }
  | { type: 'select_theme'; payload: { themeId: number | 'random' } }
  | { type: 'confirm_reveal' }
  | { type: 'start_questions' }
  | { type: 'next_turn' }
  | { type: 'extend_turn' }
  | { type: 'extend_discussion' }
  | { type: 'start_voting' }
  | { type: 'vote'; payload: { targetId: string } }
  | { type: 'guess'; payload: { optionId: string } }
  | { type: 'next_round' }
  | { type: 'end_match' }
  | { type: 'play_again'; payload: { totalRounds: number } }

// Mirrors the rules in the game specification and the Go API. The server is the authority; these
// values only drive the UI (disabled buttons, form options, input filtering).
export const MIN_PLAYERS = 3
export const MAX_PLAYERS = 20
export const ROUND_OPTIONS = [3, 5, 8, 10, 12] as const
export const DEFAULT_ROUNDS = 5

// Room codes have 5 characters from an alphabet without ambiguous symbols (no I, O, 0 or 1).
// Same values as room.CodeAlphabet and room.CodeLength in the API.
export const ROOM_CODE_LENGTH = 5
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

// Same limit as room.MaxNameLength in the API (counted in characters).
export const PLAYER_NAME_MAX_LENGTH = 20

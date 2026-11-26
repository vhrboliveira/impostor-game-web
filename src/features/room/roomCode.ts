import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '@/shared/config/gameRules'

const allowed = new Set(ROOM_CODE_ALPHABET)

/**
 * Turns whatever the player typed or pasted into a room code candidate: upper case, only
 * characters that can appear in a code, at most ROOM_CODE_LENGTH of them. Pasting a whole invite
 * link keeps only its last path segment.
 */
export function sanitizeRoomCode(raw: string): string {
  const lastSegment = raw.trim().replace(/\/+$/, '').split('/').pop() ?? ''
  return [...lastSegment.toUpperCase()]
    .filter((char) => allowed.has(char))
    .slice(0, ROOM_CODE_LENGTH)
    .join('')
}

export function isCompleteRoomCode(code: string): boolean {
  return code.length === ROOM_CODE_LENGTH && [...code].every((char) => allowed.has(char))
}

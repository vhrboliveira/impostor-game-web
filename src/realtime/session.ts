import { z } from 'zod'

const sessionSchema = z.object({ playerId: z.string(), token: z.string() })
export type PlayerSession = z.infer<typeof sessionSchema>

const storageKey = (roomCode: string) => `party:session:${roomCode.toUpperCase()}`

// Storage can be unavailable (private mode, quota): every access is guarded.
export function loadSession(roomCode: string): PlayerSession | null {
  try {
    const raw = window.localStorage.getItem(storageKey(roomCode))
    if (!raw) return null
    const parsed = sessionSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function saveSession(roomCode: string, session: PlayerSession): void {
  try {
    window.localStorage.setItem(storageKey(roomCode), JSON.stringify(session))
  } catch {
    // Without storage the player simply cannot resume after closing the page.
  }
}

export function clearSession(roomCode: string): void {
  try {
    window.localStorage.removeItem(storageKey(roomCode))
  } catch {
    // Nothing to clear.
  }
}

import { z } from 'zod'

const sessionSchema = z.object({ playerId: z.string(), token: z.string() })
export type PlayerSession = z.infer<typeof sessionSchema>

// What is stored: the session plus when it was saved. Records written by older versions have no
// date; they get one the first time they are read.
const storedSchema = sessionSchema.extend({ savedAt: z.number().optional() })
type Stored = z.infer<typeof storedSchema>

const keyPrefix = 'party:session:'
const storageKey = (roomCode: string) => `${keyPrefix}${roomCode.toUpperCase()}`

// A room lives at most 24 hours (ROOM_TTL in the API). An older token can only be rejected, so it
// is forgotten instead of lingering on a shared or borrowed phone.
export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000

// Two stores, because several tabs of one browser can be different players of the same room:
// - sessionStorage belongs to the tab (it survives a reload): it is what each tab plays as, so a
//   second tab joining the room never takes over the first one's seat;
// - localStorage is shared by the tabs and survives closing the app (an iOS PWA killed in the
//   background): it holds the last session saved in this browser, used by a tab that has none of
//   its own (reopening the app, an invite link opened in a new tab), which then keeps it as its own.
function tabStore(): Storage {
  return window.sessionStorage
}

function sharedStore(): Storage {
  return window.localStorage
}

function read(store: Storage, key: string): Stored | null {
  const raw = store.getItem(key)
  if (!raw) return null
  try {
    const parsed = storedSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

function write(store: Storage, key: string, stored: Stored): void {
  store.setItem(key, JSON.stringify(stored))
}

function expired(savedAt: number | undefined): boolean {
  return savedAt !== undefined && Date.now() - savedAt > SESSION_MAX_AGE_MS
}

// Reads one store, dropping an expired record and dating an undated one.
function readFresh(store: Storage, key: string): Stored | null {
  const stored = read(store, key)
  if (!stored) return null
  if (expired(stored.savedAt)) {
    store.removeItem(key)
    return null
  }
  if (stored.savedAt === undefined) {
    const dated = { ...stored, savedAt: Date.now() }
    write(store, key, dated)
    return dated
  }
  return stored
}

// Storage can be unavailable (private mode, quota): every access is guarded.
export function loadSession(roomCode: string): PlayerSession | null {
  const key = storageKey(roomCode)
  try {
    const own = readFresh(tabStore(), key)
    if (own) return { playerId: own.playerId, token: own.token }
  } catch {
    // No per-tab storage: fall back to the shared one.
  }
  try {
    const shared = readFresh(sharedStore(), key)
    if (!shared) return null
    try {
      write(tabStore(), key, shared) // this tab now plays as this session
    } catch {
      // Without per-tab storage, the tab simply follows the shared session.
    }
    return { playerId: shared.playerId, token: shared.token }
  } catch {
    return null
  }
}

export function saveSession(roomCode: string, session: PlayerSession): void {
  const key = storageKey(roomCode)
  const stored = { ...session, savedAt: Date.now() }
  for (const store of [tabStore, sharedStore]) {
    try {
      if (store === sharedStore) sweepExpiredSessions()
      write(store(), key, stored)
    } catch {
      // Without storage the player simply cannot resume after closing the page.
    }
  }
}

/**
 * Forgets this tab's session (the server refused it). The shared record is removed only when it
 * is that same session: another tab may have saved its own since.
 */
export function clearSession(roomCode: string): void {
  const key = storageKey(roomCode)
  let token: string | undefined
  try {
    token = read(tabStore(), key)?.token
    tabStore().removeItem(key)
  } catch {
    // Nothing to clear.
  }
  try {
    const shared = read(sharedStore(), key)
    if (shared && (token === undefined || shared.token === token)) sharedStore().removeItem(key)
  } catch {
    // Nothing to clear.
  }
}

// Removes the shared sessions of rooms that no longer exist.
function sweepExpiredSessions(): void {
  const store = sharedStore()
  const keys: string[] = []
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i)
    if (key?.startsWith(keyPrefix)) keys.push(key)
  }
  for (const key of keys) {
    if (expired(read(store, key)?.savedAt)) store.removeItem(key)
  }
}

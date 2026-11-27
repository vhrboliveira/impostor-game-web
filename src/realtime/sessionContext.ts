import { createContext, useContext } from 'react'
import type { PlayerSession } from './session'

// The session of the live room connection. Actions that need the token use it, not storage:
// another tab may have stored a different session for the same room code since.
export const SessionContext = createContext<PlayerSession | null>(null)

export function useSession(): PlayerSession | null {
  return useContext(SessionContext)
}

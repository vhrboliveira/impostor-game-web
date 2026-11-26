import { createContext, useContext } from 'react'
import type { ClientMessage } from './protocol'

export type Send = (message: ClientMessage) => void

export const SendContext = createContext<Send | null>(null)

export function useSend(): Send {
  const send = useContext(SendContext)
  if (!send) throw new Error('useSend must be used inside <RoomConnection>')
  return send
}

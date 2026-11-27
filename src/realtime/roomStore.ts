import { create } from 'zustand'
import type { RoomSnapshot } from './protocol'
import type { ConnectionStatus } from './socketClient'

/** An error message from the server. `id` changes on every error, even with the same code. */
export interface ServerError {
  code: string
  id: number
}

interface RoomState {
  connectionStatus: ConnectionStatus
  snapshot: RoomSnapshot | null
  lastError: ServerError | null
  /** Close code (4401, 4403 or 4404) when the server refused the connection for good. */
  rejectedCode: number | null
  setConnectionStatus: (status: ConnectionStatus) => void
  applySnapshot: (snapshot: RoomSnapshot) => void
  reportError: (code: string) => void
  dismissError: () => void
  setRejected: (closeCode: number) => void
  reset: () => void
}

const initialState: Pick<
  RoomState,
  'connectionStatus' | 'snapshot' | 'lastError' | 'rejectedCode'
> = {
  connectionStatus: 'closed',
  snapshot: null,
  lastError: null,
  rejectedCode: null,
}

let nextErrorId = 1

// Server state only. Purely local UI state (e.g. history cursor) lives in components/hooks.
export const useRoomStore = create<RoomState>()((set) => ({
  ...initialState,
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  applySnapshot: (snapshot) => set({ snapshot }),
  reportError: (code) => set({ lastError: { code, id: nextErrorId++ } }),
  dismissError: () => set({ lastError: null }),
  setRejected: (rejectedCode) => set({ rejectedCode }),
  reset: () => set(initialState),
}))

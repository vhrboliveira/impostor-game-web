import { useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { endpoints } from '@/shared/config/endpoints'
import { useRoomStore } from './roomStore'
import { SendContext } from './sendContext'
import type { Send } from './sendContext'
import { clearSession } from './session'
import type { PlayerSession } from './session'
import { SocketClient } from './socketClient'

interface RoomConnectionProps {
  roomCode: string
  session: PlayerSession
  children: ReactNode
}

// Owns the socket lifecycle for one room and exposes `send` to the tree below.
export function RoomConnection({ roomCode, session, children }: RoomConnectionProps) {
  const clientRef = useRef<SocketClient | null>(null)

  useEffect(() => {
    const { setConnectionStatus, applySnapshot, reportError, setRejected, reset } =
      useRoomStore.getState()

    const client = new SocketClient({
      url: endpoints.roomSocket(roomCode, session.token),
      onStatusChange: setConnectionStatus,
      onMessage: (message) => {
        if (message.type === 'room_snapshot') applySnapshot(message.payload)
        else if (message.type === 'error') reportError(message.payload.code)
      },
      onRejected: (closeCode) => {
        // The token is useless now (room gone or session unknown): forget it.
        clearSession(roomCode)
        setRejected(closeCode)
      },
    })

    clientRef.current = client
    client.connect()

    return () => {
      client.close()
      clientRef.current = null
      reset()
    }
  }, [roomCode, session.token])

  const send = useCallback<Send>((message) => clientRef.current?.send(message), [])

  return <SendContext.Provider value={send}>{children}</SendContext.Provider>
}

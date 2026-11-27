import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSend } from '@/realtime/sendContext'
import { clearSession } from '@/realtime/session'

/**
 * Leaves the room for good: tells the server (which frees the seat and closes this player's
 * other tabs with 4403), forgets this tab's session and goes back home.
 */
export function useLeaveRoom(roomCode: string) {
  const send = useSend()
  const navigate = useNavigate()
  return useCallback(() => {
    send({ type: 'leave_room' })
    clearSession(roomCode)
    navigate('/')
  }, [send, navigate, roomCode])
}

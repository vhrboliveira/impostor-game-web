import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveSession } from '@/realtime/session'
import { describeError } from './errorMessages'
import { uploadAvatar } from './roomApi'
import type { JoinResult } from './roomApi'

/**
 * Shared flow for creating or joining a room: runs the request, stores the player session, sends
 * the optional photo and moves into the room. Pass `onEntered` to stay on the current route
 * instead of navigating.
 */
export function useEnterRoom(onEntered?: (result: JoinResult) => void) {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enter = useCallback(
    async (request: () => Promise<JoinResult>, photo?: Blob | null) => {
      setError(null)
      setSubmitting(true)
      try {
        const result = await request()
        saveSession(result.roomCode, { playerId: result.playerId, token: result.token })
        if (photo) {
          // Sent before entering, so the first snapshot already has it. The photo is a bonus:
          // failing to send it never keeps the player out (the lobby can try again).
          await uploadAvatar(result.roomCode, result.token, photo).catch(() => undefined)
        }
        if (onEntered) onEntered(result)
        else navigate(`/room/${result.roomCode}`)
      } catch (caught) {
        setError(describeError(caught))
        setSubmitting(false)
      }
    },
    [navigate, onEntered],
  )

  return { submitting, error, enter }
}

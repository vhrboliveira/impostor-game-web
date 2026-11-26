import { useCallback, useEffect, useState } from 'react'
import { prepareAvatar } from '@/shared/lib/avatarImage'
import { describeError } from './errorMessages'

/**
 * A photo picked before the room exists (create and join forms): prepared right away, previewed
 * locally and sent once the player has a session.
 */
export function useAvatarDraft() {
  const [photo, setPhoto] = useState<Blob | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [preparing, setPreparing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Frees the previous preview when it changes and the last one on unmount.
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const pick = useCallback(async (file: File) => {
    setError(null)
    setPreparing(true)
    try {
      const blob = await prepareAvatar(file)
      setPhoto(blob)
      setPreview(URL.createObjectURL(blob))
    } catch (caught) {
      setError(describeError(caught))
    } finally {
      setPreparing(false)
    }
  }, [])

  const remove = useCallback(() => {
    setPhoto(null)
    setPreview(null)
    setError(null)
  }, [])

  return { photo, preview, preparing, error, pick, remove }
}

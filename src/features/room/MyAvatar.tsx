import { useState } from 'react'
import type { RoomSnapshot } from '@/realtime/protocol'
import { avatarSrc } from '@/realtime/selectors'
import { useSession } from '@/realtime/sessionContext'
import { prepareAvatar } from '@/shared/lib/avatarImage'
import { AvatarPicker } from './AvatarPicker'
import { describeError } from './errorMessages'
import { ApiError, deleteAvatar, uploadAvatar } from './roomApi'

interface MyAvatarProps {
  snapshot: RoomSnapshot
}

/**
 * The player's photo in the lobby, the only place where it can change. The new photo comes back
 * in the next snapshot, like everyone else's.
 */
export function MyAvatar({ snapshot }: MyAvatarProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const me = snapshot.players.find((player) => player.id === snapshot.me.playerId)
  const session = useSession()

  async function run(action: (token: string) => Promise<void>) {
    if (!session) {
      setError(describeError(new ApiError(401, 'unauthorized')))
      return
    }
    setError(null)
    setBusy(true)
    try {
      await action(session.token)
    } catch (caught) {
      setError(describeError(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AvatarPicker
      name={me?.name ?? '?'}
      src={avatarSrc(me)}
      title="Sua foto"
      hint="Só dá para trocar aqui no lobby."
      busy={busy}
      error={error}
      onPick={(file) =>
        void run(async (token) => uploadAvatar(snapshot.roomCode, token, await prepareAvatar(file)))
      }
      onRemove={() => void run((token) => deleteAvatar(snapshot.roomCode, token))}
    />
  )
}

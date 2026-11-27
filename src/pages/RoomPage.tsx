import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { isCompleteRoomCode } from '@/features/room/roomCode'
import type { JoinResult } from '@/features/room/roomApi'
import {
  ConnectionBanner,
  JoinRoomForm,
  Lobby,
  MatchBar,
  MatchOver,
  RoomInvite,
  RoomUnavailable,
  ServerErrorBanner,
} from '@/features/room'
import { RoundView } from '@/features/round'
import { RoomConnection } from '@/realtime/RoomConnection'
import { useRoomStore } from '@/realtime/roomStore'
import { loadSession } from '@/realtime/session'
import { Screen } from '@/shared/ui/Screen'
import { WaitingDots } from '@/shared/ui/WaitingDots'
import { NotFoundPage } from './NotFoundPage'
import styles from './RoomPage.module.css'

export function RoomPage() {
  const { code = '' } = useParams()
  const roomCode = code.trim().toUpperCase()

  // Only a well-formed code reaches the storage key, the socket URL and the screen.
  if (!isCompleteRoomCode(roomCode)) return <NotFoundPage />

  // Keyed by room code so the session state resets when navigating to another room.
  return <RoomScreen key={roomCode} roomCode={roomCode} />
}

function RoomScreen({ roomCode }: { roomCode: string }) {
  const navigate = useNavigate()
  const [session, setSession] = useState(() => loadSession(roomCode))
  const rejectedCode = useRoomStore((state) => state.rejectedCode)

  // The forms let the player edit the code: the session belongs to the room actually joined, so a
  // different room means moving to its page (which loads the session saved for it).
  const entered = (result: JoinResult) => {
    if (result.roomCode !== roomCode) navigate(`/room/${result.roomCode}`)
    else setSession({ playerId: result.playerId, token: result.token })
  }

  // Someone opened an invite link without having joined yet.
  if (!session) {
    return (
      <Screen kicker="Convite" title={`Entrar na sala ${roomCode}`}>
        <JoinRoomForm initialCode={roomCode} onEntered={entered} />
      </Screen>
    )
  }

  return (
    <RoomConnection roomCode={roomCode} session={session}>
      {rejectedCode !== null ? (
        <RoomUnavailable roomCode={roomCode} closeCode={rejectedCode} onRejoined={entered} />
      ) : (
        <>
          <ConnectionBanner />
          <ServerErrorBanner />
          <RoomContent roomCode={roomCode} />
        </>
      )}
    </RoomConnection>
  )
}

function RoomContent({ roomCode }: { roomCode: string }) {
  const snapshot = useRoomStore((state) => state.snapshot)

  // The REST call already placed the player in the room; the code can be shared while the
  // realtime connection delivers the first snapshot.
  if (!snapshot) {
    return (
      <Screen>
        <RoomInvite roomCode={roomCode} />
        <p role="status" className={styles.connecting}>
          <WaitingDots />
          Conectando à sala…
        </p>
      </Screen>
    )
  }

  const { match, round } = snapshot

  if (match.status === 'lobby') return <Lobby snapshot={snapshot} />

  if (match.status === 'in_progress' && round) {
    return (
      <>
        <MatchBar snapshot={snapshot} />
        <RoundView snapshot={snapshot} round={round} />
      </>
    )
  }

  return <MatchOver snapshot={snapshot} />
}

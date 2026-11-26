import { useNavigate } from 'react-router-dom'
import { CLOSE_UNAUTHORIZED } from '@/realtime/socketClient'
import { Button } from '@/shared/ui/Button'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Screen } from '@/shared/ui/Screen'
import { JoinRoomForm } from './JoinRoomForm'
import type { JoinResult } from './roomApi'

interface RoomUnavailableProps {
  roomCode: string
  /** The close code the server used: 4401 (unknown session) or 4404 (room gone). */
  closeCode: number
  onRejoined: (result: JoinResult) => void
}

/** The server refused the connection for good; the saved session was already cleared. */
export function RoomUnavailable({ roomCode, closeCode, onRejoined }: RoomUnavailableProps) {
  const navigate = useNavigate()

  if (closeCode === CLOSE_UNAUTHORIZED) {
    return (
      <Screen
        kicker="Sessão expirada"
        title={`Entre de novo na sala ${roomCode}`}
        subtitle="Sua sessão nesta sala não vale mais."
      >
        <JoinRoomForm initialCode={roomCode} onEntered={onRejoined} />
      </Screen>
    )
  }

  return (
    <Screen
      centered
      footer={
        <Button size="lg" fullWidth onClick={() => navigate('/')}>
          Voltar ao início
        </Button>
      }
    >
      <EmptyState icon="x" tone="danger">
        <h2>A sala {roomCode} não existe mais</h2>
        <p>Salas são apagadas 1 hora depois de ficarem vazias, ou 24 horas depois de criadas.</p>
      </EmptyState>
    </Screen>
  )
}

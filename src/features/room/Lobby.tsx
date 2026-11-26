import type { RoomSnapshot } from '@/realtime/protocol'
import { avatarSrc, isHost } from '@/realtime/selectors'
import { useSend } from '@/realtime/sendContext'
import { MAX_PLAYERS, MIN_PLAYERS } from '@/shared/config/gameRules'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { PlayerRow } from '@/shared/ui/PlayerRow'
import { Screen } from '@/shared/ui/Screen'
import { WaitingDots } from '@/shared/ui/WaitingDots'
import styles from './Lobby.module.css'
import { MyAvatar } from './MyAvatar'
import { RoomInvite } from './RoomInvite'

interface LobbyProps {
  snapshot: RoomSnapshot
}

export function Lobby({ snapshot }: LobbyProps) {
  const send = useSend()
  const host = isHost(snapshot)
  // Same rule as the server: only connected players count to start.
  const connected = snapshot.players.filter((player) => player.isConnected).length
  const canStart = connected >= MIN_PLAYERS

  return (
    <Screen
      footer={
        host ? (
          <>
            {!canStart && (
              <p className={styles.caption}>Mínimo de {MIN_PLAYERS} jogadores conectados.</p>
            )}
            <Button
              size="lg"
              fullWidth
              icon="sparkle"
              disabled={!canStart}
              onClick={() => send({ type: 'start_match' })}
            >
              Começar partida
            </Button>
          </>
        ) : (
          <p className={styles.waiting}>
            <WaitingDots />
            Aguardando o anfitrião começar…
          </p>
        )
      }
    >
      <RoomInvite roomCode={snapshot.roomCode} />
      <MyAvatar snapshot={snapshot} />

      <section aria-label="Jogadores" className={styles.section}>
        <div className={styles.heading}>
          <h2 className={styles.title}>Jogadores</h2>
          <Badge tone="primary" icon="users">
            {snapshot.players.length}/{MAX_PLAYERS}
          </Badge>
        </div>
        <ul className={`${styles.players} stagger`}>
          {snapshot.players.map((player, index) => (
            <PlayerRow
              key={player.id}
              index={index}
              name={player.name}
              avatarSrc={avatarSrc(player)}
              host={player.isHost}
              online={player.isConnected}
              highlight={player.id === snapshot.me.playerId}
              trailing={
                <>
                  {player.id === snapshot.me.playerId && <Badge tone="primary">você</Badge>}
                  {player.isHost && <Badge tone="gold">anfitrião</Badge>}
                  {!player.isConnected && <Badge>offline</Badge>}
                </>
              }
            />
          ))}
        </ul>
      </section>
    </Screen>
  )
}

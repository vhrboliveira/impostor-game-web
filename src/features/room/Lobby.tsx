import { useState } from 'react'
import type { Player, RoomSnapshot } from '@/realtime/protocol'
import { activePlayers, avatarSrc, isHost } from '@/realtime/selectors'
import { useSend } from '@/realtime/sendContext'
import { MAX_PLAYERS, MIN_PLAYERS } from '@/shared/config/gameRules'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/Icon'
import { PlayerRow } from '@/shared/ui/PlayerRow'
import { Screen } from '@/shared/ui/Screen'
import { ConfirmSheet } from '@/shared/ui/Sheet'
import { WaitingDots } from '@/shared/ui/WaitingDots'
import styles from './Lobby.module.css'
import { MyAvatar } from './MyAvatar'
import { RoomInvite } from './RoomInvite'
import { useLeaveRoom } from './useLeaveRoom'

interface LobbyProps {
  snapshot: RoomSnapshot
}

export function Lobby({ snapshot }: LobbyProps) {
  const send = useSend()
  const leave = useLeaveRoom(snapshot.roomCode)
  const [leaving, setLeaving] = useState(false)
  const [removing, setRemoving] = useState<Player | null>(null)
  const host = isHost(snapshot)
  const players = activePlayers(snapshot.players)
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
            <Button variant="ghost" fullWidth icon="logOut" onClick={() => setLeaving(true)}>
              Sair da sala
            </Button>
          </>
        ) : (
          <>
            <p className={styles.waiting}>
              <WaitingDots />
              Aguardando o anfitrião começar…
            </p>
            <Button variant="ghost" fullWidth icon="logOut" onClick={() => setLeaving(true)}>
              Sair da sala
            </Button>
          </>
        )
      }
    >
      <RoomInvite roomCode={snapshot.roomCode} />
      <MyAvatar snapshot={snapshot} />

      <section aria-label="Jogadores" className={styles.section}>
        <div className={styles.heading}>
          <h2 className={styles.title}>Jogadores</h2>
          <Badge tone="primary" icon="users">
            {players.length}/{MAX_PLAYERS}
          </Badge>
        </div>
        <ul className={`${styles.players} stagger`}>
          {players.map((player, index) => (
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
                  {host && player.id !== snapshot.me.playerId && (
                    <button
                      type="button"
                      className={styles.remove}
                      aria-label={`Remover ${player.name}`}
                      onClick={() => setRemoving(player)}
                    >
                      <Icon name="x" size={18} />
                    </button>
                  )}
                </>
              }
            />
          ))}
        </ul>
      </section>

      {leaving && (
        <ConfirmSheet
          title="Sair da sala?"
          text="Você perde sua vaga. Para voltar, terá que entrar de novo."
          confirmLabel="Sim, sair"
          onConfirm={leave}
          onCancel={() => setLeaving(false)}
        />
      )}
      {removing && (
        <ConfirmSheet
          title={`Remover ${removing.name}?`}
          text="A pessoa sai da sala e, para voltar, terá que entrar de novo."
          confirmLabel="Sim, remover"
          onConfirm={() => {
            send({ type: 'remove_player', payload: { playerId: removing.id } })
            setRemoving(null)
          }}
          onCancel={() => setRemoving(null)}
        />
      )}
    </Screen>
  )
}

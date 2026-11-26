import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { PLAYER_NAME_MAX_LENGTH, ROOM_CODE_LENGTH } from '@/shared/config/gameRules'
import { Button } from '@/shared/ui/Button'
import { TextField } from '@/shared/ui/TextField'
import { joinRoom } from './roomApi'
import type { JoinResult } from './roomApi'
import { isCompleteRoomCode, sanitizeRoomCode } from './roomCode'
import styles from './RoomForms.module.css'
import { AvatarPicker } from './AvatarPicker'
import { useAvatarDraft } from './useAvatarDraft'
import { useEnterRoom } from './useEnterRoom'

interface JoinRoomFormProps {
  initialCode?: string
  onCancel?: () => void
  onEntered?: (result: JoinResult) => void
}

export function JoinRoomForm({ initialCode = '', onCancel, onEntered }: JoinRoomFormProps) {
  const [roomCode, setRoomCode] = useState(() => sanitizeRoomCode(initialCode))
  const [playerName, setPlayerName] = useState('')
  const photo = useAvatarDraft()
  const { submitting, error, enter } = useEnterRoom(onEntered)
  const codeHintId = useId()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void enter(() => joinRoom(roomCode, playerName.trim()), photo.photo)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fields}>
        <TextField
          label="Código da sala"
          className={styles.code}
          value={roomCode}
          onChange={(event) => setRoomCode(sanitizeRoomCode(event.target.value))}
          maxLength={ROOM_CODE_LENGTH}
          autoCapitalize="characters"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="next"
          placeholder="•••••"
          aria-describedby={codeHintId}
          required
        />
        <p id={codeHintId} className={styles.hint}>
          {ROOM_CODE_LENGTH} letras ou números, sem O, I, 0 ou 1.
        </p>
        <TextField
          label="Seu nome"
          value={playerName}
          onChange={(event) => setPlayerName(event.target.value)}
          maxLength={PLAYER_NAME_MAX_LENGTH}
          autoComplete="nickname"
          enterKeyHint="go"
          placeholder="Como te chamam na mesa"
          required
        />

        <AvatarPicker
          name={playerName}
          src={photo.preview}
          title="Sua foto"
          hint="Opcional. Todos veem, inclusive na revelação do impostor."
          busy={photo.preparing}
          error={photo.error}
          onPick={(file) => void photo.pick(file)}
          onRemove={photo.remove}
        />

        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
      </div>

      <div className={styles.actions}>
        <Button
          type="submit"
          size="lg"
          fullWidth
          icon="arrowRight"
          disabled={
            submitting ||
            photo.preparing ||
            !isCompleteRoomCode(roomCode) ||
            playerName.trim() === ''
          }
        >
          {submitting ? 'Entrando…' : 'Entrar na sala'}
        </Button>
        {onCancel && (
          <Button variant="ghost" fullWidth onClick={onCancel}>
            Voltar
          </Button>
        )}
      </div>
    </form>
  )
}

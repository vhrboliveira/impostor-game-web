import { useState } from 'react'
import type { FormEvent } from 'react'
import { DEFAULT_ROUNDS, PLAYER_NAME_MAX_LENGTH, ROUND_OPTIONS } from '@/shared/config/gameRules'
import { Button } from '@/shared/ui/Button'
import { TextField } from '@/shared/ui/TextField'
import { createRoom } from './roomApi'
import styles from './RoomForms.module.css'
import { AvatarPicker } from './AvatarPicker'
import { useAvatarDraft } from './useAvatarDraft'
import { useEnterRoom } from './useEnterRoom'

interface CreateRoomFormProps {
  onCancel?: () => void
}

export function CreateRoomForm({ onCancel }: CreateRoomFormProps) {
  const [playerName, setPlayerName] = useState('')
  const [totalRounds, setTotalRounds] = useState<number>(DEFAULT_ROUNDS)
  const photo = useAvatarDraft()
  const { submitting, error, enter } = useEnterRoom()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void enter(() => createRoom({ playerName: playerName.trim(), totalRounds }), photo.photo)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fields}>
        <TextField
          label="Seu nome"
          value={playerName}
          onChange={(event) => setPlayerName(event.target.value)}
          maxLength={PLAYER_NAME_MAX_LENGTH}
          autoComplete="nickname"
          enterKeyHint="done"
          placeholder="Como te chamam na mesa"
          required
        />

        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Número de rodadas</legend>
          <div className={styles.chips}>
            {ROUND_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={styles.chip}
                aria-pressed={totalRounds === option}
                onClick={() => setTotalRounds(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>

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
          icon="sparkle"
          disabled={submitting || photo.preparing || playerName.trim() === ''}
        >
          {submitting ? 'Criando…' : 'Criar sala'}
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

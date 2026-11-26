import { useState } from 'react'
import { CreateRoomForm, JoinRoomForm } from '@/features/room'
import { Button } from '@/shared/ui/Button'
import { Icon } from '@/shared/ui/Icon'
import { Screen } from '@/shared/ui/Screen'
import styles from './HomePage.module.css'

type HomeMode = 'menu' | 'create' | 'join'

export function HomePage() {
  const [mode, setMode] = useState<HomeMode>('menu')

  if (mode === 'create') {
    return (
      <Screen kicker="Nova partida" title="Criar sala" subtitle="Você será o anfitrião.">
        <CreateRoomForm onCancel={() => setMode('menu')} />
      </Screen>
    )
  }

  if (mode === 'join') {
    return (
      <Screen kicker="Já tem um código?" title="Entrar na sala">
        <JoinRoomForm onCancel={() => setMode('menu')} />
      </Screen>
    )
  }

  return (
    <Screen
      footer={
        <>
          <Button size="lg" fullWidth icon="plus" onClick={() => setMode('create')}>
            Criar sala
          </Button>
          <Button size="lg" variant="secondary" fullWidth onClick={() => setMode('join')}>
            Entrar com código
          </Button>
        </>
      }
    >
      <div className={styles.hero}>
        <div className={styles.cards} aria-hidden="true">
          <span className={styles.card} data-card="left" />
          <span className={styles.card} data-card="right" />
          <span className={styles.mark}>
            <Icon name="mask" size={56} />
          </span>
        </div>
        {/* TODO: replace with the final game name. */}
        <h1 className={styles.title}>
          Jogo do <span>Impostor</span>
        </h1>
        <p className={styles.subtitle}>Cada um no seu celular, todo mundo na mesma mesa.</p>
        <ul className={styles.steps}>
          <li>Todos recebem a palavra secreta, menos um.</li>
          <li>Perguntas em roda, respostas em voz alta.</li>
          <li>Descubram o impostor antes que ele descubra a palavra.</li>
        </ul>
      </div>
    </Screen>
  )
}

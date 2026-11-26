import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/shared/ui/Button'
import styles from './UpdatePrompt.module.css'

// The update is never applied automatically: reloading in the middle of a match would be rude.
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div role="status" className={styles.toast}>
      <span>Nova versão disponível.</span>
      <Button onClick={() => void updateServiceWorker(true)}>Atualizar</Button>
      <Button variant="ghost" onClick={() => setNeedRefresh(false)}>
        Depois
      </Button>
    </div>
  )
}

import { useRoomStore } from '@/realtime/roomStore'
import { Icon } from '@/shared/ui/Icon'
import styles from './Toast.module.css'

export function ConnectionBanner() {
  const status = useRoomStore((state) => state.connectionStatus)

  if (status !== 'reconnecting') return null

  return (
    <p role="status" className={styles.toast} data-tone="danger">
      <Icon name="wifiOff" />
      Conexão perdida. Reconectando…
    </p>
  )
}

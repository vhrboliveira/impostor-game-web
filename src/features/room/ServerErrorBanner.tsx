import { useEffect } from 'react'
import { useRoomStore } from '@/realtime/roomStore'
import { Icon } from '@/shared/ui/Icon'
import styles from './Toast.module.css'
import { describeServerError } from './serverErrors'

const VISIBLE_MS = 4000

/** Shows the last command the server rejected, for a few seconds or until tapped. */
export function ServerErrorBanner() {
  const lastError = useRoomStore((state) => state.lastError)
  const dismissError = useRoomStore((state) => state.dismissError)

  useEffect(() => {
    if (!lastError) return
    const timer = window.setTimeout(dismissError, VISIBLE_MS)
    return () => window.clearTimeout(timer)
  }, [lastError, dismissError])

  if (!lastError) return null

  return (
    <button
      key={lastError.id}
      type="button"
      role="alert"
      className={styles.toast}
      data-tone="danger"
      onClick={dismissError}
    >
      <Icon name="alert" />
      {describeServerError(lastError.code)}
    </button>
  )
}

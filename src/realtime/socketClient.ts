import { serverMessageSchema } from './protocol'
import type { ClientMessage, ServerMessage } from './protocol'

// 'rejected': the server closed with a final code (see FATAL_CLOSE_CODES); there is no retry.
export type ConnectionStatus = 'connecting' | 'open' | 'reconnecting' | 'closed' | 'rejected'

interface SocketClientOptions {
  url: string
  onMessage: (message: ServerMessage) => void
  onStatusChange: (status: ConnectionStatus) => void
  /** Called with the close code before the status becomes 'rejected'. */
  onRejected?: (closeCode: number) => void
}

const HEARTBEAT_MS = 25_000
const MAX_BACKOFF_MS = 10_000
const LIVENESS_CHECK_MS = 3_000
// Application close codes after which retrying is pointless (unauthorized, room not found).
export const CLOSE_UNAUTHORIZED = 4401
export const CLOSE_ROOM_NOT_FOUND = 4404
const FATAL_CLOSE_CODES = new Set([CLOSE_UNAUTHORIZED, CLOSE_ROOM_NOT_FOUND])

/**
 * Thin WebSocket wrapper: reconnects with exponential backoff, sends heartbeats and verifies the
 * connection is really alive when the page returns to the foreground (iOS suspends sockets in
 * the background without always closing them).
 */
export class SocketClient {
  private readonly options: SocketClientOptions
  private socket: WebSocket | null = null
  private attempt = 0
  private stopped = false
  private lastMessageAt = 0
  private heartbeatTimer: number | undefined
  private retryTimer: number | undefined

  constructor(options: SocketClientOptions) {
    this.options = options
  }

  connect(): void {
    this.stopped = false
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    this.open(false)
  }

  send(message: ClientMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
    }
  }

  close(): void {
    this.stopped = true
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    window.clearTimeout(this.retryTimer)
    this.stopHeartbeat()
    const socket = this.socket
    this.socket = null
    socket?.close(1000)
    this.options.onStatusChange('closed')
  }

  private open(isRetry: boolean): void {
    this.options.onStatusChange(isRetry ? 'reconnecting' : 'connecting')

    const socket = new WebSocket(this.options.url)
    this.socket = socket

    socket.onopen = () => {
      this.attempt = 0
      this.lastMessageAt = Date.now()
      this.options.onStatusChange('open')
      this.startHeartbeat()
    }

    socket.onmessage = (event: MessageEvent<unknown>) => {
      this.lastMessageAt = Date.now()
      this.handleMessage(event.data)
    }

    socket.onclose = (event) => {
      this.stopHeartbeat()
      // Ignore closes from sockets that were already replaced or intentionally closed.
      if (this.stopped || this.socket !== socket) return

      if (FATAL_CLOSE_CODES.has(event.code)) {
        this.stopped = true
        document.removeEventListener('visibilitychange', this.handleVisibilityChange)
        this.options.onRejected?.(event.code)
        this.options.onStatusChange('rejected')
        return
      }
      this.scheduleRetry()
    }
  }

  private handleMessage(data: unknown): void {
    if (typeof data !== 'string') return
    try {
      const parsed = serverMessageSchema.safeParse(JSON.parse(data))
      if (parsed.success) {
        this.options.onMessage(parsed.data)
      } else if (import.meta.env.DEV) {
        console.warn('Invalid server message', parsed.error.issues)
      }
    } catch {
      // Malformed JSON is ignored; the next snapshot resynchronizes the state.
    }
  }

  private scheduleRetry(): void {
    this.options.onStatusChange('reconnecting')
    const base = Math.min(MAX_BACKOFF_MS, 500 * 2 ** this.attempt)
    const delay = base * (0.5 + Math.random() / 2)
    this.attempt += 1
    this.retryTimer = window.setTimeout(() => this.open(true), delay)
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatTimer = window.setInterval(() => this.send({ type: 'ping' }), HEARTBEAT_MS)
  }

  private stopHeartbeat(): void {
    window.clearInterval(this.heartbeatTimer)
  }

  private readonly handleVisibilityChange = (): void => {
    if (this.stopped || document.visibilityState !== 'visible') return

    const socket = this.socket
    if (socket?.readyState === WebSocket.CONNECTING) return

    if (socket?.readyState === WebSocket.OPEN) {
      // Looks open, but may be a zombie connection: ping and force a reconnect if nothing returns.
      const pingedAt = Date.now()
      this.send({ type: 'ping' })
      window.setTimeout(() => {
        if (!this.stopped && this.lastMessageAt < pingedAt && this.socket === socket) {
          socket.close()
        }
      }, LIVENESS_CHECK_MS)
      return
    }

    window.clearTimeout(this.retryTimer)
    this.attempt = 0
    this.open(true)
  }
}

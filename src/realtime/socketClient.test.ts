import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SocketClient } from './socketClient'
import type { ConnectionStatus } from './socketClient'

// Minimal WebSocket stand-in: the test drives open, message and close events.
class FakeWebSocket {
  static readonly CONNECTING = 0
  static readonly OPEN = 1
  static instances: FakeWebSocket[] = []

  readonly url: string
  readyState = FakeWebSocket.CONNECTING
  sent: string[] = []
  onopen: (() => void) | null = null
  onmessage: ((event: { data: unknown }) => void) | null = null
  onclose: ((event: { code: number }) => void) | null = null

  constructor(url: string) {
    this.url = url
    FakeWebSocket.instances.push(this)
  }

  send(data: string) {
    this.sent.push(data)
  }

  close() {
    this.readyState = 3
  }

  serverOpens() {
    this.readyState = FakeWebSocket.OPEN
    this.onopen?.()
  }

  serverSends(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) })
  }

  serverCloses(code: number) {
    this.readyState = 3
    this.onclose?.({ code })
  }
}

function newClient() {
  const statuses: ConnectionStatus[] = []
  const onMessage = vi.fn()
  const onRejected = vi.fn()
  const client = new SocketClient({
    url: 'ws://test/ws/room/K7M2P?token=t',
    onMessage,
    onStatusChange: (status) => statuses.push(status),
    onRejected,
  })
  return { client, statuses, onMessage, onRejected }
}

const snapshot = {
  roomCode: 'K7M2P',
  match: { status: 'lobby', totalRounds: 5, roundNumber: 0 },
  players: [],
  round: null,
  me: { playerId: 'p1', role: null, secret: null, voteTargetId: null },
}

beforeEach(() => {
  FakeWebSocket.instances = []
  vi.stubGlobal('WebSocket', FakeWebSocket)
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('SocketClient', () => {
  it('passes valid server messages on and ignores invalid ones', () => {
    const { client, statuses, onMessage } = newClient()
    client.connect()
    const socket = FakeWebSocket.instances[0]
    socket.serverOpens()

    socket.serverSends({ type: 'room_snapshot', payload: snapshot })
    socket.serverSends({ type: 'mystery' })

    expect(statuses).toEqual(['connecting', 'open'])
    expect(onMessage).toHaveBeenCalledOnce()
    expect(onMessage.mock.calls[0][0]).toMatchObject({ type: 'room_snapshot' })
    client.close()
  })

  it.each([4401, 4404])('stops for good after close code %i', (code) => {
    const { client, statuses, onRejected } = newClient()
    client.connect()
    FakeWebSocket.instances[0].serverOpens()

    FakeWebSocket.instances[0].serverCloses(code)
    vi.advanceTimersByTime(60_000)

    expect(onRejected).toHaveBeenCalledWith(code)
    expect(statuses.at(-1)).toBe('rejected')
    expect(FakeWebSocket.instances).toHaveLength(1)
    client.close()
  })

  it.each([1001, 1006, 1013])('reconnects after close code %i', (code) => {
    const { client, statuses, onRejected } = newClient()
    client.connect()
    FakeWebSocket.instances[0].serverOpens()

    FakeWebSocket.instances[0].serverCloses(code)
    expect(statuses.at(-1)).toBe('reconnecting')
    vi.advanceTimersByTime(1_000)

    expect(FakeWebSocket.instances).toHaveLength(2)
    expect(onRejected).not.toHaveBeenCalled()
    client.close()
  })
})

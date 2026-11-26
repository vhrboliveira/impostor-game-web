import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as AvatarImage from '@/shared/lib/avatarImage'
import type { ClientMessage, RoomSnapshot } from '@/realtime/protocol'
import { useRoomStore } from '@/realtime/roomStore'
import { SendContext } from '@/realtime/sendContext'
import { saveSession } from '@/realtime/session'
import { Lobby } from './Lobby'
import { RoomUnavailable } from './RoomUnavailable'
import { ServerErrorBanner } from './ServerErrorBanner'

function lobbySnapshot(connected: boolean[]): RoomSnapshot {
  return {
    roomCode: 'K7M2P',
    match: { status: 'lobby', totalRounds: 5, roundNumber: 0 },
    players: connected.map((isConnected, i) => ({
      id: `p${i}`,
      name: `Jogador ${i}`,
      isHost: i === 0,
      isConnected,
      score: 0,
    })),
    round: null,
    me: { playerId: 'p0', role: null, secret: null, voteTargetId: null },
  }
}

function renderLobby(snapshot: RoomSnapshot) {
  const send = vi.fn<(message: ClientMessage) => void>()
  render(
    <SendContext.Provider value={send}>
      <Lobby snapshot={snapshot} />
    </SendContext.Provider>,
  )
  return send
}

beforeEach(() => {
  useRoomStore.getState().reset()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

// jsdom cannot decode images: the photo preparation is replaced by a fixed JPEG.
vi.mock('@/shared/lib/avatarImage', async (importOriginal) => ({
  ...(await importOriginal<typeof AvatarImage>()),
  prepareAvatar: vi.fn(async () => new Blob(['jpeg'], { type: 'image/jpeg' })),
}))

describe('Lobby', () => {
  it('only lets the host start with three connected players', () => {
    renderLobby(lobbySnapshot([true, true, false]))

    expect(screen.getByRole('button', { name: 'Começar partida' })).toBeDisabled()
    expect(screen.getByText('Mínimo de 3 jogadores conectados.')).toBeInTheDocument()
  })

  it('sends start_match when the host starts', () => {
    const send = renderLobby(lobbySnapshot([true, true, true]))

    fireEvent.click(screen.getByRole('button', { name: 'Começar partida' }))

    expect(send).toHaveBeenCalledWith({ type: 'start_match' })
  })

  it('shows the photos and lets the player change and remove their own', async () => {
    window.localStorage.clear()
    saveSession('K7M2P', { playerId: 'p0', token: 'secret-token' })
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    const snapshot = lobbySnapshot([true, true, true])
    snapshot.players[0].avatarUrl = '/api/room/K7M2P/players/p0/avatar?v=1'
    const { container } = render(
      <SendContext.Provider value={vi.fn()}>
        <Lobby snapshot={snapshot} />
      </SendContext.Provider>,
    )

    expect(
      container.querySelector('img[src="/api/room/K7M2P/players/p0/avatar?v=1"]'),
    ).not.toBeNull()

    fireEvent.change(screen.getByLabelText('Sua foto'), {
      target: { files: [new File(['raw'], 'me.jpg', { type: 'image/jpeg' })] },
    })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock.mock.calls[0][0]).toBe('/api/room/K7M2P/me/avatar')
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'PUT',
      headers: { Authorization: 'Bearer secret-token' },
    })

    fireEvent.click(await screen.findByRole('button', { name: 'Remover' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'DELETE' })
  })
})

describe('ServerErrorBanner', () => {
  it('translates the error and hides it after a few seconds', () => {
    vi.useFakeTimers()
    render(<ServerErrorBanner />)

    act(() => useRoomStore.getState().reportError('not_enough_players'))
    expect(screen.getByRole('alert')).toHaveTextContent(
      'São necessários pelo menos 3 jogadores conectados.',
    )

    act(() => vi.advanceTimersByTime(4000))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('hides when tapped and falls back for unknown codes', () => {
    render(<ServerErrorBanner />)

    act(() => useRoomStore.getState().reportError('brand_new_code'))
    expect(screen.getByRole('alert')).toHaveTextContent('Algo deu errado. Tente novamente.')

    fireEvent.click(screen.getByRole('alert'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('RoomUnavailable', () => {
  it('explains that a deleted room is gone', () => {
    render(
      <MemoryRouter>
        <RoomUnavailable roomCode="K7M2P" closeCode={4404} onRejoined={vi.fn()} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading')).toHaveTextContent('A sala K7M2P não existe mais')
    expect(screen.getByRole('button', { name: 'Voltar ao início' })).toBeInTheDocument()
  })

  it('offers to join again when the session is unknown', () => {
    render(
      <MemoryRouter>
        <RoomUnavailable roomCode="K7M2P" closeCode={4401} onRejoined={vi.fn()} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading')).toHaveTextContent('Entre de novo na sala K7M2P')
    expect(screen.getByLabelText('Código da sala')).toHaveValue('K7M2P')
  })
})

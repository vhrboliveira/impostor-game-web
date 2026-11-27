import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as AvatarImage from '@/shared/lib/avatarImage'
import type { ClientMessage, RoomSnapshot } from '@/realtime/protocol'
import { useRoomStore } from '@/realtime/roomStore'
import { SendContext } from '@/realtime/sendContext'
import { SessionContext } from '@/realtime/sessionContext'
import { loadSession, saveSession } from '@/realtime/session'
import { Lobby } from './Lobby'
import { MyAvatar } from './MyAvatar'
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
    <MemoryRouter>
      <SendContext.Provider value={send}>
        <Lobby snapshot={snapshot} />
      </SendContext.Provider>
    </MemoryRouter>,
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
    window.sessionStorage.clear()
    saveSession('K7M2P', { playerId: 'p0', token: 'secret-token' })
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    const snapshot = lobbySnapshot([true, true, true])
    snapshot.players[0].avatarUrl = '/api/room/K7M2P/players/p0/avatar?v=1'
    const { container } = render(
      <MemoryRouter>
        <SendContext.Provider value={vi.fn()}>
          <SessionContext.Provider value={{ playerId: 'p0', token: 'secret-token' }}>
            <Lobby snapshot={snapshot} />
          </SessionContext.Provider>
        </SendContext.Provider>
      </MemoryRouter>,
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

describe('Lobby: leaving and removing', () => {
  it('hides who left and lets the host remove someone after confirming', () => {
    const snapshot = lobbySnapshot([true, true, true, false])
    snapshot.players[3].hasLeft = true
    const send = renderLobby(snapshot)

    expect(screen.queryByText('Jogador 3')).not.toBeInTheDocument()
    expect(screen.getByText('3/20')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remover Jogador 0' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Remover Jogador 1' }))
    expect(send).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog', { name: 'Remover Jogador 1?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Sim, remover' }))
    expect(send).toHaveBeenCalledWith({ type: 'remove_player', payload: { playerId: 'p1' } })
  })

  it('only the host removes players', () => {
    const snapshot = lobbySnapshot([true, true, true])
    snapshot.me.playerId = 'p1'
    renderLobby(snapshot)
    expect(screen.queryByRole('button', { name: /^Remover/ })).not.toBeInTheDocument()
  })

  it('leaves the room after confirming, forgetting the session', () => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    saveSession('K7M2P', { playerId: 'p1', token: 't1' })
    const snapshot = lobbySnapshot([true, true, true])
    snapshot.me.playerId = 'p1'
    const send = vi.fn<(message: ClientMessage) => void>()
    render(
      <MemoryRouter initialEntries={['/room/K7M2P']}>
        <Routes>
          <Route
            path="/room/:code"
            element={
              <SendContext.Provider value={send}>
                <Lobby snapshot={snapshot} />
              </SendContext.Provider>
            }
          />
          <Route path="/" element={<p>home</p>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Sair da sala' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(send).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Sair da sala' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sim, sair' }))
    expect(send).toHaveBeenCalledWith({ type: 'leave_room' })
    expect(loadSession('K7M2P')).toBeNull()
    expect(screen.getByText('home')).toBeInTheDocument()
  })
})

describe('RoomUnavailable after a removal', () => {
  it('explains and offers to join again', () => {
    render(
      <MemoryRouter>
        <RoomUnavailable roomCode="K7M2P" closeCode={4403} onRejoined={vi.fn()} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Você saiu da sala' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar na sala' })).toBeInTheDocument()
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

// The photo actions use the session of the live connection, not whatever another tab stored
// for the same room code since.
describe('MyAvatar', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('removes the photo with the session of this connection', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    saveSession('K7M2P', { playerId: 'p0', token: 'other-tab-token' })
    const snapshot = lobbySnapshot([true])
    snapshot.players[0].avatarUrl = '/api/room/K7M2P/players/p0/avatar?v=1'

    render(
      <SessionContext.Provider value={{ playerId: 'p0', token: 'this-tab-token' }}>
        <MyAvatar snapshot={snapshot} />
      </SessionContext.Provider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Remover' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    const init = fetchMock.mock.calls[0][1]
    expect(new Headers(init?.headers).get('Authorization')).toBe('Bearer this-tab-token')
  })
})

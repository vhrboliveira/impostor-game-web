import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type * as AvatarImage from '@/shared/lib/avatarImage'
import { loadSession } from '@/realtime/session'
import { prepareAvatar } from '@/shared/lib/avatarImage'
import { CreateRoomForm } from './CreateRoomForm'
import { JoinRoomForm } from './JoinRoomForm'

// jsdom cannot decode images: the photo preparation is replaced by a fixed JPEG.
vi.mock('@/shared/lib/avatarImage', async (importOriginal) => ({
  ...(await importOriginal<typeof AvatarImage>()),
  prepareAvatar: vi.fn(async () => new Blob(['jpeg'], { type: 'image/jpeg' })),
}))

const session = { roomCode: 'K7M2P', playerId: 'p-1', token: 'secret-token' }

function respondWith(status: number, body: unknown) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderAtHome(ui: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={ui} />
        <Route path="/room/:code" element={<p>room page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

function sentBody(fetchMock: ReturnType<typeof respondWith>): unknown {
  return JSON.parse(fetchMock.mock.calls[0][1]?.body as string)
}

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('CreateRoomForm', () => {
  it('creates the room with the chosen rounds, stores the session and opens the room', async () => {
    const fetchMock = respondWith(201, session)
    renderAtHome(<CreateRoomForm />)

    fireEvent.change(screen.getByLabelText('Seu nome'), { target: { value: '  Ana  ' } })
    fireEvent.click(screen.getByRole('button', { name: '8' }))
    fireEvent.click(screen.getByRole('button', { name: 'Criar sala' }))

    expect(await screen.findByText('room page')).toBeInTheDocument()
    expect(sentBody(fetchMock)).toEqual({ playerName: 'Ana', totalRounds: 8 })
    expect(loadSession('K7M2P')).toEqual({ playerId: 'p-1', token: 'secret-token' })
  })

  it('shows the translated API error and stays on the form', async () => {
    respondWith(400, { code: 'invalid_name' })
    renderAtHome(<CreateRoomForm />)

    fireEvent.change(screen.getByLabelText('Seu nome'), { target: { value: 'Ana' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar sala' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Digite um nome válido')
    expect(screen.getByRole('button', { name: 'Criar sala' })).toBeEnabled()
    expect(loadSession('K7M2P')).toBeNull()
  })
})

describe('JoinRoomForm', () => {
  it('keeps only valid code characters and waits for a complete code', () => {
    renderAtHome(<JoinRoomForm />)
    const code = screen.getByLabelText('Código da sala')
    fireEvent.change(screen.getByLabelText('Seu nome'), { target: { value: 'Bia' } })

    fireEvent.change(code, { target: { value: 'k7-m2' } })
    expect(code).toHaveValue('K7M2')
    expect(screen.getByRole('button', { name: 'Entrar na sala' })).toBeDisabled()

    fireEvent.change(code, { target: { value: 'k7m2p' } })
    expect(code).toHaveValue('K7M2P')
    expect(screen.getByRole('button', { name: 'Entrar na sala' })).toBeEnabled()
  })

  it('joins with the code from an invite link', async () => {
    const fetchMock = respondWith(201, session)
    renderAtHome(<JoinRoomForm initialCode="k7m2p" />)

    expect(screen.getByLabelText('Código da sala')).toHaveValue('K7M2P')
    fireEvent.change(screen.getByLabelText('Seu nome'), { target: { value: 'Bia' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar na sala' }))

    expect(await screen.findByText('room page')).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][0]).toBe('/api/room/K7M2P/join')
    expect(sentBody(fetchMock)).toEqual({ playerName: 'Bia' })
  })

  it('calls onEntered instead of navigating when given', async () => {
    respondWith(201, session)
    const onEntered = vi.fn()
    renderAtHome(<JoinRoomForm initialCode="K7M2P" onEntered={onEntered} />)

    fireEvent.change(screen.getByLabelText('Seu nome'), { target: { value: 'Bia' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar na sala' }))

    await waitFor(() => expect(onEntered).toHaveBeenCalledWith(session))
    expect(screen.queryByText('room page')).not.toBeInTheDocument()
  })

  it.each([
    ['room_not_found', 404, 'Sala não encontrada'],
    ['room_full', 409, 'A sala está cheia'],
    ['match_in_progress', 409, 'A rodada está em andamento'],
  ])('shows the message for %s', async (code, status, message) => {
    respondWith(status, { code })
    renderAtHome(<JoinRoomForm initialCode="K7M2P" />)

    fireEvent.change(screen.getByLabelText('Seu nome'), { target: { value: 'Bia' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar na sala' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
  })
})

describe('photo', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'URL',
      Object.assign(URL, {
        createObjectURL: vi.fn(() => 'blob:preview'),
        revokeObjectURL: vi.fn(),
      }),
    )
  })

  it('sends the picked photo right after joining, before entering the room', async () => {
    const fetchMock = vi.fn<typeof fetch>(async (input) =>
      String(input).endsWith('/join')
        ? new Response(JSON.stringify(session), { status: 201 })
        : new Response(null, { status: 204 }),
    )
    vi.stubGlobal('fetch', fetchMock)
    renderAtHome(<JoinRoomForm initialCode="K7M2P" />)

    const file = new File(['raw'], 'me.heic', { type: 'image/heic' })
    fireEvent.change(screen.getByLabelText('Sua foto'), { target: { files: [file] } })
    expect(await screen.findByRole('button', { name: 'Trocar foto' })).toBeInTheDocument()
    expect(prepareAvatar).toHaveBeenCalledWith(file)

    fireEvent.change(screen.getByLabelText('Seu nome'), { target: { value: 'Bia' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar na sala' }))

    expect(await screen.findByText('room page')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const [url, init] = fetchMock.mock.calls[1]
    expect(url).toBe('/api/room/K7M2P/me/avatar')
    expect(init?.method).toBe('PUT')
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer secret-token' })
  })

  it('still enters the room when the photo upload fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async (input) =>
        String(input).endsWith('/api/room')
          ? new Response(JSON.stringify(session), { status: 201 })
          : new Response(JSON.stringify({ code: 'invalid_avatar' }), { status: 400 }),
      ),
    )
    renderAtHome(<CreateRoomForm />)

    fireEvent.change(screen.getByLabelText('Sua foto'), {
      target: { files: [new File(['raw'], 'me.jpg', { type: 'image/jpeg' })] },
    })
    await screen.findByRole('button', { name: 'Trocar foto' })
    fireEvent.change(screen.getByLabelText('Seu nome'), { target: { value: 'Ana' } })
    fireEvent.click(screen.getByRole('button', { name: 'Criar sala' }))

    expect(await screen.findByText('room page')).toBeInTheDocument()
  })

  it('can drop the picked photo', async () => {
    renderAtHome(<CreateRoomForm />)
    fireEvent.change(screen.getByLabelText('Sua foto'), {
      target: { files: [new File(['raw'], 'me.jpg', { type: 'image/jpeg' })] },
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Remover' }))
    expect(screen.getByRole('button', { name: 'Adicionar foto' })).toBeInTheDocument()
  })
})

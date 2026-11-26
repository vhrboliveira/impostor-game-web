import { afterEach, describe, expect, it, vi } from 'vitest'
import { describeError } from './errorMessages'
import {
  ApiError,
  NETWORK_ERROR_CODE,
  createRoom,
  deleteAvatar,
  joinRoom,
  uploadAvatar,
} from './roomApi'

const session = { roomCode: 'K7M2P', playerId: 'p-1', token: 'secret-token' }

function mockFetch(response: Response | Error) {
  const fetchMock = vi.fn<typeof fetch>()
  if (response instanceof Error) fetchMock.mockRejectedValue(response)
  else fetchMock.mockResolvedValue(response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function caught(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise
  } catch (error) {
    return error
  }
  throw new Error('expected the promise to reject')
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createRoom', () => {
  it('posts the name and rounds and returns the session', async () => {
    const fetchMock = mockFetch(jsonResponse(201, session))

    await expect(createRoom({ playerName: 'Ana', totalRounds: 5 })).resolves.toEqual(session)

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/room')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual({ playerName: 'Ana', totalRounds: 5 })
  })

  it('turns an API error body into an ApiError with its code', async () => {
    mockFetch(jsonResponse(400, { code: 'invalid_rounds' }))

    const error = await caught(createRoom({ playerName: 'Ana', totalRounds: 4 }))

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 400, code: 'invalid_rounds' })
  })
})

describe('joinRoom', () => {
  it('posts to the join endpoint of the room', async () => {
    const fetchMock = mockFetch(jsonResponse(201, session))

    await expect(joinRoom('K7M2P', 'Bia')).resolves.toEqual(session)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/room/K7M2P/join')
    expect(JSON.parse(init?.body as string)).toEqual({ playerName: 'Bia' })
  })

  it('reports a network failure with the network error code', async () => {
    mockFetch(new TypeError('Failed to fetch'))

    const error = await caught(joinRoom('K7M2P', 'Bia'))

    expect(error).toMatchObject({ status: 0, code: NETWORK_ERROR_CODE })
  })

  it('keeps a null code when the error body is not JSON', async () => {
    mockFetch(new Response('Bad Gateway', { status: 502 }))

    const error = await caught(joinRoom('K7M2P', 'Bia'))

    expect(error).toMatchObject({ status: 502, code: null })
  })

  it('rejects a success body without a session', async () => {
    mockFetch(jsonResponse(201, { roomCode: 'K7M2P' }))

    await expect(joinRoom('K7M2P', 'Bia')).rejects.toThrow()
  })
})

describe('describeError', () => {
  it.each([
    ['room_not_found', 'Sala não encontrada. Confira o código.'],
    ['room_full', 'A sala está cheia.'],
    ['match_in_progress', 'A rodada está em andamento. Tente entrar entre as rodadas.'],
    ['match_finished', 'A partida acabou. Peça ao anfitrião para começar outra e tente de novo.'],
    ['invalid_rounds', 'Escolha um número de rodadas válido.'],
    [NETWORK_ERROR_CODE, 'Sem conexão com o servidor. Verifique a internet e tente de novo.'],
  ])('translates %s', (code, message) => {
    expect(describeError(new ApiError(400, code))).toBe(message)
  })

  it.each([
    ['an unknown code', new ApiError(500, 'internal_error')],
    ['an error without code', new ApiError(502, null)],
    ['any other error', new Error('boom')],
  ])('falls back to a generic message for %s', (_, error) => {
    expect(describeError(error)).toBe('Algo deu errado. Tente novamente.')
  })
})

describe('avatar', () => {
  it('puts the image with the session token', async () => {
    const fetchMock = mockFetch(new Response(null, { status: 204 }))
    const image = new Blob(['jpg'], { type: 'image/jpeg' })

    await uploadAvatar('K7M2P', 'secret-token', image)

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/room/K7M2P/me/avatar')
    expect(init?.method).toBe('PUT')
    expect(init?.body).toBe(image)
    expect(init?.headers).toEqual({
      Authorization: 'Bearer secret-token',
      'Content-Type': 'image/jpeg',
    })
  })

  it('reports the locked photo', async () => {
    mockFetch(jsonResponse(409, { code: 'avatar_locked' }))

    const error = await caught(uploadAvatar('K7M2P', 't', new Blob(['jpg'])))

    expect(error).toBeInstanceOf(ApiError)
    expect(describeError(error)).toBe('A foto só pode ser trocada no lobby.')
  })

  it('deletes with the session token', async () => {
    const fetchMock = mockFetch(new Response(null, { status: 204 }))

    await deleteAvatar('K7M2P', 'secret-token')

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/room/K7M2P/me/avatar')
    expect(init?.method).toBe('DELETE')
    expect(init?.headers).toEqual({ Authorization: 'Bearer secret-token' })
  })
})

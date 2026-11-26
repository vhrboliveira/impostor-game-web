import { z } from 'zod'
import { endpoints } from '@/shared/config/endpoints'

const joinResultSchema = z.object({
  roomCode: z.string(),
  playerId: z.string(),
  token: z.string(),
})
export type JoinResult = z.infer<typeof joinResultSchema>

/** Code used when the request never reached the server (offline, DNS, CORS, server down). */
export const NETWORK_ERROR_CODE = 'network_error'

/**
 * A failed API call. `code` is the stable English identifier sent by the API
 * (`{"code":"room_not_found"}`), NETWORK_ERROR_CODE when there was no response, or null when the
 * response carried no code.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string | null

  constructor(status: number, code: string | null) {
    super(code ?? `HTTP ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

// Sends a request and turns any failure into an ApiError.
async function request(url: string, init: RequestInit): Promise<Response> {
  let response: Response
  try {
    response = await fetch(url, init)
  } catch {
    throw new ApiError(0, NETWORK_ERROR_CODE)
  }

  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null)
    const code =
      typeof data === 'object' && data !== null && 'code' in data && typeof data.code === 'string'
        ? data.code
        : null
    throw new ApiError(response.status, code)
  }
  return response
}

async function postJson(url: string, body: unknown): Promise<unknown> {
  const response = await request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return response.json()
}

/** POST /api/room: creates a room and makes the caller its host. */
export async function createRoom(input: {
  playerName: string
  totalRounds: number
}): Promise<JoinResult> {
  return joinResultSchema.parse(await postJson(endpoints.createRoom(), input))
}

/** POST /api/room/{code}/join: adds the caller to an existing room. */
export async function joinRoom(roomCode: string, playerName: string): Promise<JoinResult> {
  return joinResultSchema.parse(await postJson(endpoints.joinRoom(roomCode), { playerName }))
}

/**
 * PUT /api/room/{code}/me/avatar: sets the player's photo (a JPEG made by prepareAvatar). The
 * room gets it through the next snapshot. A first photo is accepted at any moment; changing it
 * only in the lobby (`avatar_locked`).
 */
export async function uploadAvatar(roomCode: string, token: string, image: Blob): Promise<void> {
  await request(endpoints.myAvatar(roomCode), {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': image.type || 'image/jpeg' },
    body: image,
  })
}

/** DELETE /api/room/{code}/me/avatar: removes the player's photo (lobby only). */
export async function deleteAvatar(roomCode: string, token: string): Promise<void> {
  await request(endpoints.myAvatar(roomCode), {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
}

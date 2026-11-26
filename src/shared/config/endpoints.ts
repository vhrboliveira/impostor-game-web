import { env } from './env'

// Single source of truth for backend URLs. Keep in sync with the Go API.
export const endpoints = {
  createRoom: () => `${env.apiBaseUrl}/api/room`,
  joinRoom: (roomCode: string) => `${env.apiBaseUrl}/api/room/${encodeURIComponent(roomCode)}/join`,
  // PUT (the image as the body) or DELETE, with the session token as a bearer token.
  myAvatar: (roomCode: string) =>
    `${env.apiBaseUrl}/api/room/${encodeURIComponent(roomCode)}/me/avatar`,
  // The snapshot carries a path under /api (with the photo's version); this makes it absolute.
  apiPath: (path: string) => `${env.apiBaseUrl}${path}`,
  // Browsers cannot set headers on a WebSocket handshake, so the token travels in the query string.
  roomSocket: (roomCode: string, token: string) =>
    `${env.wsBaseUrl}/ws/room/${encodeURIComponent(roomCode)}?token=${encodeURIComponent(token)}`,
} as const

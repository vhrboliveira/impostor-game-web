// Content Security Policy of the production build, injected as a <meta> tag by vite.config.ts.
// frame-ancestors, HSTS and the other protections a <meta> cannot carry must come as HTTP headers
// from the static host (see README.md, "Hosting").

interface CspOptions {
  /** VITE_API_BASE_URL: empty when the API is served from the same origin. */
  apiBaseUrl: string
  /** VITE_WS_BASE_URL: empty when the WebSocket is on the same origin. */
  wsBaseUrl: string
}

function origin(url: string): string | null {
  try {
    return url ? new URL(url).origin : null
  } catch {
    return null
  }
}

export function contentSecurityPolicy({ apiBaseUrl, wsBaseUrl }: CspOptions): string {
  const api = origin(apiBaseUrl)
  const ws = origin(wsBaseUrl)
  // Same origin needs ws:/wss: explicitly: 'self' does not cover WebSocket schemes everywhere.
  const connect = ["'self'", 'ws:', 'wss:', api, ws].filter(Boolean)
  const images = ["'self'", 'blob:', 'data:', api].filter(Boolean)
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `img-src ${images.join(' ')}`,
    `connect-src ${connect.join(' ')}`,
    "media-src 'self'",
    "font-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

const wsBaseUrl =
  import.meta.env.VITE_WS_BASE_URL ||
  `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`

export const env = { apiBaseUrl, wsBaseUrl } as const

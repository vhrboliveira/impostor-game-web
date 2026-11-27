import { describe, expect, it } from 'vitest'
import { contentSecurityPolicy } from './csp'

describe('content security policy of the production build', () => {
  it('only allows the app itself by default', () => {
    const csp = contentSecurityPolicy({ apiBaseUrl: '', wsBaseUrl: '' })
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("script-src 'self'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("base-uri 'self'")
    // Photo previews are blob: URLs.
    expect(csp).toMatch(/img-src 'self' blob:/)
  })

  it('allows a separate API origin for requests, photos and the WebSocket', () => {
    const csp = contentSecurityPolicy({
      apiBaseUrl: 'https://api.example/',
      wsBaseUrl: 'wss://api.example',
    })
    expect(csp).toMatch(/connect-src [^;]*https:\/\/api\.example/)
    expect(csp).toMatch(/connect-src [^;]*wss:\/\/api\.example/)
    expect(csp).toMatch(/img-src [^;]*https:\/\/api\.example/)
  })
})

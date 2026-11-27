import { describe, expect, it } from 'vitest'
import { isMemeSound } from './cacheRoutes'

const at = (href: string, sameOrigin = true) => ({
  url: new URL(href, 'https://app.example'),
  sameOrigin,
})

describe('service worker routes', () => {
  it('caches the meme sounds of the app itself', () => {
    expect(isMemeSound(at('/assets/memes/rapaz-abc123.mp3'))).toBe(true)
  })

  // The pattern is matched against the path only: a query string or another origin must never
  // make an API response look like a sound to cache.
  it('never matches the API, a query string or another origin', () => {
    expect(isMemeSound(at('/api/room/ABCDE/players/x/avatar?v=/assets/memes/a.mp3'))).toBe(false)
    expect(isMemeSound(at('/assets/memes/a.mp3/../x'))).toBe(false)
    expect(isMemeSound(at('https://other.example/assets/memes/a.mp3', false))).toBe(false)
  })
})

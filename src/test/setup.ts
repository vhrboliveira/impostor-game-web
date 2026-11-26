import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Testing Library only unmounts automatically when Vitest globals are on; they are off here.
afterEach(() => {
  cleanup()
})

// jsdom has no media playback: play() would log "Not implemented". Tests spy on this stub.
Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
  configurable: true,
  writable: true,
  value: vi.fn(() => Promise.resolve()),
})

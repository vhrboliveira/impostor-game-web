import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { memeSounds } from './memeSounds'
import { SoundButton } from './SoundButton'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SoundButton', () => {
  it('finds the sounds of the folder', () => {
    expect(memeSounds.length).toBeGreaterThan(1)
    for (const src of memeSounds) expect(src).toMatch(/\.mp3$/)
  })

  it('plays a different random sound on each tap', () => {
    const played: string[] = []
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
      this: HTMLMediaElement,
    ) {
      played.push(this.src)
      return Promise.resolve()
    })
    render(<SoundButton />)
    const button = screen.getByRole('button', { name: 'Tocar um som' })

    for (let i = 0; i < 6; i++) fireEvent.click(button)

    expect(played).toHaveLength(6)
    for (let i = 1; i < played.length; i++) expect(played[i]).not.toBe(played[i - 1])
    for (const src of played) expect(memeSounds.some((s) => src.endsWith(s))).toBe(true)
  })
})

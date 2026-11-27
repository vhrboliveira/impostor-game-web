import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearSession, loadSession, saveSession } from './session'

const start = new Date('2026-11-26T12:00:00Z')
const hours = (n: number) => new Date(start.getTime() + n * 60 * 60 * 1000)
const session = { playerId: 'p1', token: 't1' }

describe('player sessions', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
    vi.useFakeTimers()
    vi.setSystemTime(start)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps a session for the lifetime of a room', () => {
    saveSession('k7m2p', session)
    vi.setSystemTime(hours(23))
    expect(loadSession('K7M2P')).toEqual(session)
  })

  // A room lives at most 24 hours: an older token can only be rejected, and it should not linger
  // on a shared or borrowed phone.
  it('forgets a session older than the longest room lifetime', () => {
    saveSession('K7M2P', session)
    vi.setSystemTime(hours(25))
    expect(loadSession('K7M2P')).toBeNull()
    expect(window.localStorage.getItem('party:session:K7M2P')).toBeNull()
  })

  it('sweeps the expired sessions of other rooms', () => {
    saveSession('AAAAA', session)
    vi.setSystemTime(hours(25))
    saveSession('BBBBB', session)
    expect(window.localStorage.getItem('party:session:AAAAA')).toBeNull()
    expect(loadSession('BBBBB')).toEqual(session)
  })

  it('dates a session saved by an older version instead of dropping it', () => {
    window.localStorage.setItem('party:session:K7M2P', JSON.stringify(session))
    expect(loadSession('K7M2P')).toEqual(session)
    vi.setSystemTime(hours(25))
    expect(loadSession('K7M2P')).toBeNull()
  })

  // jsdom has one window: a tab is its sessionStorage, swapped in and out.
  function inTab<T>(tab: Record<string, string>, run: () => T): T {
    window.sessionStorage.clear()
    for (const [k, v] of Object.entries(tab)) window.sessionStorage.setItem(k, v)
    const result = run()
    for (const k of Object.keys(tab)) delete tab[k]
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const k = window.sessionStorage.key(i)!
      tab[k] = window.sessionStorage.getItem(k)!
    }
    return result
  }

  it('keeps each tab on its own player in the same room', () => {
    const tabA: Record<string, string> = {}
    const tabB: Record<string, string> = {}
    const ana = { playerId: 'ana', token: 'ta' }
    const bia = { playerId: 'bia', token: 'tb' }

    inTab(tabA, () => saveSession('K7M2P', ana))
    inTab(tabB, () => saveSession('K7M2P', bia))

    expect(inTab(tabA, () => loadSession('K7M2P'))).toEqual(ana)
    expect(inTab(tabB, () => loadSession('K7M2P'))).toEqual(bia)
    // A new tab (or the app reopened) resumes the last session saved in this browser.
    expect(inTab({}, () => loadSession('K7M2P'))).toEqual(bia)
  })

  it('clears only the tab whose session was refused', () => {
    const tabA: Record<string, string> = {}
    const tabB: Record<string, string> = {}
    inTab(tabA, () => saveSession('K7M2P', { playerId: 'ana', token: 'ta' }))
    inTab(tabB, () => saveSession('K7M2P', { playerId: 'bia', token: 'tb' }))

    inTab(tabA, () => clearSession('K7M2P'))

    expect(inTab(tabA, () => loadSession('K7M2P'))).toEqual({ playerId: 'bia', token: 'tb' })
    inTab(tabB, () => clearSession('K7M2P'))
    expect(inTab({}, () => loadSession('K7M2P'))).toBeNull()
  })
})

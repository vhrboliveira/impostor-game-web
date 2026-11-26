import { describe, expect, it } from 'vitest'
import { MIN_STEPS, SPIN_MS, spinDelays, spinPath } from './impostorSpin'

describe('spinPath', () => {
  it('always ends on the impostor after at least the minimum moves', () => {
    for (const count of [2, 3, 7, 20]) {
      for (let target = 0; target < count; target++) {
        for (let start = 0; start < count; start++) {
          const path = spinPath(count, target, start)
          expect(path.at(-1)).toBe(target)
          expect(path.length).toBeGreaterThanOrEqual(MIN_STEPS)
          expect(path.length).toBeLessThan(MIN_STEPS + count)
          expect(path[0]).toBe((start + 1) % count)
        }
      }
    }
  })
})

describe('spinDelays', () => {
  it('slows down and adds up to the spin duration', () => {
    const delays = spinDelays(20)
    expect(delays.reduce((a, b) => a + b, 0)).toBeCloseTo(SPIN_MS)
    for (let i = 1; i < delays.length; i++) expect(delays[i]).toBeGreaterThanOrEqual(delays[i - 1])
    expect(delays.at(-1)! / delays[0]).toBeCloseTo(8)
  })
})

import { describe, expect, it } from 'vitest'
import { resolveIndex, stepIndex } from './cursor'

describe('resolveIndex', () => {
  it('follows the latest turn when the view is null', () => {
    expect(resolveIndex(null, 4)).toBe(4)
  })

  it('clamps the view to the latest turn', () => {
    expect(resolveIndex(9, 4)).toBe(4)
  })

  it('returns -1 when there are no turns', () => {
    expect(resolveIndex(null, -1)).toBe(-1)
  })
})

describe('stepIndex', () => {
  it('goes back one turn', () => {
    expect(stepIndex(null, 4, -1)).toBe(3)
  })

  it('returns to following when it reaches the latest turn', () => {
    expect(stepIndex(3, 4, 1)).toBeNull()
  })

  it('stays on the first turn when going back', () => {
    expect(stepIndex(0, 4, -1)).toBe(0)
  })

  it('keeps following when there is nothing to go back to', () => {
    expect(stepIndex(null, 0, -1)).toBeNull()
  })
})

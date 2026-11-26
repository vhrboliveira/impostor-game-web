import { describe, expect, it } from 'vitest'
import { shuffleBag } from './shuffleBag'

describe('shuffleBag', () => {
  it('draws every item once per round, never the same twice in a row', () => {
    const items = ['a', 'b', 'c', 'd', 'e']
    const next = shuffleBag(items)
    let previous: string | undefined

    for (let round = 0; round < 50; round++) {
      const drawn = items.map(() => next())
      expect([...drawn].sort()).toEqual(items)
      for (const item of drawn) {
        expect(item).not.toBe(previous)
        previous = item
      }
    }
  })

  it('works with a single item', () => {
    const next = shuffleBag(['only'])
    expect([next(), next()]).toEqual(['only', 'only'])
  })
})

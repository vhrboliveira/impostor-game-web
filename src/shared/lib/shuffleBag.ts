/**
 * Draws the items in random order without repeating any until all were drawn, like taking
 * cards from a shuffled deck. When the deck is reshuffled, the first card is never the one just
 * drawn, so the same item never comes twice in a row.
 */
export function shuffleBag<T>(items: readonly T[], random: () => number = Math.random): () => T {
  let bag: T[] = []
  let last: T | undefined

  return () => {
    if (bag.length === 0) {
      bag = [...items]
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1))
        ;[bag[i], bag[j]] = [bag[j], bag[i]]
      }
      // Items are drawn from the end.
      if (bag.length > 1 && bag[bag.length - 1] === last) {
        ;[bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]]
      }
    }
    last = bag.pop() as T
    return last
  }
}

/** How long the spotlight runs over the players before stopping on the impostor. */
export const SPIN_MS = 2600
/** The spotlight passes at least this many times before stopping. */
export const MIN_STEPS = 14
/** Pause on the impostor before the reveal pops, and how long the reveal plays. */
export const REVEAL_PAUSE_MS = 350
export const REVEAL_HOLD_MS = 700

/**
 * The positions the spotlight visits, starting after `start` and ending on `target`, with at
 * least `minSteps` moves.
 */
export function spinPath(count: number, target: number, start: number, minSteps = MIN_STEPS) {
  const extra = (((target - start - minSteps) % count) + count) % count
  const total = minSteps + extra
  return Array.from({ length: total }, (_, i) => (start + i + 1) % count)
}

/** Waits before each move: short at first, slowing down at the end, adding up to totalMs. */
export function spinDelays(steps: number, totalMs = SPIN_MS): number[] {
  const weights = Array.from({ length: steps }, (_, i) => 1 + 7 * (i / Math.max(steps - 1, 1)) ** 3)
  const sum = weights.reduce((a, b) => a + b, 0)
  return weights.map((w) => (w / sum) * totalMs)
}

export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
}

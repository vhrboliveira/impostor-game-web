/** `null` means "following the latest turn". A number is a turn the player navigated back to. */
export type ViewIndex = number | null

/** Index of the turn currently displayed, or -1 when there are no turns. */
export function resolveIndex(view: ViewIndex, latest: number): number {
  if (latest < 0) return -1
  return view === null ? latest : Math.min(Math.max(view, 0), latest)
}

/** Moves the cursor one turn. Never goes past the first turn nor beyond the latest one. */
export function stepIndex(view: ViewIndex, latest: number, delta: -1 | 1): ViewIndex {
  const next = resolveIndex(view, latest) + delta
  if (next < 0) return view
  if (next >= latest) return null
  return next
}

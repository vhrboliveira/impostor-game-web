import { useState } from 'react'
import { resolveIndex, stepIndex } from './cursor'
import type { ViewIndex } from './cursor'

/**
 * Local (per player) cursor over the turns of the current round. It follows the latest turn
 * until the player navigates back, and it never moves past the latest turn.
 */
export function useHistoryCursor(turnCount: number) {
  const latest = turnCount - 1
  const [view, setView] = useState<ViewIndex>(null)
  const index = resolveIndex(view, latest)

  return {
    index,
    latest,
    isViewingLatest: index === latest,
    canGoBack: index > 0,
    canGoForward: index < latest,
    goBack: () => setView((current) => stepIndex(current, latest, -1)),
    goForward: () => setView((current) => stepIndex(current, latest, 1)),
    goToLatest: () => setView(null),
  }
}

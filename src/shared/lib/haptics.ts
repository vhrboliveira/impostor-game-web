// The Vibration API does not exist on iOS Safari, so this is a progressive enhancement only.
// Anything important must also be communicated visually.
export function vibrate(pattern: number | number[]): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

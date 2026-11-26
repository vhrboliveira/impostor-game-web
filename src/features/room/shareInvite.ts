export type ShareOutcome = 'shared' | 'copied' | 'failed'

// Uses the native share sheet when available (most phones) and falls back to the clipboard.
export async function shareInvite(roomCode: string): Promise<ShareOutcome> {
  const url = `${window.location.origin}/room/${roomCode}`
  try {
    if (typeof navigator.share === 'function') {
      await navigator.share({
        title: 'Jogo do Impostor',
        text: `Entre na minha sala: ${roomCode}`,
        url,
      })
      return 'shared'
    }
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    // The player dismissing the share sheet also lands here; nothing to report.
    return 'failed'
  }
}

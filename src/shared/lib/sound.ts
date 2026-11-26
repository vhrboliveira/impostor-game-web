// Short game sounds, a bonus on top of the visual feedback.
//
// - play() runs synchronously inside the tap handler, or iOS and Chrome block it. A blocked or
//   failed play is ignored.
// - Each file is fetched once and played from a blob URL. Safari does not play media that a
//   service worker answers without range support, and a plain fetch is something the worker can
//   cache. Until a file is loaded, its network URL plays instead.
// - A channel holds one audio element: a new sound on the same channel cuts the one playing.

const loaded = new Map<string, string>() // file URL -> blob URL
const loading = new Set<string>()

/** Starts downloading the files, so the first tap plays them without a delay. */
export function preloadSounds(sources: readonly string[]): void {
  if (typeof fetch !== 'function' || typeof URL.createObjectURL !== 'function') return
  for (const src of sources) {
    if (loaded.has(src) || loading.has(src)) continue
    loading.add(src)
    fetch(src)
      .then((response) =>
        response.ok ? response.blob() : Promise.reject(new Error(`HTTP ${response.status}`)),
      )
      .then((blob) => {
        loaded.set(src, URL.createObjectURL(blob))
      })
      .catch(() => undefined)
      .finally(() => loading.delete(src))
  }
}

interface Channel {
  audio: HTMLAudioElement
  url: string | null
}

const channels = new Map<string, Channel>()

/** Plays a file. Sounds on the same channel replace each other; by default each file has its own. */
export function playSound(src: string, channel: string = src): void {
  if (typeof Audio === 'undefined') return
  let entry = channels.get(channel)
  if (!entry) {
    const audio = new Audio()
    audio.preload = 'auto'
    entry = { audio, url: null }
    channels.set(channel, entry)
  }

  const url = loaded.get(src) ?? src
  try {
    if (entry.url !== url) {
      entry.audio.src = url
      entry.url = url
    }
    entry.audio.currentTime = 0
    void Promise.resolve(entry.audio.play()).catch(() => undefined)
  } catch {
    // Some browsers throw synchronously when playback is not allowed.
  }
  preloadSounds([src])
}

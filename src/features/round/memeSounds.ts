// Every mp3 in src/assets/sounds/memes. Keep each one short (about 5 seconds at most) so it never
// drowns the conversation. The build puts them in assets/memes/, which the service worker caches
// on first use instead of at install time (vite.config.ts).
const files = import.meta.glob<string>('/src/assets/sounds/memes/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
})

export const memeSounds: readonly string[] = Object.values(files)

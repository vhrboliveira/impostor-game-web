// Route matchers of the service worker. Workbox copies each function's source into sw.js, so they
// must not use anything defined outside their own body.

/** The meme sounds of the sound button: same origin, matched on the path only (never the query). */
export function isMemeSound({ url, sameOrigin }: { url: URL; sameOrigin: boolean }): boolean {
  return sameOrigin && /^\/assets\/memes\/[^/]+\.mp3$/.test(url.pathname)
}

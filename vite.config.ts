import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    react(),
    VitePWA({
      // "prompt": the player decides when to reload, so a match is never interrupted.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        // TODO: replace with the final game name.
        name: 'Jogo do Impostor',
        short_name: 'Impostor',
        description: 'Jogo de festa: cada um no seu celular, todo mundo na mesma mesa.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0767b0',
        theme_color: '#0767b0',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Only the app shell is cached. REST and WebSocket traffic always go to the network.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/ws\//],
        // Game sounds are part of the shell, so they also play offline and without a delay...
        globPatterns: ['**/*.{js,css,html,svg,png,mp3}'],
        // ...except the meme sounds of the sound button, cached on first use instead, so they do
        // not weigh on the install.
        globIgnores: ['**/node_modules/**/*', 'assets/memes/**'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/memes\/[^/]+\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'meme-sounds',
              expiration: { maxEntries: 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    rolldownOptions: {
      output: {
        // The meme sounds get a folder of their own, so the service worker can tell them apart.
        assetFileNames: (asset) =>
          asset.originalFileNames.some((name) => name.includes('assets/sounds/memes/'))
            ? 'assets/memes/[name]-[hash][extname]'
            : 'assets/[name]-[hash][extname]',
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8080',
      '/ws': { target: 'ws://localhost:8080', ws: true },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})

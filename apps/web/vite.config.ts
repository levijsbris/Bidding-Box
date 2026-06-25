/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Offline-first single-device app. The PWA service worker caches the app shell so
// the game loads and plays with no network (ARCHITECTURE.md §12).
export default defineConfig({
  // '/' for local dev/preview and custom-domain hosting; the GitHub Pages build
  // sets VITE_BASE=/Bidding-Box/ so asset URLs resolve under the project path.
  base: process.env.VITE_BASE || '/',
  // Dedicated port (default 5173 clashes with other local apps); host:true binds
  // to the LAN so a tablet on the same Wi-Fi can reach it without extra flags.
  server: { port: 5273, host: true, strictPort: true },
  preview: { port: 5273, host: true },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Bridge Table Companion',
        short_name: 'Bridge',
        description: 'Offline table-centre Bridge bidding and scoring aid.',
        theme_color: '#1c4435',
        background_color: '#0d0d0f',
        display: 'fullscreen',
        orientation: 'any',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // The gate covers the pure, unit-tested layer (engine + state). React glue
      // (GameContext) and the IndexedDB repository are exercised by E2E instead.
      include: ['src/domain/**', 'src/state/**'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/fixtures/**',
        'src/**/types.ts',
        'src/state/GameContext.tsx',
        'src/state/repository.ts',
      ],
      thresholds: {
        lines: 95,
        functions: 100,
        branches: 88,
        statements: 95,
        'src/domain/**': {
          lines: 96,
          functions: 100,
          branches: 88,
          statements: 96,
        },
      },
    },
  },
});

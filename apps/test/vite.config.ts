import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

const coreSrc = fileURLToPath(new URL('../../packages/core/src', import.meta.url))
const publicDir = fileURLToPath(new URL('../../public', import.meta.url))
const appearance = fileURLToPath(new URL('../../packages/core/src/appearance', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  publicDir,
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-icon-180.png'],
      manifest: {
        name: 'Lighthouse (Test)',
        short_name: 'Lighthouse Test',
        description: 'Lighthouse 개발/테스트 워크벤치',
        theme_color: '#42b883',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          { src: 'manifest-icon-192.maskable.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'manifest-icon-192.maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'manifest-icon-512.maskable.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'manifest-icon-512.maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        globIgnores: ['**/t3_img/**'],
      },
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        loadPaths: [appearance],
      },
    },
  },
  resolve: {
    alias: {
      '@': coreSrc,
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://api.lighthouse.career',
        changeOrigin: true,
      },
    },
  },
})

import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

const coreSrc = fileURLToPath(new URL('../../packages/core/src', import.meta.url))
const publicDir = fileURLToPath(new URL('../../public', import.meta.url))
const appearance = fileURLToPath(new URL('../../packages/core/src/appearance', import.meta.url))
// .env* 는 모노레포 루트에 있다. envDir 을 안 잡으면 Vite 는 이 앱 디렉터리에서만 찾으므로
// 루트 .env.production 이 무시되고 VITE_API 가 undefined 인 채로 빌드된다.
// CI 는 워크플로우가 VITE_API 를 직접 주입해서 통과할 뿐이라, 로컬 빌드만 조용히 달랐다.
const envDir = fileURLToPath(new URL('../../', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  publicDir,
  envDir,
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
        theme_color: '#ffffff',
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
      // 아직 배포 안 된 API 를 로컬에서 볼 때(2026-10-29): LOCAL_API=http://localhost:8098 LOCAL_API_PATHS=/api/news pnpm dev
      // 지정한 경로만 로컬 API 로, 나머지(로그인·계획 등)는 그대로 운영 API — 로컬 API 는 운영 토큰을 못 읽어서 전부 돌리면 로그아웃된다
      ...Object.fromEntries((process.env.LOCAL_API ? (process.env.LOCAL_API_PATHS ?? '/api/news').split(',') : [])
        .map((p) => [p.trim(), { target: process.env.LOCAL_API, changeOrigin: true }])),
      '/api': {
        target: 'https://api.lighthouse.career',
        changeOrigin: true,
      },
    },
  },
})

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
      // 개발 서버도 manifest 를 내보낸다(2026-11-03). 없으면 iOS '홈 화면에 추가'가 추가할 때 열린 페이지의
      // 폴더를 앱 범위로 잡아서, 그 밖으로 이동하면 '완료' 버튼 달린 브라우저 창으로 열렸다. 운영·스테이징은 원래 scope '/'
      devOptions: { enabled: true, suppressWarnings: true },
      includeAssets: ['favicon.ico', 'apple-icon-180.png'],
      manifest: {
        // 설치 이름(홈 화면 아이콘 아래 글자)은 한글(2026-11-12 사용자 결정) — 랜딩 제목·앱 탭 제목·검색 목표('라이트하우스')와 같은 이름으로.
        // 스테이징(apps/test)은 일부러 영문 'Lighthouse Test' 로 둔다 — 홈 화면에서 운영 앱과 바로 구분되게.
        // 이미 설치한 기기는 다시 설치하기 전까지 예전 이름이 남을 수 있다
        name: '라이트하우스',
        short_name: '라이트하우스',
        description: '라이트하우스 — 나의 진로를 비추는 빛',
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
    // 같은 네트워크의 폰에서 'http://<맥 이름>.local:5173' 으로 열 수 있게(2026-11-03).
    // 아이폰 핫스팟이 IPv6 전용이면 맥 IPv4 가 192.0.0.2(폰에서 못 닿음)라 IP 대신 맥 이름을 쓴다. Vite 는 모르는 호스트 이름을 403 으로 막는다
    allowedHosts: ['.local'],
    proxy: {
      '/api': {
        target: 'https://api.lighthouse.career',
        changeOrigin: true,
      },
    },
  },
})

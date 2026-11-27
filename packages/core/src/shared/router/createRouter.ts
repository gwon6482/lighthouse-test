import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { isChunkLoadError, nextChunkRecovery, resetAppCache, retryChunk } from './chunkReload'
import { applyThemeColor } from './themeColor'
import { installSwUpdate } from './swUpdate'
import { refreshAppDay } from '@/shared/utils/dev-date'

// 화면 파일(lazy 컴포넌트) 불러오기를 감싼다 — 실패하면 같은 화면 안에서 한 번 더(chunkReload.ts retryChunk, 2026-11-17).
// 라우터는 함수인 component 를 lazy 로 다루므로 함수만 감싼다
function withChunkRetry(routes: RouteRecordRaw[]): RouteRecordRaw[] {
  return routes.map((r) => {
    const next = { ...r } as Record<string, unknown>
    if (typeof r.component === 'function') next.component = retryChunk(r.component as () => Promise<unknown>)
    if (r.components) {
      next.components = Object.fromEntries(Object.entries(r.components).map(([k, c]) =>
        [k, typeof c === 'function' ? retryChunk(c as () => Promise<unknown>) : c]))
    }
    if (r.children) next.children = withChunkRetry(r.children)
    return next as unknown as RouteRecordRaw
  })
}

// 공통 라우터 팩토리 — test/app 셸이 각자 라우트 목록을 넘겨 생성한다.
export function makeRouter(routes: RouteRecordRaw[]) {
  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: withChunkRetry(routes),
    scrollBehavior: () => ({ top: 0 }),
  })

  // 홈으로 올 때 '오늘'을 다시 센다 — 앱을 켜 둔 채 하루 시작 시각을 넘겼으면 새 하루로(2026-11-26 #102 정할 것 4)
  router.beforeEach((to) => {
    if (to.path === '/career-achievement') refreshAppDay()
  })

  // 라우트 이동 시 줌 초기화 (iOS 입력 포커스 후 줌 복원)
  router.afterEach((to) => {
    applyThemeColor(to.meta.themeColor) // 상단(노치) 색을 화면 머리 색에 맞춘다 — themeColor.ts
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    resetViewportZoom()
  })

  // 배포 직후 옛 화면이 지워진 청크를 부르면 이동이 멈춘다 → 가려던 주소로 새로 불러온다(자세한 이유는 chunkReload.ts)
  //   곧바로 또 실패하면 앱 캐시(서비스 워커·캐시)를 비우고 한 번 더, 그래도 안 되면 멈춘다(2026-11-17 아이폰 사파리 핫픽스)
  router.onError((err, to) => {
    if (!isChunkLoadError(err)) return
    let store: Storage | null = null
    try { store = window.sessionStorage } catch { /* 막힌 환경 */ }
    const next = store ? nextChunkRecovery(store, to.fullPath, Date.now()) : 'stop'
    if (next === 'reload') window.location.assign(to.fullPath)
    else if (next === 'reset-and-reload') void resetAppCache().finally(() => window.location.assign(to.fullPath))
    else console.warn('[chunk] 새 버전 화면을 불러오지 못했어요', to.fullPath)
  })
  // 새 버전이 넘겨받으면 다음 화면 이동 때 새로 연다 — 입력 중인 화면은 그대로, 로그인·가입 화면 앞에서는 잠깐 기다린다(swUpdate.ts, 2026-11-23 핫픽스).
  //   등록 모듈(virtual:pwa-register)은 따로 불러온다 — 첫 화면 파일을 키우지 않고, 서비스 워커를 못 쓰는 환경에서는 부르지도 않는다
  installSwUpdate(router, (h) => {
    import('./swRegister').then((m) => m.registerAppSw(h)).catch(() => h.onError())
  })

  // ⚠️ 'vite:preloadError' 에서 새로 고치지 말 것 — 라우터보다 먼저 불려서, 아직 바뀌기 전 주소(지금 화면)로 새로 고친다.
  //    거기서 아무것도 안 하면 오류가 그대로 라우터로 와서 위 onError 가 가려던 주소로 처리한다

  return router
}

export function resetViewportZoom() {
  const meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null
  if (!meta) return
  const content = meta.content
  meta.content = content + ', maximum-scale=1.0'
  // rAF는 iOS가 줌 복원 전에 실행됨 → setTimeout으로 충분한 여유를 줌
  setTimeout(() => { meta.content = content }, 300)
}

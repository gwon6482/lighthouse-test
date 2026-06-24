import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// 공통 라우터 팩토리 — test/app 셸이 각자 라우트 목록을 넘겨 생성한다.
export function makeRouter(routes: RouteRecordRaw[]) {
  const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior: () => ({ top: 0 }),
  })

  // 라우트 이동 시 줌 초기화 (iOS 입력 포커스 후 줌 복원)
  router.afterEach(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    resetViewportZoom()
  })

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

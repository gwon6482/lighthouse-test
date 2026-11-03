import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { isChunkLoadError, shouldReloadForChunk } from './chunkReload'

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

  // 배포 직후 옛 화면이 지워진 청크를 부르면 이동이 멈춘다 → 가려던 주소로 새로 불러온다(자세한 이유는 chunkReload.ts)
  router.onError((err, to) => {
    if (isChunkLoadError(err) && shouldReloadForChunk(sessionStorage, to.fullPath, Date.now())) {
      window.location.assign(to.fullPath)
    }
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

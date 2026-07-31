import type { Router } from 'vue-router'

// 안전한 뒤로가기 — 기준 R1.
// 직전 히스토리가 있으면 router.back(), 없으면(딥링크·새로고침·router.replace 진입 등으로
// 뒤로 갈 화면이 없을 때) fallback 경로로 명시 이동한다. 바(bare) router.back()의
// "앱 이탈/엉뚱한 화면" 문제를 방지한다.
export function safeBack(router: Router, fallback: string) {
  if (window.history.state?.back != null) router.back()
  else router.push(fallback)
}

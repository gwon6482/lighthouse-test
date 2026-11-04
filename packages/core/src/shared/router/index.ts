// test 셸 라우터 — 개발/테스트 워크벤치. 모든 모듈을 전부 포함한다.
// '/' 는 app 셸과 같은 진입 분기(entryGuard), 워크벤치 홈은 '/dev'.
import surveyRoutes from '@/modules/survey/survey.routes'
import encyclopediaRoutes from '@/modules/encyclopedia/encyclopedia.routes'
import careerDesignRoutes from '@/modules/career-design/career-design.routes'
import careerAchievementRoutes from '@/modules/career-achievement/career-achievement.routes'
import onboardingRoutes from '@/modules/onboarding/onboarding.routes'
import stubRoutes from './stubRoutes'
import { makeRouter } from './createRouter'
import { installEntryGuard } from './entryGuard'

const router = makeRouter([
  ...onboardingRoutes,
  ...surveyRoutes,
  ...encyclopediaRoutes,
  ...careerDesignRoutes,
  ...careerAchievementRoutes,
  ...stubRoutes,
  // 워크벤치 홈(전체 기능 목록) — '/' 는 실제 앱처럼 온보딩·진로달성으로 보내므로 여기로 옮겼다(2026-11-04)
  { path: '/dev', name: 'Workbench', component: () => import('@/modules/survey/pages/HomePage.vue') },
])

// 진입 분기는 app 셸과 같다 — '/' 로 열면(홈 화면에 추가한 앱 포함) 온보딩 → 로그인 → 진로달성
installEntryGuard(router)

export { resetViewportZoom } from './createRouter'
export default router

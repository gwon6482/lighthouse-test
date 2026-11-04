// app 셸 라우터 — 프로덕션. "완성된 모듈만" 포함한다.
//
// ⭐ 승격 게이트: 어떤 기능을 프로덕션에 노출할지는 "여기서 해당 모듈 라우트를
//    import 하느냐"로 결정된다. 미완성 모듈은 아래에서 빼면 app 번들에 코드 자체가
//    들어가지 않는다(트리셰이킹). 완성되면 한 줄 추가 → 다음 배포에 반영.
//
// 현 정책(2026-06-24 확정): v1 은 전체 모듈 노출(=test 와 동일 구성). 진입 가드/로그인
//   뒤라 무방. 특정 모듈만 프로덕션에서 제외하려면 그 모듈 import 를 여기서 빼면 된다.
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
])

// 진입 분기('/' → 온보딩·로그인·진로달성, 인증 경계) — test 셸과 같이 쓴다(entryGuard.ts)
installEntryGuard(router)

export { resetViewportZoom } from './createRouter'
export default router

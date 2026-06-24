// app 셸 라우터 — 프로덕션. "완성된 모듈만" 포함한다.
//
// ⭐ 승격 게이트: 어떤 기능을 프로덕션에 노출할지는 "여기서 해당 모듈 라우트를
//    import 하느냐"로 결정된다. 미완성 모듈은 아래에서 빼면 app 번들에 코드 자체가
//    들어가지 않는다(트리셰이킹). 완성되면 한 줄 추가 → 다음 배포에 반영.
//
// TODO(승격 목록 확정): 현재는 전체 포함(스캐폴드). 완성 검증된 모듈만 남기고 정리할 것.
import surveyRoutes from '@/modules/survey/survey.routes'
import encyclopediaRoutes from '@/modules/encyclopedia/encyclopedia.routes'
import careerDesignRoutes from '@/modules/career-design/career-design.routes'
import careerAchievementRoutes from '@/modules/career-achievement/career-achievement.routes'
import onboardingRoutes from '@/modules/onboarding/onboarding.routes'
import stubRoutes from './stubRoutes'
import { makeRouter } from './createRouter'
import { useAuthStore } from '@/shared/stores/auth'
import { useAchievementStore } from '@/shared/stores/achievement'

const router = makeRouter([
  ...onboardingRoutes,
  ...surveyRoutes,
  ...encyclopediaRoutes,
  ...careerDesignRoutes,
  ...careerAchievementRoutes,
  ...stubRoutes,
])

// ── 프로덕션 진입 분기 (test 셸에는 없음) ──
// 루트('/') 진입 시 인증·진로계획 상태로 보낸다.
//   1) 최초/로그아웃(토큰 없음)        → /onboarding (온보딩 애니메이션 → 로그인)
//   2) 자동로그인 + 진로계획 전(plan 無) → /main/before
//   3) 자동로그인 + 진로계획 후(plan 有) → /main
router.beforeEach(async (to) => {
  if (to.path !== '/') return true

  const auth = useAuthStore()
  // 토큰 없음 = 한 번도 로그인 안 함(또는 로그아웃) → 온보딩
  if (!auth.token) return '/onboarding'

  // 브라우저에 저장된 토큰으로 자동로그인 검증 (실패 시 fetchMe 내부에서 logout)
  if (!auth.user) await auth.fetchMe()
  if (!auth.isLoggedIn) return '/onboarding'

  // 진로계획 보유 여부로 메인 분기
  const achievement = useAchievementStore()
  await achievement.loadActivePlan()
  return achievement.hasActivePlan ? '/main' : '/main/before'
})

export { resetViewportZoom } from './createRouter'
export default router

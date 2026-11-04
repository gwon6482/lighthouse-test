import type { Router } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import { useAchievementStore } from '@/shared/stores/achievement'
import { authBoundaryAction, needsLogin } from './authBoundary'

// 진입 분기 — app·test 두 셸이 같이 쓴다(2026-11-04: test 셸도 '/' 가 온보딩부터 — 홈 화면에 추가한 테스트 앱이 실제 앱처럼 열리게).
// 워크벤치(전체 기능 목록) 홈은 test 셸의 '/dev'.
// 루트('/') 진입 시 인증·진로계획 상태로 보낸다.
//   1) 최초/로그아웃(토큰 없음)        → /onboarding (온보딩 애니메이션 → 로그인)
//   2) 자동로그인 + 진로계획 전(plan 無) → /main/before
//   3) 자동로그인 + 진로계획 후(plan 有) → /career-achievement (설계 후 메인 = 진로달성)
export function installEntryGuard(router: Router) {
  router.beforeEach(async (to) => {
    const auth = useAuthStore()

    // R5(인증 경계). 판정은 authBoundary.ts 의 순수 함수에 있다(왜 바뀌었는지도 거기 적혀 있다).
    //   bounce         → 로그아웃하지 않고 앱 안('/')으로 되돌린다. 아래 루트 가드가
    //                    상태에 맞는 자리로 보내므로, 위저드를 안 끝낸 소셜 계정은 위저드로 복귀한다.
    //   confirm-logout → 의도적 이탈(위저드 첫 화면의 '이전' 이 ?logout=1 을 달아 준다)
    if (to.path === '/onboarding/auth') {
      const action = authBoundaryAction(!!auth.token, to.query.logout === '1')
      if (action === 'bounce') return '/'
      if (action === 'confirm-logout') {
        if (!confirm('로그인 화면으로 돌아가면 로그아웃돼요.\n정말 로그아웃하시겠어요?')) return false
        auth.logout()
        return true
      }
    }

    // 로그인 전용 경로에 토큰 없이 직접 들어오면 로그인으로(자세한 이유는 authBoundary.ts)
    if (needsLogin(to.path, !!auth.token)) return '/onboarding'

    if (to.path !== '/') return true

    // 토큰 없음 = 한 번도 로그인 안 함(또는 로그아웃) → 온보딩
    if (!auth.token) return '/onboarding'

    // 브라우저에 저장된 토큰으로 자동로그인 검증 (토큰이 틀렸으면 fetchMe 내부에서 logout)
    if (!auth.user) {
      const r = await auth.fetchMe()
      if (r === 'invalid' || !auth.isLoggedIn) return '/onboarding'
      // 연결이 안 될 때 — 로그아웃시키지 않고 진로달성 홈으로(홈이 다시 불러온다). 계획 유무를 알 수 없어 홈으로 간다
      if (r === 'offline') return '/career-achievement'
    }

    // 소셜 가입 위저드를 끝내지 않고 이탈한 계정은 다시 위저드로 보낸다.
    // ⚠️ 이게 없으면 위저드 중간에 앱을 닫은 카카오 가입자가 다음 진입 때 루트 가드를 타고
    //    곧장 메인으로 가서 이름·나이·성별·진로답변이 영영 빈 채로 남는다.
    // ⚠️ 판정은 **소셜 항목이 있는가**로 한다. "local 이 없으면 소셜"로 뒤집어 쓰면
    //    authProviders 가 비어 있는 옛 계정(기본값 [])까지 소셜로 잡혀 위저드에 갇힌다.
    //    2026-09-09 이전 이메일 가입자는 onboarding 이 없으므로 실제로 당한다.
    const providers = auth.user?.authProviders ?? []
    const socialOnly = providers.some((p) => p.provider !== 'local')
      && !providers.some((p) => p.provider === 'local')
    if (socialOnly && !auth.user?.onboarding?.answeredAt) {
      return { path: '/onboarding/signup', query: { social: '1' } }
    }

    // 진로계획 보유 여부로 메인 분기
    const achievement = useAchievementStore()
    try { await achievement.loadActivePlan() } catch { return '/career-achievement' } // 연결 실패 — 위와 같은 이유
    return achievement.hasActivePlan ? '/career-achievement' : '/main/before'
  })
}

// R5(인증 경계) 판정 — 로그인 상태로 로그인 페이지(`/onboarding/auth`)에 닿았을 때 무엇을 할지.
//
// 라우터 가드 안에 인라인으로 두면 브라우저 없이는 검증할 수 없어서 순수 함수로 뺐다.
// 실제 분기는 `app.ts` 의 beforeEach 가 이 결과를 그대로 따른다.
//
// ⚠️ 2026-09-17 변경: 예전에는 토큰만 있으면 **무조건** 로그아웃을 물었다.
//    R5 를 세운 2026-07-22 에는 로그인 화면으로 되돌아가는 길이 '사용자가 의도적으로
//    뒤로 간 경우'뿐이었기 때문이다. 카카오 로그인이 그 전제를 깼다 —
//
//      /onboarding/auth → (카카오) → /onboarding/oauth → 위저드 → /onboarding/intro
//
//    이 흐름에서 로그인 화면이 히스토리 바로 뒤에 남아, 가입 직후 브라우저 뒤로가기
//    한 번이 곧장 로그아웃으로 이어졌다(2026-09-17 실제 발생).
export type AuthBoundaryAction =
  | 'pass'            // 토큰 없음 = 정상적인 로그인 화면 진입
  | 'bounce'          // 로그인 상태인데 뒤로가기 등으로 닿음 → 앱 안('/')으로 되돌린다
  | 'confirm-logout'  // 의도적 이탈(?logout=1) → 확인 후 로그아웃

export function authBoundaryAction(hasToken: boolean, wantsLogout: boolean): AuthBoundaryAction {
  if (!hasToken) return 'pass'
  // 의도 표시가 없으면 뒤로가기로 본다. 로그아웃은 되돌릴 수 없으므로
  // **표시가 있을 때만** 하는 쪽이 안전하다(잘못 bounce 해도 사용자는 앱에 남을 뿐이다).
  return wantsLogout ? 'confirm-logout' : 'bounce'
}

// 로그인해야 들어갈 수 있는 경로 — 토큰 없이 주소를 직접 쳐서 들어오면 온보딩(로그인)으로 보낸다.
// 루트 가드('/')만으로는 `app.lighthouse.career/self-understanding` 같은 직접 진입을 막지 못했다(2026-11-02).
//
// 지금은 자기이해 검사만 막는다(사용자 결정 2026-11-02). 앱 화면 흐름에서 검사 입구는 전부 로그인 뒤에 있다.
// ⚠️ 나중에 '검사 → 회원가입' 흐름(비로그인으로 검사 후 가입 유도)을 열 때는 여기서 그 경로를 빼면 된다.
//    결과 화면의 비로그인 가입 유도(SelfUnderstandingResultPage 의 SignUpModal)는 그때를 위해 남겨 뒀다.
const LOGIN_REQUIRED_PREFIXES = ['/self-understanding']

export function needsLogin(path: string, hasToken: boolean): boolean {
  if (hasToken) return false
  return LOGIN_REQUIRED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))
}

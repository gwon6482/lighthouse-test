// 로그인 뒤 돌아갈 곳(2026-11-18) — 진로백과 '분류로 찾기'의 '가입하고 연봉 보기'가 ?next= 로 넘긴다.
// 이 탭에만 둔다(sessionStorage): 소셜 로그인은 제공자 화면을 거쳐 OAuthReturnPage 로 돌아오기 때문이다.
// 기존 회원이 로그인하면 여기로 돌아오고, 새로 가입하는 사람은 지금처럼 가입·온보딩 흐름을 탄다(돌아갈 곳은 지운다).
const KEY = 'lh_after_login'

/** 앱 안의 경로만 받는다 — 바깥 주소('//', 'http')·온보딩(되돌이)·너무 긴 것은 버린다 */
export function safeNext(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const s = raw.trim()
  if (!s.startsWith('/') || s.startsWith('//') || s.startsWith('/\\') || s.startsWith('/onboarding') || s.length > 500) return null
  return s
}

/** 로그인 화면에서 — ?next= 를 기억한다. 받은 값(안전한 것만)을 돌려준다 */
export function rememberAfterLogin(raw: unknown): string | null {
  const next = safeNext(raw)
  try {
    if (next) sessionStorage.setItem(KEY, next)
  } catch { /* 저장이 막혀도 이메일 로그인은 화면이 가진 값으로 돌아간다 */ }
  return next
}

/** 로그인을 마친 곳에서 — 꺼내고 지운다 */
export function takeAfterLogin(): string | null {
  try {
    const v = sessionStorage.getItem(KEY)
    sessionStorage.removeItem(KEY)
    return safeNext(v)
  } catch {
    return null
  }
}

/** 새로 가입하는 길로 갈 때 — 남겨 두면 나중 로그인에서 엉뚱하게 돌아간다 */
export function dropAfterLogin() {
  try { sessionStorage.removeItem(KEY) } catch { /* 없음 */ }
}

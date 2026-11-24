// 계정에 딸린 임시 보관 비우기(2026-11-24 검토 1번).
//
// 왜: 로그아웃·탈퇴는 새로고침 없이 화면만 옮긴다. 그래서 같은 탭에서 다른 계정으로 로그인하면
//   - 이 탭에 둔 검사 id(sessionStorage 'lh_survey_id')와
//   - 모듈 메모리에 담아 둔 추천 직무·목표·검사 목록이
//   앞 사람의 것으로 남아, 진로백과 '나의 추천 진로' 카드·직업 상세 배지에 앞 사람의 직무가 보였다.
//
// 하는 일: 계정이 바뀌는 모든 자리(auth 스토어의 login · setAuth · applyToken · logout — 탈퇴·토큰 거절도 logout 을 거친다)에서
//   clearAccountScope() 를 부른다. 기능 모듈은 onAccountChange() 로 자기 보관을 비우는 함수를 건다.
//   토큰 연장(fetchMe 의 같은 계정 새 토큰)은 계정이 바뀐 것이 아니라 부르지 않는다.
//
// ⚠️ 비회원 검사 → 가입으로 잇는 열람 키(localStorage 'lh_guest_survey', shared/guest/guestSurvey)는 지우지 않는다.
//    가입·로그인 직후 linkPendingGuestSurvey() 가 그 키로 방금 한 검사를 새 계정에 잇는다(setAuth 뒤에 불린다).
export const SURVEY_ID_KEY = 'lh_survey_id'
// 쓰다 만 자기이해 검사의 기기 저장본(modules/survey/composables/useSurvey) — 계정이 바뀌면 지운다(2026-11-25).
// 검사 모듈을 아직 안 불러온 때(앱을 막 열고 바로 로그아웃·로그인)에도 지워야 해서 여기서 지운다. 메모리는 검사 모듈이 onAccountChange 로 비운다
export const SURVEY_PROGRESS_KEYS = ['lh_survey_progress_v1', 'lh_survey_form_v1'] as const

const listeners = new Set<() => void>()

// 계정 세대 — 계정이 바뀔 때마다 1씩 는다. 담아 두는 열쇠에 넣으면(`${accountGeneration()}:${surveyId}`)
// 앞 계정 때 담은 것을 다음 계정이 꺼내 쓸 수 없고, 받는 사이 계정이 바뀐 응답도 가려낼 수 있다.
// uid 대신 쓰는 까닭: 앱을 막 열면 uid 를 아직 모르고(fetchMe 전), 토큰은 같은 계정에서도 연장되면 바뀐다
let generation = 0
export const accountGeneration = () => generation

/** 계정이 바뀔 때 비울 것을 건다. 돌려준 함수로 뗀다 */
export function onAccountChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function clearAccountScope() {
  generation += 1
  try { sessionStorage.removeItem(SURVEY_ID_KEY) } catch { /* 저장소를 못 쓰면 남은 것도 없다 */ }
  try { for (const k of SURVEY_PROGRESS_KEYS) localStorage.removeItem(k) } catch { /* 위와 같다 */ }
  for (const fn of listeners) {
    try { fn() } catch { /* 하나가 실패해도 나머지는 비운다 */ }
  }
}

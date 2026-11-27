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
//   2026-11-27: 검사뿐 아니라 진로설계 편집 사본·달성 기록 사본·멈춘 집중 등 계정에 딸린 기기 사본도 여기서 지운다(ACCOUNT_LOCAL_KEYS).
//   401·404 로 풀리는 길(fetchMe → logout)도 logout 을 거치므로 같이 비워진다.
//
// ⚠️ 비회원 검사 → 가입으로 잇는 열람 키(localStorage 'lh_guest_survey', shared/guest/guestSurvey)는 지우지 않는다.
//    가입·로그인 직후 linkPendingGuestSurvey() 가 그 키로 방금 한 검사를 새 계정에 잇는다(setAuth 뒤에 불린다).
export const SURVEY_ID_KEY = 'lh_survey_id'
// 쓰다 만 자기이해 검사의 기기 저장본(modules/survey/composables/useSurvey) — 계정이 바뀌면 지운다(2026-11-25).
// 검사 모듈을 아직 안 불러온 때(앱을 막 열고 바로 로그아웃·로그인)에도 지워야 해서 여기서 지운다. 메모리는 검사 모듈이 onAccountChange 로 비운다
export const SURVEY_PROGRESS_KEYS = ['lh_survey_progress_v1', 'lh_survey_form_v1'] as const

// 계정에 딸린 기기 사본(2026-11-27 오너 결정 '기기에 남는 사본 — 계정이 바뀌거나 로그아웃될 때 비운다').
// 모듈을 아직 안 불러온 때에도 지워야 해서 열쇠 이름을 여기 적는다(모듈을 import 하면 고리가 생긴다).
// 각 모듈의 상수와 같은지는 시험(shared/auth/__tests__/accountScope.spec.ts)이 본다. 메모리는 각 모듈이 onAccountChange 로 비운다
export const ACCOUNT_LOCAL_KEYS = [
  'lh_cd_draft',               // 진로설계 편집 사본(계획 이름·목표·프로젝트·메모·planId) — career-design/useCareerDesign
  'lh_achievement_v1',         // 완료 표시 — career-achievement/useAchievement
  'lh_achievement_entries_v1', // 실천 기록(메모·사진 주소) — useAchievementEntries
  'lh_curriculum_items_v1',    // 커리큘럼 완료 — useCurriculumCompletion
  'lh_focus_sessions_v1',      // 멈춘 집중 — lib/focusSession
  'lh_routine_end_asked',      // 끝난 루틴을 물었는지(루틴 id) — usePlanBoard
  'lh_ahead_pending_v1',       // 미리 하기 옮기기 실패분 — lib/pullAhead
] as const
// 이 탭에만 둔 것 — 홈에서 새 프로젝트 시작하기 흐름(planId) — career-achievement/useAddProject
export const ACCOUNT_SESSION_KEYS = ['lh_add_project_v1'] as const
// 더는 쓰지 않는 사본 — 보이면 지운다(앱을 열 때 한 번 + 계정이 바뀔 때). 가입 답 Q1~Q3 의 정본은 서버(User.onboarding)
export const RETIRED_LOCAL_KEYS = ['lh_onboarding_v1'] as const

function removeKeys(storage: () => Storage, keys: readonly string[]) {
  try {
    const s = storage()
    for (const k of keys) s.removeItem(k)
  } catch { /* 저장소를 못 쓰면 남은 것도 없다 */ }
}

/** 계정에 딸린 기기 사본만 지운다(메모리·검사 진행은 그대로). 로그인 표 없이 앱을 열 때 주인 없는 사본을 치울 때 쓴다 */
export function clearAccountDeviceKeys() {
  removeKeys(() => localStorage, [...ACCOUNT_LOCAL_KEYS, ...RETIRED_LOCAL_KEYS])
  removeKeys(() => sessionStorage, ACCOUNT_SESSION_KEYS)
}

// 앱을 열 때 한 번 — 쓰지 않는 사본 지우기
removeKeys(() => localStorage, RETIRED_LOCAL_KEYS)

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
  clearAccountDeviceKeys()
  for (const fn of listeners) {
    try { fn() } catch { /* 하나가 실패해도 나머지는 비운다 */ }
  }
}

// 내 최근 검사 찾기 — '나의 추천 진로' 카드·직업 상세 배지·추천 목록·분류로 찾기 '내 검사 결과로 찾기'가 함께 쓴다(2026-11-24).
// 예전에는 같은 함수가 세 곳(useEncyclopedia · useJobBrowse · EncyclopediaRecommendedPage)에 복제돼 있었다.
// 순서는 그대로다: 이 탭에 둔 검사 id(sessionStorage 'lh_survey_id' — 검사를 마친 탭) → 내 검사 목록에서 제출이 가장 늦은 것.
import { req } from '@/shared/api'

export const SURVEY_ID_KEY = 'lh_survey_id'

export interface SurveyListItem { survey_id: string; submitted_at: string }

/** 검사 목록에서 제출이 가장 늦은 검사 id. 없으면 '' */
export function pickLatestSurveyId(list: SurveyListItem[] | null | undefined): string {
  let best: SurveyListItem | null = null
  let bestAt = -Infinity
  for (const s of list ?? []) {
    const at = new Date(s.submitted_at).getTime()
    if (!s?.survey_id || Number.isNaN(at)) continue
    if (at > bestAt) { best = s; bestAt = at }
  }
  return best?.survey_id ?? ''
}

function cachedId(): string {
  try { return sessionStorage.getItem(SURVEY_ID_KEY) ?? '' } catch { return '' }
}

// 같은 화면에서 여러 곳이 동시에 물어도 목록은 한 번만 받는다(받는 중인 약속을 나눠 쓴다. 끝나면 비운다 — 다시 검사하면 바뀌므로)
let inflight: Promise<string> | null = null

/**
 * 내 최근 검사 id. 검사가 없으면 ''. 목록을 못 받으면 던진다(부르는 쪽이 '없음'과 '못 받음'을 가른다).
 * 로그인하지 않았으면 부르지 말 것(서버가 401).
 */
export function resolveLatestSurveyId(): Promise<string> {
  const id = cachedId()
  if (id) return Promise.resolve(id)
  if (!inflight) {
    inflight = req
      .get<{ success: boolean; surveyResults: SurveyListItem[] }>('/api/user/survey-results')
      .then(({ data }) => (data.success ? pickLatestSurveyId(data.surveyResults) : ''))
      .finally(() => { inflight = null })
  }
  return inflight
}

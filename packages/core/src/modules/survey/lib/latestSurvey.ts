// 내 최근 검사 찾기 — '나의 추천 진로' 카드·직업 상세 배지·추천 목록·분류로 찾기 '내 검사 결과로 찾기'가 함께 쓴다(2026-11-24).
// 예전에는 같은 함수가 세 곳(useEncyclopedia · useJobBrowse · EncyclopediaRecommendedPage)에 복제돼 있었다.
//
// 고르는 법(검토 1번, 2026-11-24): **내 검사 목록에 있는 검사만** 쓴다.
//   - 이 탭에 둔 검사 id(sessionStorage 'lh_survey_id' — 검사를 마친 탭)가 내 목록에 있으면 그것.
//   - 없으면 목록에서 제출이 가장 늦은 것. 예전에는 탭에 둔 id 를 그대로 믿어, 같은 탭에서 계정을 바꾸면 앞 사람의 검사를 썼다.
//   - 방금 낸 검사는 제출 직후 계정에 잇는 요청(linkSurveyToUser)이 끝나야 목록에 들어온다. 담아 둔 목록에 없으면 한 번 새로 받아 본다.
//     그래도 없으면(잇기 실패 — 결과지를 열면 다시 잇는다) 목록의 최신을 쓴다.
// 목록은 계정별로 잠깐(LIST_TTL_MS) 담아 둔다 — 직업 상세를 열 때마다 다시 부르지 않게. 계정이 바뀌면 비운다(shared/auth/accountScope).
import { req } from '@/shared/api'
import { SURVEY_ID_KEY, accountGeneration, onAccountChange } from '@/shared/auth/accountScope'

export { SURVEY_ID_KEY }

export interface SurveyListItem { survey_id: string; submitted_at: string }

/** 검사 목록에서 제출이 가장 늦은 검사 id. 없으면 '' */
export function pickLatestSurveyId(list: SurveyListItem[] | null | undefined): string {
  let best: SurveyListItem | null = null
  let bestAt = -Infinity
  for (const s of list ?? []) {
    const at = new Date(s?.submitted_at).getTime()
    if (!s?.survey_id || Number.isNaN(at)) continue
    if (at > bestAt) { best = s; bestAt = at }
  }
  return best?.survey_id ?? ''
}

/** 탭에 둔 id 가 내 목록에 있으면 그것, 아니면 목록의 최신 */
export function chooseSurveyId(tabId: string | null | undefined, list: SurveyListItem[] | null | undefined): string {
  if (tabId && (list ?? []).some((s) => s?.survey_id === tabId)) return tabId
  return pickLatestSurveyId(list)
}

export const LIST_TTL_MS = 60_000

let cache: { gen: number; at: number; list: Promise<SurveyListItem[]> } | null = null
onAccountChange(() => { cache = null })

function tabId(): string {
  try { return sessionStorage.getItem(SURVEY_ID_KEY) ?? '' } catch { return '' }
}

function fetchList(): Promise<SurveyListItem[]> {
  return req
    .get<{ success: boolean; surveyResults: SurveyListItem[] }>('/api/user/survey-results')
    .then(({ data }) => (data.success ? data.surveyResults ?? [] : []))
}

function cached(gen: number) {
  return !!cache && cache.gen === gen && Date.now() - cache.at < LIST_TTL_MS
}

function listFor(gen: number, fresh: boolean): Promise<SurveyListItem[]> {
  if (!fresh && cached(gen)) return cache!.list
  const entry = { gen, at: Date.now(), list: fetchList() }
  cache = entry
  // 실패는 담아 두지 않는다 — 다음에 다시 부른다
  entry.list.catch(() => { if (cache === entry) cache = null })
  return entry.list
}

/**
 * 내 최근 검사 id. 검사가 없으면 ''. 목록을 못 받으면 던진다(부르는 쪽이 '없음'과 '못 받음'을 가른다).
 * 로그인하지 않았으면 부르지 말 것(서버가 401).
 */
export async function resolveLatestSurveyId(): Promise<string> {
  const gen = accountGeneration()
  const id = tabId()
  const fromCache = cached(gen)
  let list = await listFor(gen, false)
  // 탭에 둔 검사가 담아 둔 목록에 없다 — 방금 낸 검사일 수 있어 한 번 새로 받는다
  if (fromCache && id && !list.some((s) => s?.survey_id === id)) list = await listFor(gen, true)
  if (accountGeneration() !== gen) return '' // 받는 사이 계정이 바뀌었다 — 앞 계정의 목록을 쓰지 않는다
  return chooseSurveyId(id, list)
}

/**
 * 내 목록에서 이 검사의 제출 시각(ISO). 없거나 못 받으면 ''.
 * '나의 추천 진로' 화면 머리의 검사 날짜(2026-11-26) — 방금 resolveLatestSurveyId 가 받아 둔 목록을 다시 쓴다.
 */
export async function surveySubmittedAt(surveyId: string): Promise<string> {
  if (!surveyId) return ''
  const gen = accountGeneration()
  try {
    const list = await listFor(gen, false)
    if (accountGeneration() !== gen) return ''
    return list.find((s) => s?.survey_id === surveyId)?.submitted_at ?? ''
  } catch {
    return ''
  }
}

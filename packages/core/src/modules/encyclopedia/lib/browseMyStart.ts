// '내 검사 결과로 찾기'(2026-11-17 오너 결정 10) — 검사 결과에서 관심 분야·재능 두 칸을 채운다.
// 점수·순위나 '추천'이라는 말은 붙이지 않는다. 결과는 출발점이고, 칩은 지울 수 있다.
import type { SurveyAnalysisResponse } from '@/modules/survey/types/survey'
import { emptyState, type BrowseState } from './browseQuery'

type Analysis = SurveyAnalysisResponse['analysis']

export interface MyBrowseStart {
  state: BrowseState
  /** 홈 띠에 그대로 보일 이름 — 실제로 채우는 관심 분야들과 재능(사용성 확인: 채우는 것을 그대로 보여 준다) */
  labels: string[]
  talentCode: string | null
}

/** 분류로 찾기에 없는 재능 — 자기성찰(N)은 직업 자료로 가를 수 없어 뺐다. 1위가 그것이면 다음 것을 쓴다 */
const SKIP_TALENT = new Set(['N'])

/**
 * - 관심 분야 '1위' = 고른 분야가 가장 많은 묶음(결과지 '나는 ○○에서…'와 같은 기준). 그 묶음에서 고른 분야들을 채운다
 * - 재능 = 점수 순 첫째(자기성찰이면 둘째)
 */
export function myBrowseStart(a: Analysis | null | undefined): MyBrowseStart | null {
  if (!a) return null
  const state = emptyState()
  const labels: string[] = []
  const cats = Object.values(a.interest?.by_category ?? {})
  if (cats.length) {
    const top = cats.reduce((x, y) => (x.items.length >= y.items.length ? x : y))
    const items = top.items.filter((it) => it.field_id)
    if (items.length) {
      state.interest = items.map((it) => it.field_id)
      labels.push(...items.map((it) => it.name))
    }
  }
  const talents = [...(a.talent?.all ?? a.talent?.top3 ?? [])]
    .filter((t) => t.score != null)
    .sort((x, y) => (y.score ?? 0) - (x.score ?? 0))
  const t = talents.find((x) => !SKIP_TALENT.has(x.code))
  const talentCode = t?.code ?? null
  if (t && talentCode) {
    state.talent = [talentCode]
    labels.push(t.name || talentCode)
  }
  if (!state.interest.length && !state.talent.length) return null
  return { state, labels, talentCode }
}

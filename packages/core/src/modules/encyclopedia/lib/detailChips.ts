// 직업 상세 개요 탭 '개인요소·업무요소' 칩(2026-11-27).
// 고용24 자료가 빈 영역은 항목이 다 오되 값이 전부 0이다(2026-11-17 기준 34개 직업 — 지식·업무환경·성격·흥미·업무활동).
// 예전엔 점수 순 앞 3개를 그대로 그려서, 값 0인 항목('경영 및 행정' 등)이 '이 직업에서 특히 중요해요'로 보였다.
// 규칙: 값이 0 이하(또는 없음)인 항목은 칩으로 그리지 않는다. 남는 항목이 없으면 그 칸은 '자료 없음'.
import type { RankItem } from '../types/encyclopedia'

export const DETAIL_TOP_N = 3

/** 값이 있는 항목만, 점수 높은 순으로 앞 n개 */
export function topRankItems(items: RankItem[] | null | undefined, n = DETAIL_TOP_N): RankItem[] {
  return (items ?? [])
    .filter((i) => typeof i?.score === 'number' && i.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
}

// 직무 추천의 이유 한 문장 — "특히 A(영역)와 B(영역)이 잘 맞아요"(2026-11-09 결과지).
// 결과지(SurveyResultBody)와 진로백과 메인의 '나의 추천 진로' 카드(2026-11-24)가 **같은 함수**를 쓴다 —
// 두 화면의 글이 글자까지 같아야 해서 한 곳에 둔다. 결과지 정본(랜딩 ResearchResult.vue)의 문장과도 같다.
import type { JobGroupReason } from '../types/survey'

// 이유 항목의 영역 — 결과지에서 그 이름이 나온 구역(성격 분포 · 재능 Top 3 · 관심 분야 · 나의 가치관)
export const REASON_AXIS: Record<JobGroupReason['axis'], string> = { T1: '성격', T21: '재능', T22: '관심', T23: '가치관' }

// 조사 — 받침이 있으면 앞 것(과·이). 한글이 아니면 둘 다
export const josa = (w: string, batchim: string, none: string) => {
  const c = w.trim().slice(-1).charCodeAt(0) - 0xac00
  return c < 0 || c > 11171 ? `${batchim}(${none})` : c % 28 ? batchim : none
}

export interface WhyPart { text?: string; kw?: JobGroupReason }

// "특히 A와 B가 잘 맞아요" — 핵심어만 굵은 색 글씨. 칩 상자를 씌우면 조사가 떨어져 보였다(시안 때 실제로 그랬다)
// '잘 맞아요'는 줄바꿈 없는 공백으로 붙인다 — 영역 괄호가 붙어 길어지자 '잘 / 맞아요'로 끊겼다
export function whyParts(g: { reasons: JobGroupReason[] }): WhyPart[] {
  const [a, b] = g.reasons
  if (!a) return []
  return b
    ? [{ text: '특히 ' }, { kw: a }, { text: `${josa(a.name, '과', '와')} ` }, { kw: b }, { text: `${josa(b.name, '이', '가')} 잘 맞아요` }]
    : [{ text: '특히 ' }, { kw: a }, { text: `${josa(a.name, '이', '가')} 잘 맞아요` }]
}

/** 화면 읽기·시험용 — 조각을 이어 보이는 그대로의 문장으로(영역은 괄호) */
export function whyText(g: { reasons: JobGroupReason[] }): string {
  return whyParts(g).map((p) => (p.kw ? `${p.kw.name}(${REASON_AXIS[p.kw.axis]})` : p.text)).join('')
}

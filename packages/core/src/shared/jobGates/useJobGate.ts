// 직업 → 진입 관문. 관문이 없는(자유 진입) 직업은 undefined — 화면에 아무것도 표시하지 않는다(2026-10-27, 사용자 결정 대기)
import { JOB_GATES, GATE_CHECKED_AT } from './jobGates.data'
import { CONDITION_LABELS, sortGateBadges, type JobGate } from './gateBadges'

export { GATE_CHECKED_AT }
export const gateOf = (jobCode?: string | null): JobGate | undefined => (jobCode ? JOB_GATES[jobCode] : undefined)

/** 조건을 사람이 읽는 줄로: ['관련 학과 졸업', '면허·자격 시험 합격', …] */
export function gateConditionLines(g: JobGate): string[] {
  const c = g.conditions
  const lines: string[] = [CONDITION_LABELS.education[c.education], CONDITION_LABELS.training[c.training], CONDITION_LABELS.exam[c.exam]]
  if (c.experience) lines.push('실무 경력')
  for (const o of c.other) lines.push(CONDITION_LABELS.other[o])
  if (c.entry === 'senior') lines.push('경력·승진으로 진입')
  return lines.filter(Boolean)
}

export const gateBadgesOf = (jobCode?: string | null) => sortGateBadges(gateOf(jobCode)?.badges ?? [])

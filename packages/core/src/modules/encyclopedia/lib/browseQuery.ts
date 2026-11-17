// 진로백과 '분류로 찾기'(2026-11-17) — 고른 조건 ↔ 주소(query) 와 조건 수. 판정 규칙은 서버에만 있다(이 레포는 공개).
// 고른 조건은 주소에 담는다 — 뒤로 가기(안드로이드 뒤로 버튼 R4 포함)·공유가 되고, 계정에는 저장하지 않는다.
import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import type { BrowseAxisKey } from '../types/browse'

/** 입구·탭 순서(진로상담 권장 — 쓸모가 넓은 것부터, 연봉은 맨 끝) */
export const BROWSE_AXES: BrowseAxisKey[] = ['group', 'interest', 'env', 'talent', 'value', 'salary']
/** 조건은 3개까지(오너 결정 2) — 넷째부터는 대부분 0~2개만 남는다 */
export const MAX_CONDITIONS = 3

export type BrowseState = Record<BrowseAxisKey, string[]>

export const emptyState = (): BrowseState => ({ group: [], interest: [], env: [], talent: [], value: [], salary: [] })
export const cloneState = (s: BrowseState): BrowseState =>
  Object.fromEntries(BROWSE_AXES.map((k) => [k, [...s[k]]])) as BrowseState

const split = (v: unknown): string[] =>
  (Array.isArray(v) ? v : [v]).flatMap((x) => String(x ?? '').split(',')).map((x) => x.trim()).filter(Boolean)

export function stateFromQuery(q: LocationQuery): BrowseState {
  const s = emptyState()
  for (const k of BROWSE_AXES) s[k] = [...new Set(split(q[k]))]
  return s
}

/** 주소·API 둘 다 같은 꼴 — 축마다 쉼표로 이은 코드 */
export function paramsFromState(s: BrowseState): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k of BROWSE_AXES) if (s[k].length) out[k] = s[k].join(',')
  return out
}
export const queryFromState = (s: BrowseState, extra: Record<string, string> = {}): LocationQueryRaw => ({ ...paramsFromState(s), ...extra })

/** 조건 수 — 분류 하나가 조건 하나(한 분류 안에서 여럿 고르면 '또는'), 업무 환경만 보기 하나가 조건 하나 */
export function conditionCount(s: BrowseState): number {
  return BROWSE_AXES.reduce((n, k) => n + (k === 'env' ? s.env.length : s[k].length ? 1 : 0), 0)
}
export const isEmptyState = (s: BrowseState) => conditionCount(s) === 0
export const canAddCondition = (s: BrowseState) => conditionCount(s) < MAX_CONDITIONS

/** 이 분류를 지금 상태에 더(바꿔) 넣을 수 있나 — 이미 쓰는 분류면 고치기라 늘 된다 */
export function canUseAxis(s: BrowseState, axis: BrowseAxisKey): boolean {
  if (axis === 'env') return true   // 업무 환경은 보기 하나하나가 조건이라 고르기 화면에서 막는다
  return s[axis].length > 0 || canAddCondition(s)
}

/** 조건 하나 빼기 — id 는 서버 applied.conditions[].id(group·interest·talent·value·salary·env:<코드>) */
export function withoutCondition(s: BrowseState, id: string): BrowseState {
  const n = cloneState(s)
  if (id.startsWith('env:')) n.env = n.env.filter((c) => c !== id.slice(4))
  else if ((BROWSE_AXES as string[]).includes(id)) n[id as BrowseAxisKey] = []
  return n
}

export function withAxis(s: BrowseState, axis: BrowseAxisKey, codes: string[]): BrowseState {
  const n = cloneState(s)
  n[axis] = [...new Set(codes)]
  return n
}

/**
 * 직무를 어디까지 고를 수 있나 — 다른 조건과 섞을 때는 대분류(2자리)까지만(오너 결정).
 * 직무 하나에 직업이 평균 4.8개라 조건을 하나만 더해도 바로 0~1개가 된다
 */
export function groupDepth(s: BrowseState): 'top' | 'group' {
  const others = conditionCount(withAxis(s, 'group', []))
  return others > 0 ? 'top' : 'group'
}

/** 직무(3자리) 목록 — 이미 작아서 조건을 더하지 않는다 */
export const isGroupList = (s: BrowseState) => s.group.some((c) => c.length === 3)

/** 다음에 더할 분류 — 아직 안 쓴 것 가운데 입구 순서(직무는 섞을 때 대분류만이라 맨 끝) */
export function nextAxisToAdd(s: BrowseState): BrowseAxisKey | null {
  const order: BrowseAxisKey[] = ['interest', 'env', 'talent', 'value', 'salary', 'group']
  return order.find((k) => (k === 'env' ? true : s[k].length === 0)) ?? null
}

/** 8100 → '8,100만 원' */
export const formatManwon = (n: number) => `${n.toLocaleString('ko-KR')}만 원`

// 진로백과 '분류로 찾기'(2026-11-17) — 고른 조건 ↔ 주소(query) 와 조건 수. 판정 규칙은 서버에만 있다(이 레포는 공개).
// 고른 조건은 주소에 담는다 — 뒤로 가기(안드로이드 뒤로 버튼 R4 포함)·공유가 되고, 계정에는 저장하지 않는다.
// 사용성 확인 조정(같은 날 밤): 탭 하나 = 조건 하나(업무 환경도 탭 전체가 조건 하나), 직무도 다른 조건과 직무 단위로 섞는다.
import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import type { BrowseAxisKey, BrowseResult, BrowseRow } from '../types/browse'

/** 탭 순서(진로상담 권장 — 쓸모가 넓은 것부터, 연봉은 맨 끝). '조건 더하기'도 이 순서로 안 쓴 첫 탭을 연다 */
export const BROWSE_AXES: BrowseAxisKey[] = ['group', 'interest', 'env', 'talent', 'value', 'salary']
/** 조건은 3개까지(오너 결정 2) — 탭 수로 센다 */
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

/** 탭을 고른 순서 — '하나만 빼고 맞아요'는 들어온 탭(첫째)을 지키고 나중에 더한 탭이 빠진 직업부터 보여 준다 */
export function orderFromQuery(q: LocationQuery): BrowseAxisKey[] {
  return [...new Set(split(q.order))].filter((k): k is BrowseAxisKey => (BROWSE_AXES as string[]).includes(k))
}
/** 상태에 맞춰 순서를 고친다 — 빠진 탭은 지우고, 새로 쓴 탭은 끝에 붙인다(먼저 고른 것을 앞에) */
export function nextOrder(prev: BrowseAxisKey[], s: BrowseState, justUsed: BrowseAxisKey[] = []): BrowseAxisKey[] {
  const out = prev.filter((k) => s[k].length > 0)
  for (const k of [...justUsed, ...BROWSE_AXES]) if (s[k].length && !out.includes(k)) out.push(k)
  return out
}

/** API 꼴 — 축마다 쉼표로 이은 코드 */
export function paramsFromState(s: BrowseState): Record<string, string> {
  const out: Record<string, string> = {}
  for (const k of BROWSE_AXES) if (s[k].length) out[k] = s[k].join(',')
  return out
}
/** 목록 주소 — 조건 + 탭 순서(order) + 정렬 기준(sort = 들어온 탭) */
export function listQuery(s: BrowseState, order: BrowseAxisKey[], extra: Record<string, string> = {}): LocationQueryRaw {
  const o = nextOrder(order, s)
  return { ...paramsFromState(s), ...(o.length ? { order: o.join(','), sort: o[0]! } : {}), ...extra }
}

/** 조건 수 = 쓴 탭 수(한 탭 안에서 여럿 고르는 것은 '또는'이라 조건 하나) */
export function conditionCount(s: BrowseState): number {
  return BROWSE_AXES.reduce((n, k) => n + (s[k].length ? 1 : 0), 0)
}
export const isEmptyState = (s: BrowseState) => conditionCount(s) === 0
export const canAddCondition = (s: BrowseState) => conditionCount(s) < MAX_CONDITIONS

/** 이 탭을 지금 상태에 더(바꿔) 넣을 수 있나 — 이미 쓰는 탭이면 고치기라 늘 된다 */
export function canUseAxis(s: BrowseState, axis: BrowseAxisKey): boolean {
  return s[axis].length > 0 || canAddCondition(s)
}

/** 조건 하나 빼기 — id 는 서버 applied.conditions[].id(탭 이름). 예전 꼴 'env:<코드>'도 받는다 */
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

/** 다음에 더할 탭 — 아직 안 쓴 첫 탭(탭 순서) */
export function nextAxisToAdd(s: BrowseState): BrowseAxisKey | null {
  return BROWSE_AXES.find((k) => s[k].length === 0) ?? null
}

export interface NearGroup { id: string; label: string; rows: BrowseRow[]; total: number; canMore: boolean }
/**
 * '하나만 빼고 맞아요' — 빠진 조건마다 묶는다(서버가 묶음마다 몇 줄씩 이어 보낸다).
 * total = 자르기 전 전체 수(서버 nearGroups). 옛 서버(nearGroups 없음)면 받은 줄 수를 쓰고 더 보기를 두지 않는다
 */
export function groupNear(near: BrowseRow[] | undefined, meta: BrowseResult['nearGroups']): NearGroup[] {
  const totals = new Map((meta ?? []).map((g) => [g.id, g.total]))
  const groups: NearGroup[] = []
  for (const row of near ?? []) {
    const id = row.missing?.id ?? ''
    let g = groups[groups.length - 1]
    if (!g || g.id !== id) {
      g = { id, label: row.missing?.label ?? '', rows: [], total: 0, canMore: totals.has(id) }
      groups.push(g)
    }
    g.rows.push(row)
  }
  for (const g of groups) g.total = Math.max(totals.get(g.id) ?? 0, g.rows.length)
  return groups
}

/** 8100 → '8,100만 원', 11500 → '1억 1,500만 원', 10000 → '1억 원' */
export function formatManwon(n: number): string {
  const eok = Math.floor(n / 10000)
  const rest = n % 10000
  if (!eok) return `${rest.toLocaleString('ko-KR')}만 원`
  return rest ? `${eok}억 ${rest.toLocaleString('ko-KR')}만 원` : `${eok}억 원`
}

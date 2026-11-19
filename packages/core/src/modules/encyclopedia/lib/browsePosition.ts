// 분류로 찾기 목록 — 보던 자리(펼친 수·'하나만 빼고 맞아요' 묶음별 펼친 수·스크롤) 지키기(2026-11-19).
// 상세에서 돌아올 때만이 아니라 고르기 화면 → 로그인을 거쳐 돌아올 때도 지킨다(2026-11-18 사용성 QA — 60개 펼친 목록이
// 로그인 뒤 30개로 줄고 맨 위로 갔다). 로그인 뒤 돌아오는 주소는 고르기 화면이 만들어 펼친 수(n)가 없으므로,
// 주소 전체가 아니라 '같은 조건·같은 순서인가'로 맞춘다. 이 탭에만 둔다(sessionStorage) — 소셜 로그인은 제공자 화면을 거친다
import { paramsFromState, type BrowseState } from './browseQuery'
import type { BrowseAxisKey } from '../types/browse'

const KEY = 'lh_browse_pos'
/** 오래된 자리는 버린다 — 한참 뒤 홈에서 같은 조건으로 들어왔을 때 엉뚱한 자리로 뛰지 않게 */
export const POSITION_TTL_MS = 30 * 60 * 1000

export interface BrowsePosition {
  key: string
  /** 목록에 펼친 줄 수 */
  n: number
  /** '하나만 빼고 맞아요' 묶음(빠진 조건 id)마다 펼친 줄 수 */
  near: Record<string, number>
  y: number
  at: number
}

/** 같은 목록인가 — 조건과 탭 순서(정렬이 바뀐다) */
export function positionKey(s: BrowseState, order: BrowseAxisKey[]): string {
  return JSON.stringify([paramsFromState(s), order])
}

export function savePosition(p: Omit<BrowsePosition, 'at'>, now = Date.now()) {
  try { sessionStorage.setItem(KEY, JSON.stringify({ ...p, at: now })) } catch { /* 저장이 막히면 지키지 못할 뿐 */ }
}

/** 이 목록의 자리를 읽는다(지우지 않는다 — 다 펼친 뒤 clearPosition). 다른 목록이거나 오래됐으면 null */
export function readPosition(key: string, now = Date.now()): BrowsePosition | null {
  let p: BrowsePosition | null = null
  try { p = JSON.parse(sessionStorage.getItem(KEY) || 'null') } catch { return null }
  if (!p || p.key !== key || typeof p.at !== 'number' || now - p.at > POSITION_TTL_MS) return null
  return {
    key: p.key,
    n: Math.max(0, Number(p.n) || 0),
    near: Object.fromEntries(Object.entries(p.near ?? {}).filter(([, v]) => Number(v) > 0).map(([k, v]) => [k, Number(v)])),
    y: Math.max(0, Number(p.y) || 0),
    at: p.at,
  }
}

export function clearPosition() {
  try { sessionStorage.removeItem(KEY) } catch { /* 없음 */ }
}

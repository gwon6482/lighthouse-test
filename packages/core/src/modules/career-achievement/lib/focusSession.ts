// 멈춘 집중(2026-11-19 오너 결정 — 시안 '집중모드 멈춤·취소' 정할 것 1~8 권장).
// 집중하는 동안 그 기기에만 적어 두는 한 건. 저장('기록 남기기 → 저장') 전에는 서버로 아무것도 가지 않는다.
// 화면과 무관한 계산만 여기(시험: __tests__/focusSession.spec.ts). 기기 저장은 composables/useFocusSessions.ts
//
// 규칙
// - 프로젝트(그날 · 그 항목)마다 하나. 열쇠는 기록 열쇠와 같은 꼴 'date:itemType:itemId'
// - 시간은 벽시계 기준: 흐르는 중이면 accSec + (지금 - segStart). 앱이 꺼진 동안도 센다(정할 것 6)
// - 기록은 시작한 날(date)로 들어간다. 다음 날까지 이어 할 수 있고 그다음 날 지운다(정할 것 5)
// - 지우는 때: 집중 취소 · 저장 · 그 날짜에 완료됨(다른 기기 포함) · 계획에서 빠짐 · 다른 계획 · 그제 이전 · 로그아웃
//   단, 이미 완료한 항목을 다시 집중한 것(afterDone)은 '완료됨'으로 지우지 않는다 — 시작할 때부터 완료라
//   그 규칙이 곧바로 지워 '나중에 이어 하기'가 조용히 사라졌다(2026-11-19 사용성 QA)
import type { ProjectCategory } from '@/modules/career-design/types/career-design'

export const FOCUS_SESSIONS_KEY = 'lh_focus_sessions_v1'

export interface FocusSession {
  v: 1
  planId: string
  date: string              // 'YYYY-MM-DD' — 기록이 들어갈 날(시작한 날)
  itemType: 'project'
  itemId: string
  itemName: string          // 계획을 못 불러와도 화면을 그리려고
  itemCategory?: ProjectCategory
  goalMin: number
  accSec: number            // 지금 구간 전까지 쌓인 초(멈춘 상태면 전부)
  state: 'running' | 'paused'
  segStart: number | null   // running 일 때 지금 구간 시작(epoch ms)
  reached: boolean          // 목표 진동을 이미 울렸나(이어 해도 다시 울리지 않게)
  afterDone?: boolean       // 시작할 때 그 날짜에 이미 완료였나(완료한 일을 한 번 더 집중) — 홈에서는 따로 한 장으로
  from?: string             // 미리 하기(2026-11-23) — 옮겨 올 칸의 원래 날짜. 저장할 때 그 칸을 date 로 옮긴다
  keepAwake: boolean
  notify: boolean
  updatedAt: number
}
export type FocusSessionMap = Record<string, FocusSession>

export const sessionKey = (date: string, itemType: string, itemId: string) => `${date}:${itemType}:${itemId}`
export const keyOf = (s: Pick<FocusSession, 'date' | 'itemType' | 'itemId'>) => sessionKey(s.date, s.itemType, s.itemId)

// 지금까지 집중한 초. 기기 시계를 뒤로 돌려 segStart 가 미래여도 0 아래로 가지 않는다
export function elapsedOf(s: FocusSession, now: number): number {
  const run = s.state === 'running' && s.segStart != null ? Math.max(0, now - s.segStart) / 1000 : 0
  return Math.max(0, s.accSec) + run
}

export function pauseAt(s: FocusSession, now: number): FocusSession {
  if (s.state === 'paused') return s
  return { ...s, state: 'paused', accSec: elapsedOf(s, now), segStart: null, updatedAt: now }
}

export function resumeAt(s: FocusSession, now: number): FocusSession {
  if (s.state === 'running') return s
  return { ...s, state: 'running', segStart: now, updatedAt: now }
}

// 홈에서 다시 볼 때 — 흐르던 것(앱이 꺼졌다 켜짐)은 지금까지 세고 멈춤으로(정할 것 6: 꺼진 동안도 센다)
export const settleForHome = (s: FocusSession, now: number): FocusSession => pauseAt(s, now)

// 'YYYY-MM-DD' 를 하루 단위로 옮긴다(달·해 넘김 포함)
export function shiftDayKey(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const t = new Date(y!, m! - 1, d! + days)
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
}

// 어제까지만 산다(정할 것 5) — 오늘·어제(그리고 개발용 날짜를 되돌린 경우의 미래)는 남긴다
export const isAlive = (s: Pick<FocusSession, 'date'>, todayKey: string) => s.date >= shiftDayKey(todayKey, -1)

export interface PruneContext {
  planId: string
  projectIds: Set<string>
  isDone: (date: string, itemId: string) => boolean
  todayKey: string
}
// ⚠️ 계획을 제대로 불러온 경우에만 부른다. 연결이 안 되면 계획이 null 로 보이는데, 그때 지우면 오프라인에서 멈춘 집중이 사라진다
export function pruneSessions(map: FocusSessionMap, ctx: PruneContext): FocusSessionMap {
  const out: FocusSessionMap = {}
  for (const [k, s] of Object.entries(map)) {
    if (s.planId && s.planId !== ctx.planId) continue
    if (!ctx.projectIds.has(s.itemId)) continue
    if (!s.afterDone && ctx.isDone(s.date, s.itemId)) continue
    if (!isAlive(s, ctx.todayKey)) continue
    out[k] = s
  }
  return out
}

// '23분 40초' · '45초' · '1시간 5분' — 홈·확인 문장·기록 작성 화면(시트는 '23:40' clockLabel)
export function elapsedText(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  if (s < 60) return `${s}초`
  const m = Math.floor(s / 60)
  const r = s % 60
  if (m < 60) return r ? `${m}분 ${r}초` : `${m}분`
  const h = Math.floor(m / 60)
  const min = m % 60
  return min ? `${h}시간 ${min}분` : `${h}시간`
}

// 이미 완료한 일을 다시 집중해 저장 — 앞 기록 시간에 이번 시간을 더한다(2026-11-19 오너 결정).
// 기록은 날짜·항목마다 한 건이라 합계를 elapsedSec 로 저장한다. 앞 기록이 없거나(처음 완료) 완료가 아니면 이번 시간만
export function combinedElapsed(prevSec: number | null | undefined, alreadyDone: boolean, thisSec: number): { total: number; prev: number } {
  const prev = alreadyDone && prevSec && prevSec > 0 ? Math.floor(prevSec) : 0
  const now = Math.max(0, Math.floor(thisSec))
  return { total: prev + now, prev }
}
// 기록 작성 화면 '소요시간' — 더했으면 '42분(이번 12분)', 아니면 '23분 40초'(0이면 '기록 없음')
export function recordTimeLabel(total: number, prev: number): string {
  if (total <= 0) return '기록 없음'
  const now = total - prev
  return prev > 0 && now > 0 ? `${elapsedText(total)}(이번 ${elapsedText(now)})` : elapsedText(total)
}

// 이/가 — 마지막 글자 받침으로('23분 40초가' · '1시간이')
export function subjectJosa(w: string): string {
  const c = w.trim().slice(-1).charCodeAt(0) - 0xac00
  if (Number.isNaN(c) || c < 0 || c > 11171) return '이(가)'
  return c % 28 ? '이' : '가'
}

const DOW = ['일', '월', '화', '수', '목', '금', '토']
// 홈의 멈춘 집중 위 작은 글자 — '잠시 멈춤' · '어제 멈춤 · 11/18 (수)' · (오늘 목록에 없는 다른 날) '잠시 멈춤 · 11/20 (금)'
export function pausedEyebrow(date: string, todayKey: string, afterDone = false): string {
  if (date === todayKey) return afterDone ? '잠시 멈춤 · 완료한 일' : '잠시 멈춤'
  const [y, m, d] = date.split('-').map(Number)
  const day = `${m}/${d} (${DOW[new Date(y!, m! - 1, d!).getDay()]})`
  return date === shiftDayKey(todayKey, -1) ? `어제 멈춤 · ${day}` : `잠시 멈춤 · ${day}`
}

// 기기 저장본 읽기 — 모양이 어긋난 것은 버린다(예전 판·손으로 고친 값)
export function parseSessions(raw: string | null | undefined): FocusSessionMap {
  if (!raw) return {}
  let obj: unknown
  try { obj = JSON.parse(raw) } catch { return {} }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {}
  const out: FocusSessionMap = {}
  for (const v of Object.values(obj as Record<string, unknown>)) {
    const s = v as Partial<FocusSession> | null
    if (!s || s.v !== 1 || s.itemType !== 'project') continue
    if (typeof s.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s.date)) continue
    if (typeof s.itemId !== 'string' || !s.itemId || typeof s.itemName !== 'string') continue
    if (typeof s.accSec !== 'number' || !Number.isFinite(s.accSec) || typeof s.goalMin !== 'number') continue
    if (s.state !== 'running' && s.state !== 'paused') continue
    if (s.state === 'running' && (typeof s.segStart !== 'number' || !Number.isFinite(s.segStart))) continue
    const ok = s as FocusSession
    const { from: rawFrom, ...rest } = ok
    const from = typeof rawFrom === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawFrom) ? rawFrom : undefined
    out[keyOf(ok)] = { ...rest, ...(from ? { from } : {}), planId: typeof s.planId === 'string' ? s.planId : '', segStart: ok.state === 'running' ? ok.segStart : null }
  }
  return out
}

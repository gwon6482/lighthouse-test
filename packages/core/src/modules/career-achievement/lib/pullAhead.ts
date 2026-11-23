// 쉬어 가는 날 '미리 하기'(2026-11-23 오너 승인 — 시안 workspace reviews/2026-11-23-pull-ahead.html, 정할 것 1~5 권장).
// 화면과 무관한 계산만 여기(시험: __tests__/pullAhead.spec.ts). 화면 연결은 usePlanBoard(pullAhead)·CompletePage(save).
//
// 규칙
// - 이번 주 뒤 요일의 진도 프로젝트 칸을 오늘로 옮겨서 한다((a)). 다음 주 몫·한 번 더 하기는 하지 않는다
// - 옮기는 때는 기록을 저장할 때. 시작만 하고 그만두면 원래 요일 그대로
// - 옮긴 칸은 주간 일정 칸의 note 에 'ahead:<원래 날짜>'를 남긴다 — 오늘이 '쉬어 가는 날로 시작한 날'인지 가리는 데 쓴다
//   (오늘 칸이 모두 옮겨 온 칸이면 원래 쉬는 날. 원래 할 일이 있던 날은 다 끝내도 미리 하기가 나오지 않는다 — 정할 것 5)
// - 후보: 프로젝트마다 가장 가까운 요일 하나, 날짜 순 3개까지. 과정·루틴·그만둔 프로젝트·끝낸 칸·오늘 이미 있는 프로젝트,
//   이번 주 할 일 목록이 다 찬 프로젝트(결과 기다리는 주처럼 할 일이 없는 주 포함)는 내지 않는다

export const AHEAD_MAX = 3
const AHEAD_PREFIX = 'ahead:'
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** 'YYYY-MM-DD' 꼴이면 그대로, 아니면 null(주소·기기 저장본에서 온 값) */
export const validDateKey = (v: unknown): string | null => (typeof v === 'string' && DATE_RE.test(v) ? v : null)
/** 옮긴 칸의 표시 */
export const aheadNote = (from: string) => `${AHEAD_PREFIX}${from}`
/** 칸이 옮겨 온 것이면 원래 날짜, 아니면 null */
export const aheadFromNote = (note?: string | null): string | null =>
  note && note.startsWith(AHEAD_PREFIX) ? validDateKey(note.slice(AHEAD_PREFIX.length)) : null

export interface AheadItem { id?: string; itemType: 'project' | 'routine'; itemId: string; date?: string; note?: string; curriculumWeek?: number | null }
export interface AheadDay { date: string; items: AheadItem[] }
export interface AheadProject { period?: boolean; stoppedAt?: string }
export interface AheadCandidate { projectId: string; date: string }

/** 오늘이 원래 쉬어 가는 날인가 — 칸이 없거나, 있는 칸이 모두 미리 하기로 옮겨 온 것 */
export function restOrigin(todayItems: AheadItem[]): boolean {
  return todayItems.every((it) => it.itemType === 'project' && !!aheadFromNote(it.note))
}

export function pullAheadCandidates(o: {
  todayKey: string
  todayItems: AheadItem[]
  laterDays: AheadDay[]                                  // 내일 ~ 이번 주 마지막 날(날짜 순)
  projectOf: (id: string) => AheadProject | undefined
  isDone: (projectId: string, date: string) => boolean   // 그날 완료 기록이 있나
  hasUndoneThisWeek: (projectId: string) => boolean      // 이번 주 할 일 목록에 안 한 항목이 남았나
  skip?: Set<string>                                     // 그 밖에 뺄 프로젝트(오늘 멈춘 집중이 있는 것 등)
  max?: number
}): AheadCandidate[] {
  if (!restOrigin(o.todayItems)) return []
  const max = o.max ?? AHEAD_MAX
  const today = new Set(o.todayItems.filter((it) => it.itemType === 'project').map((it) => it.itemId))
  const seen = new Set<string>()
  const out: AheadCandidate[] = []
  const days = [...o.laterDays].filter((d) => d.date > o.todayKey).sort((a, b) => a.date.localeCompare(b.date))
  for (const day of days) {
    for (const it of day.items) {
      if (out.length >= max) return out
      if (it.itemType !== 'project' || seen.has(it.itemId)) continue
      seen.add(it.itemId) // 가장 가까운 요일 하나만 — 그 칸이 빠지는 이유가 있어도 더 뒤 요일로 넘기지 않는다
      const p = o.projectOf(it.itemId)
      if (!p || p.period) continue
      if (p.stoppedAt && p.stoppedAt <= o.todayKey) continue
      if (today.has(it.itemId) || o.skip?.has(it.itemId)) continue
      if (o.isDone(it.itemId, day.date) || o.isDone(it.itemId, o.todayKey)) continue
      if (!o.hasUndoneThisWeek(it.itemId)) continue
      out.push({ projectId: it.itemId, date: day.date })
    }
  }
  return out
}

/**
 * 저장할 때 칸 옮기기 — from 날짜의 그 프로젝트 칸을 to(오늘)로. 못 찾으면(그사이 일정이 다시 만들어짐) 오늘 칸을 하나 더한다.
 * 오늘에 이미 그 프로젝트 칸이 있으면 그대로(두 번 저장·다시 집중). changed=false 면 서버에 보내지 않는다
 */
export function moveAheadItem<T extends AheadItem & { id: string; date: string }>(
  items: T[], o: { itemId: string; from: string; to: string; newId: string },
): { items: T[]; changed: boolean; found: boolean } {
  if (items.some((it) => it.itemType === 'project' && it.itemId === o.itemId && it.date === o.to)) return { items, changed: false, found: true }
  const i = items.findIndex((it) => it.itemType === 'project' && it.itemId === o.itemId && it.date === o.from)
  if (i >= 0) {
    const next = items.slice()
    next[i] = { ...items[i]!, date: o.to, note: aheadNote(o.from) }
    return { items: next, changed: true, found: true }
  }
  const add = { id: o.newId, itemType: 'project', itemId: o.itemId, date: o.to, curriculumWeek: null, note: aheadNote(o.from) } as T
  return { items: [...items, add], changed: true, found: false }
}

// ── 홈 연결(usePlanBoard.pullAhead) — 시험하려고 순수 함수로 뺐다 ──
/**
 * 계획이 진행 중이고 오늘이 원래 쉬는 날일 때만, 내일 ~ 이번 주 마지막 날의 칸으로 후보를 고른다.
 * 오늘 멈춘 집중이 있는 프로젝트는 '잠시 멈춤' 카드가 맡으므로 뺀다.
 * ⚠️ 의도된 동작(2026-11-23 총괄): 미리 해서 칸을 비운 다음 날도 화면이 '쉬어 가는 날'이라 말하므로, 그날도 미리 하기가 이어서 나온다.
 */
export function homePullAhead(o: {
  running: boolean
  today: Date
  todayKey: string
  weekEnd: string | null
  itemsOn: (d: Date) => AheadItem[]
  sessions: { date: string; itemId: string }[]
  projectOf: (id: string) => AheadProject | undefined
  isDone: (projectId: string, date: string) => boolean
  hasUndoneThisWeek: (projectId: string) => boolean
}): AheadCandidate[] {
  if (!o.running || !o.weekEnd) return []
  const todayItems = o.itemsOn(o.today)
  if (!restOrigin(todayItems)) return []
  const laterDays: AheadDay[] = []
  const d = new Date(o.today)
  for (let i = 0; i < 14; i += 1) {
    d.setDate(d.getDate() + 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (key > o.weekEnd) break
    laterDays.push({ date: key, items: o.itemsOn(d) })
  }
  const skip = new Set(o.sessions.filter((s) => s.date === o.todayKey).map((s) => s.itemId))
  return pullAheadCandidates({
    todayKey: o.todayKey, todayItems, laterDays, projectOf: o.projectOf, skip, isDone: o.isDone, hasUndoneThisWeek: o.hasUndoneThisWeek,
  })
}

// ── 저장할 때(CareerAchievementCompletePage.save) ──
/**
 * 옮길 원래 날짜 — 주소의 from(없으면 멈춘 집중의 from). 멈춘 집중을 지우기 **전에** 부른다.
 * 같은 주(weekStart~weekEnd)의 뒤 날짜이고, 그날 그 프로젝트 완료 기록이 없을 때만. 아니면 null(평소 저장 그대로)
 */
export function aheadFromForSave(o: {
  queryFrom: unknown; sessionFrom?: string | null; to: string; weekStart: string; weekEnd: string; doneOnFrom: (from: string) => boolean
}): string | null {
  const from = validDateKey(o.queryFrom) ?? validDateKey(o.sessionFrom ?? null)
  if (!from || !(from > o.to) || from > o.weekEnd || o.to < o.weekStart) return null
  if (o.doneOnFrom(from)) return null // 그 요일에 평소대로 이미 끝냈으면 옮기지 않는다(그 칸이 기록 없이 뜬다)
  return from
}

// ── 옮기기 실패 → 기기에 적어 두고 홈을 불러올 때 다시 시도 ──
export const AHEAD_PENDING_KEY = 'lh_ahead_pending_v1'
export const AHEAD_PENDING_MAX = 20
export interface AheadPending { planId: string; weekStart: string; weekEnd: string; itemId: string; from: string; to: string }
const pendingKey = (e: AheadPending) => `${e.planId}|${e.itemId}|${e.to}`
export function parsePending(raw: string | null | undefined): AheadPending[] {
  let v: unknown
  try { v = JSON.parse(raw || '[]') } catch { return [] }
  if (!Array.isArray(v)) return []
  return v.filter((e): e is AheadPending => !!e && typeof e === 'object'
    && typeof e.planId === 'string' && !!e.planId && typeof e.itemId === 'string' && !!e.itemId
    && [e.weekStart, e.weekEnd, e.from, e.to].every((x) => validDateKey(x)))
}
/** 같은 계획·프로젝트·날짜는 하나만, 오래된 것부터 버려 AHEAD_PENDING_MAX 개까지 */
export function addPending(list: AheadPending[], e: AheadPending): AheadPending[] {
  return [...list.filter((x) => pendingKey(x) !== pendingKey(e)), e].slice(-AHEAD_PENDING_MAX)
}
/**
 * 다시 시도할 것인가 — 주가 지났으면·이미 오늘(to) 칸에 있으면(옮겨졌음)·원래 요일에 끝냈으면 버린다(drop)
 */
export function pendingStep(e: AheadPending, o: { todayKey: string; items: AheadItem[]; doneOnFrom: boolean }): 'drop' | 'move' {
  if (e.weekEnd < o.todayKey) return 'drop'
  if (o.items.some((it) => it.itemType === 'project' && it.itemId === e.itemId && it.date === e.to)) return 'drop'
  if (o.doneOnFrom) return 'drop'
  return 'move'
}

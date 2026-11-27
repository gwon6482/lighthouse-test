import { ref } from 'vue'
import { req } from '@/shared/api'
import type {
  Project, Routine, DayOfWeek, TimelineSlot,
} from '@/modules/career-design/types/career-design'
import { weekOfDate, weekDateRange, projectsActiveInWeek } from '@/modules/career-design/composables/usePlanTimeline'
import { beforeStartOn, datesMatchSlot, outsideDates } from '@/modules/career-design/lib/projectDates'
import { rebuildStart, rebuildWeekItems } from '../lib/scheduleRebuild'
import { getToday } from '@/shared/utils/dev-date'
import { uid } from '@/shared/utils/uid'
import { routineOnDay, voiceOverlap } from '@/modules/career-design/lib/routine'
import { onAccountChange } from '@/shared/auth/accountScope'
import { moveAheadItem, parsePending, addPending, pendingStep, AHEAD_PENDING_KEY, type AheadPending } from '../lib/pullAhead'

// 한 주의 확정된 일정 1건. BE WeeklySchedule.items 의 1요소.
export interface WeeklyScheduleItem {
  id: string
  itemType: 'project' | 'routine'
  itemId: string
  date: string                  // 'YYYY-MM-DD'
  curriculumWeek?: number | null
  note?: string
}

// 다시 만들 주(2026-11-26) — from 날부터 다시 만들고, 그 전 칸은 items 그대로 둔다
export interface WeekRebuild { from: string; items: WeeklyScheduleItem[] }

// 한 주의 확정된 일정 전체. planId + weekStart 로 식별.
export interface WeeklySchedule {
  scheduleId: string
  planId: string
  weekStart: string             // 'YYYY-MM-DD'
  weekEnd:   string             // 'YYYY-MM-DD'
  items: WeeklyScheduleItem[]
  reviewedAt: string | null
  reviewNote: string
  status: 'pending' | 'reviewed'
  createdAt?: string
  updatedAt?: string
}

// 모듈 단위 캐시 — 컴포저블이 여러 컴포넌트에서 사용돼도 같은 ref 공유
const schedules = ref<WeeklySchedule[]>([])

// ── 날짜 / 주차 헬퍼 ─────────────────────────────────
const DOW_ARR: DayOfWeek[] = ['일', '월', '화', '수', '목', '금', '토']

export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

export function parseDateKey(s: string): Date | null {
  const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (!m) return null
  const dt = new Date(+m[1]!, +m[2]! - 1, +m[3]!)
  dt.setHours(0, 0, 0, 0)
  return dt
}

export function dowOf(d: Date): DayOfWeek {
  return DOW_ARR[d.getDay()]!
}

// 진로계획 첫 주 [weekStart, weekEnd] — 시작일 ~ 첫 리뷰일 전날(7~13일). 주 규칙은 usePlanTimeline(weekDateRange) 한곳.
// reviewDay 가 비어 있으면 월요일.
export function computeFirstWeekRange(
  startDate: string, reviewDay: DayOfWeek | '',
): { weekStart: string; weekEnd: string } | null {
  const r = weekDateRange(startDate, 1, reviewDay)
  return r ? { weekStart: r.start, weekEnd: r.end } : null
}

// 임의 날짜 date 가 속한 주의 [weekStart, weekEnd]. date < startDate 면 null (계획 시작 전).
export function computeWeekRangeContaining(
  date: Date, startDate: string, reviewDay: DayOfWeek | '',
): { weekStart: string; weekEnd: string } | null {
  const w = weekOfDate(startDate, date, reviewDay)
  const r = w ? weekDateRange(startDate, w, reviewDay) : null
  return r ? { weekStart: r.start, weekEnd: r.end } : null
}

// 어떤 주(weekStart~weekEnd) 안의 어떤 날짜에 어떤 프로젝트/루틴이 잡힐지 디폴트 생성.
// 마스터 데이터의 Project.days / Routine.days / timeline 을 그대로 곱해서 만든다.
// Phase 4 의 주간리뷰 단계에서 사용자가 자유롭게 수정 가능.
export function generateItemsForWeek(
  plan: { startDate: string; endDate?: string; reviewDay?: DayOfWeek | ''; projects: Project[]; routines: Routine[] },
  timeline: TimelineSlot[],
  weekStart: string,
  weekEnd: string,
): WeeklyScheduleItem[] {
  const out: WeeklyScheduleItem[] = []
  const sd = parseDateKey(weekStart)
  const ed = parseDateKey(weekEnd)
  if (!sd || !ed) return out

  // 프로젝트 id → 타임라인 시작 주차
  const startWeekOf = new Map<string, number>()
  for (const slot of timeline) {
    for (const p of slot.projects) {
      const prev = startWeekOf.get(p.id)
      if (prev === undefined || slot.week < prev) startWeekOf.set(p.id, slot.week)
    }
  }

  const cursor = new Date(sd)
  while (cursor.getTime() <= ed.getTime()) {
    const dow     = dowOf(cursor)
    const dateKey = toDateKey(cursor)

    // 달력 주는 계획 시작 전·종료 후 날짜를 품을 수 있다(첫 주/마지막 주). 그 날은 건너뛴다.
    if ((plan.startDate && dateKey < plan.startDate) || (plan.endDate && dateKey > plan.endDate)) {
      cursor.setDate(cursor.getDate() + 1)
      continue
    }

    // 그날이 계획의 몇 주차인지(타임라인이 주차 기준) — 넘겨받은 범위가 주 경계와 어긋나도 날마다 맞게(2026-11-04 1주차 7~13일)
    const planWeek = weekOfDate(plan.startDate, cursor, plan.reviewDay)
    if (planWeek === null) { cursor.setDate(cursor.getDate() + 1); continue }
    // 그 주에 진행 중인 프로젝트만 후보 (시작주 ~ 시작주+기간-1)
    const activeIds = new Set(projectsActiveInWeek(timeline, planWeek, plan.projects).map(p => p.id))
    let courseDay = false   // 그날 과정(학교·학원)에 다니는가 — 새 루틴은 그날 빠진다(2026-11-21 루틴 리뉴얼)

    for (const p of plan.projects) {
      if (!activeIds.has(p.id)) continue
      if (!p.days?.includes(dow)) continue
      // 날짜로 정한 걸음(2026-11-25) — 첫 주·마지막 주의 날짜 밖 요일은 뺀다(시작 전날·마감 다음 날에 할 일이 뜨지 않게).
      // 타임라인 자리가 날짜가 걸친 주와 맞을 때만 — 어긋나 있으면(옛 앱이 다시 놓음 등) 빼지 않고 타임라인대로(할 일이 통째로 사라지지 않게)
      if (outsideDates(p, dateKey) && datesMatchSlot(p, startWeekOf.get(p.id), { startDate: plan.startDate, reviewDay: plan.reviewDay })) continue
      // 시작일만 정한 걸음(2026-11-26 #99 '오늘부터') — 놓인 첫 주의 시작일 전 요일은 뺀다
      if (beforeStartOn(p, dateKey, startWeekOf.get(p.id), { startDate: plan.startDate, reviewDay: plan.reviewDay })) continue

      // 커리큘럼 n주차 = 계획주차 - 프로젝트 시작주차 + 1.
      // 주차 모델에서는 배치 자체가 주 단위라 나눗셈 없이 바로 떨어진다.
      const startWeek = startWeekOf.get(p.id)
      const curriculumWeek = startWeek === undefined ? null : planWeek - startWeek + 1
      // 과정의 쉬는 주(주간결산 '잠시 쉬어요')에는 오늘 할 일을 만들지 않는다(2026-11-16)
      if (p.period && curriculumWeek && p.curriculum?.find((c) => c.week === curriculumWeek)?.pause) continue

      if (p.period) courseDay = true
      out.push({
        id: uid(),
        itemType: 'project',
        itemId: p.id,
        date: dateKey,
        curriculumWeek,
      })
    }

    // 루틴(2026-11-21 루틴 리뉴얼) — 요일 + 붙은 프로젝트가 놓인 주에만 · 쉬는 주·끝낸 날 · 과정 다니는 날 빼기(lib/routine.ts)
    const projectIds = new Set(plan.projects.map((p) => p.id))
    // 목을 쓰는 루틴은 한 번에 하나 — 겹치는 주에는 먼저 시작한 것만(진로상담 검토 11-21)
    const voiceOff = voiceOverlap(plan.routines, startWeekOf, { date: dateKey, planWeek, activeProjectIds: activeIds })
    for (const r of plan.routines) {
      if (voiceOff.has(r.id)) continue
      if (!routineOnDay(r, { date: dateKey, dow, planWeek, projectIds, activeProjectIds: activeIds, courseDay })) continue
      out.push({
        id: uid(),
        itemType: 'routine',
        itemId: r.id,
        date: dateKey,
      })
    }

    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}

export function useWeeklySchedule() {
  // 그 plan 의 모든 주간 일정 목록 (weekStart desc)
  async function fetchSchedules(planId: string): Promise<WeeklySchedule[]> {
    try {
      const res = await req.get(`/api/career-plan/${planId}/weekly-schedule`)
      schedules.value = res.data.schedules ?? []
      return schedules.value
    } catch {
      return []
    }
  }

  // 특정 주 1건 조회. 없으면 null
  async function fetchScheduleByWeek(planId: string, weekStart: string): Promise<WeeklySchedule | null> {
    return (await fetchWeek(planId, weekStart)).schedule
  }
  // 조회 + 다시 만들 주(2026-11-26, 서버 rebuildFrom) — 계획이 바뀐 이번 주는 schedule 이 null 이고 rebuild 에 그 날 전 칸이 온다
  async function fetchWeek(planId: string, weekStart: string): Promise<{ schedule: WeeklySchedule | null; rebuild: WeekRebuild | null }> {
    try {
      const res = await req.get(`/api/career-plan/${planId}/weekly-schedule/${weekStart}`)
      const rb = res.data.rebuild
      return {
        schedule: res.data.schedule ?? null,
        rebuild: rb && typeof rb.from === 'string' && Array.isArray(rb.items) ? { from: rb.from, items: rb.items } : null,
      }
    } catch {
      return { schedule: null, rebuild: null }
    }
  }

  // 그 주의 일정 신규 생성. 이미 있으면 BE 가 409 와 함께 기존 schedule 을 반환 → 그걸 그대로 반환
  async function createSchedule(
    planId: string,
    weekStart: string,
    weekEnd: string,
    items: WeeklyScheduleItem[] = []
  ): Promise<WeeklySchedule | null> {
    try {
      const res = await req.post(`/api/career-plan/${planId}/weekly-schedule`, {
        weekStart, weekEnd, items
      })
      return res.data.schedule
    } catch (err: any) {
      if (err?.response?.status === 409 && err?.response?.data?.schedule) {
        return err.response.data.schedule
      }
      return null
    }
  }

  // 부분 업데이트 (items / weekEnd / reviewNote / status)
  async function updateSchedule(
    planId: string,
    weekStart: string,
    body: Partial<Pick<WeeklySchedule, 'weekEnd' | 'items' | 'reviewNote' | 'status'>>
  ): Promise<WeeklySchedule | null> {
    try {
      const res = await req.put(`/api/career-plan/${planId}/weekly-schedule/${weekStart}`, body)
      return res.data.schedule
    } catch {
      return null
    }
  }

  async function deleteSchedule(planId: string, weekStart: string): Promise<boolean> {
    try {
      await req.delete(`/api/career-plan/${planId}/weekly-schedule/${weekStart}`)
      return true
    } catch {
      return false
    }
  }

  // ── 헬퍼: weekStart 부터 weekEnd 까지의 날짜별 items 분류 (UI 렌더링 편의) ──
  function itemsByDate(schedule: WeeklySchedule | null): Record<string, WeeklyScheduleItem[]> {
    const map: Record<string, WeeklyScheduleItem[]> = {}
    if (!schedule) return map
    for (const it of schedule.items) {
      ;(map[it.date] ??= []).push(it)
    }
    return map
  }

  // 임의 주의 schedule 이 없으면 디폴트로 자동 생성 (있으면 그대로 반환). idempotent.
  async function ensureWeekSchedule(
    planId: string,
    plan: { startDate: string; endDate?: string; reviewDay?: DayOfWeek | ''; projects: Project[]; routines: Routine[] },
    timeline: TimelineSlot[],
    weekStart: string,
    weekEnd: string,
  ): Promise<WeeklySchedule | null> {
    const { schedule: existing, rebuild } = await fetchWeek(planId, weekStart)
    if (existing) return existing
    const generated = generateItemsForWeek(
      { startDate: plan.startDate, endDate: plan.endDate, reviewDay: plan.reviewDay, projects: plan.projects, routines: plan.routines },
      timeline,
      weekStart,
      weekEnd,
    )
    // 계획이 바뀐 이번 주 — 지난 요일은 그대로 두고 그 날부터만 다시 만든다(lib/scheduleRebuild.ts). 옛 서버는 rebuild 가 없어 예전처럼 통째로
    const ids = new Set([...plan.projects.map((p) => `project:${p.id}`), ...plan.routines.map((r) => `routine:${r.id}`)])
    const from = rebuild ? rebuildStart(rebuild.from, toDateKey(getToday())) : ''
    const items = rebuild ? rebuildWeekItems(rebuild.items, generated, from, (it) => ids.has(`${it.itemType}:${it.itemId}`)) : generated
    return await createSchedule(planId, weekStart, weekEnd, items)
  }

  // 첫 주 schedule 자동 생성 (진로계획 완성 직후 Result 페이지에서 호출).
  async function ensureFirstWeekSchedule(
    planId: string,
    plan: { startDate: string; endDate?: string; reviewDay: DayOfWeek | ''; projects: Project[]; routines: Routine[] },
    timeline: TimelineSlot[],
  ): Promise<WeeklySchedule | null> {
    if (!plan.startDate || !plan.reviewDay) return null
    const range = computeFirstWeekRange(plan.startDate, plan.reviewDay)
    if (!range) return null
    return ensureWeekSchedule(planId, plan, timeline, range.weekStart, range.weekEnd)
  }

  // 미리 하기(2026-11-23) — 기록을 저장할 때 from 날짜의 그 프로젝트 칸을 to(오늘)로 옮긴다. 못 찾으면 오늘 칸을 하나 더한다
  // (from 이 같은 주의 뒤 날짜인지는 부르는 쪽이 aheadFromForSave 로 본다). 그 주 일정이 없으면 계획 배치로 먼저 만든다.
  // 실패하면 false — 부르는 쪽이 queueAhead 로 기기에 적어 두고, 홈을 불러올 때 retryAhead 가 다시 시도한다
  async function moveAheadOnSave(
    planId: string,
    plan: { startDate: string; endDate?: string; reviewDay?: DayOfWeek | ''; projects: Project[]; routines: Routine[] },
    timeline: TimelineSlot[],
    o: { itemId: string; from: string; to: string },
  ): Promise<boolean> {
    try {
      const to = parseDateKey(o.to)
      const range = to ? computeWeekRangeContaining(to, plan.startDate, (plan.reviewDay || '월') as DayOfWeek) : null
      if (!range) return false
      const schedule = await ensureWeekSchedule(planId, plan, timeline, range.weekStart, range.weekEnd)
      if (!schedule) return false
      const r = moveAheadItem(schedule.items, { ...o, newId: uid() })
      if (!r.changed) return true
      return !!(await updateSchedule(planId, schedule.weekStart, { items: r.items }))
    } catch {
      return false
    }
  }

  return {
    schedules,
    fetchSchedules,
    moveAheadOnSave,
    retryAhead: (
      planId: string,
      plan: { startDate: string; endDate?: string; reviewDay?: DayOfWeek | ''; projects: Project[]; routines: Routine[] },
      timeline: TimelineSlot[],
      o: { todayKey: string; isDone: (projectId: string, date: string) => boolean },
    ) => retryAhead(moveAheadOnSave, fetchScheduleByWeek, planId, plan, timeline, o),
    fetchScheduleByWeek,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    itemsByDate,
    ensureWeekSchedule,
    ensureFirstWeekSchedule,
  }
}

// ── 미리 하기 옮기기 실패분(기기) — 성공하거나, 이미 옮겨졌거나, 주가 지났거나, 원래 요일에 끝냈으면 지운다 ──
function readPending(): AheadPending[] {
  try { return parsePending(localStorage.getItem(AHEAD_PENDING_KEY)) } catch { return [] }
}
function writePending(list: AheadPending[]) {
  try {
    if (list.length) localStorage.setItem(AHEAD_PENDING_KEY, JSON.stringify(list))
    else localStorage.removeItem(AHEAD_PENDING_KEY)
  } catch { /* 저장 못 하면 다시 시도만 못 한다 */ }
}
export function queueAhead(e: AheadPending) {
  writePending(addPending(readPending(), e))
}
/** 홈을 불러올 때 — 그 계획의 실패분을 다시 옮긴다. 무엇이든 옮겼으면 true(부르는 쪽이 일정을 다시 받는다) */
async function retryAhead(
  move: (planId: string, plan: any, timeline: TimelineSlot[], o: { itemId: string; from: string; to: string }) => Promise<boolean>,
  fetchWeek: (planId: string, weekStart: string) => Promise<WeeklySchedule | null>,
  planId: string,
  plan: { startDate: string; endDate?: string; reviewDay?: DayOfWeek | ''; projects: Project[]; routines: Routine[] },
  timeline: TimelineSlot[],
  o: { todayKey: string; isDone: (projectId: string, date: string) => boolean },
): Promise<boolean> {
  const list = readPending()
  if (!list.some((e) => e.planId === planId)) return false
  const keep: AheadPending[] = []
  let moved = false
  for (const e of list) {
    if (e.planId !== planId) { keep.push(e); continue }
    if (!plan.projects.some((p) => p.id === e.itemId)) continue
    const week = await fetchWeek(planId, e.weekStart)
    const step = pendingStep(e, { todayKey: o.todayKey, items: week?.items ?? [], doneOnFrom: o.isDone(e.itemId, e.from) })
    if (step === 'drop') continue
    if (await move(planId, plan, timeline, { itemId: e.itemId, from: e.from, to: e.to })) moved = true
    else keep.push(e)
  }
  // 다시 시도하는 동안 새로 적힌 것(다른 저장)은 남긴다
  const added = readPending().filter((x) => !list.some((y) => y.planId === x.planId && y.itemId === x.itemId && y.to === x.to))
  writePending([...keep, ...added])
  return moved
}
// 계정이 바뀌면(로그아웃·다른 계정 로그인) 앞 계정의 실패분을 비운다(2026-11-24). 계획 id 로도 가르지만(다른 계정의 계획이면 보내지 않음)
// 같은 기기에 앞 사람의 계획·프로젝트 id·날짜가 남지 않게. 같은 계정으로 다시 로그인해도 지워진다 — 그 칸은 옮기지 못한 채 남는다(기록은 남아 있다)
// 받아 둔 주간 일정(메모리)도 비운다(2026-11-27) — 다음 계정의 홈·하단 탭 배지가 앞 계정의 주를 읽지 않게
onAccountChange(() => {
  writePending([])
  schedules.value = []
})

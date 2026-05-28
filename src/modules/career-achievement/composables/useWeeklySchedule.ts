import { ref } from 'vue'
import { req } from '@/shared/api'
import type {
  Project, Routine, DayOfWeek, TimelineSlot,
} from '@/modules/career-design/types/career-design'

// 한 주의 확정된 일정 1건. BE WeeklySchedule.items 의 1요소.
export interface WeeklyScheduleItem {
  id: string
  itemType: 'project' | 'routine'
  itemId: string
  date: string                  // 'YYYY-MM-DD'
  curriculumWeek?: number | null
  note?: string
}

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

// timeline.month 라벨 파싱: "2026년 3월" / "2026.03" / "2026-03" / "2026-03-01" 모두 허용
function parseMonthLabel(s: string): { year: number; month: number } | null {
  if (!s) return null
  const kr = s.match(/(\d+)\s*년\s*(\d+)\s*월/)
  if (kr) return { year: +kr[1]!, month: +kr[2]! }
  const dot = s.match(/^(\d+)\.(\d+)/)
  if (dot) return { year: +dot[1]!, month: +dot[2]! }
  const dash = s.match(/^(\d+)-(\d+)/)
  if (dash) return { year: +dash[1]!, month: +dash[2]! }
  return null
}

// 진로계획 startDate 와 reviewDay 로 첫 주 [weekStart, weekEnd] 범위 계산.
// weekStart 는 startDate (포함), weekEnd 는 startDate 이후 처음 등장하는 reviewDay (포함).
// startDate 가 곧 reviewDay 면 다음 주 reviewDay 까지 7일을 첫 주로 잡음.
export function computeFirstWeekRange(
  startDate: string, reviewDay: DayOfWeek,
): { weekStart: string; weekEnd: string } | null {
  const sd = parseDateKey(startDate)
  if (!sd) return null

  const cursor = new Date(sd)
  if (dowOf(cursor) === reviewDay) {
    cursor.setDate(cursor.getDate() + 1)
  }
  while (dowOf(cursor) !== reviewDay) {
    cursor.setDate(cursor.getDate() + 1)
  }
  return { weekStart: startDate, weekEnd: toDateKey(cursor) }
}

// 임의 날짜 date 가 속한 주의 [weekStart, weekEnd] 계산.
// 첫 주부터 forward 로 이동하며 date 가 weekEnd 이내에 들어올 때까지 진행.
// date < startDate 면 null (계획 시작 전).
export function computeWeekRangeContaining(
  date: Date, startDate: string, reviewDay: DayOfWeek,
): { weekStart: string; weekEnd: string } | null {
  const first = computeFirstWeekRange(startDate, reviewDay)
  if (!first) return null
  const dateKey = toDateKey(date)
  if (dateKey < first.weekStart) return null

  let weekStart = first.weekStart
  let weekEnd   = first.weekEnd
  // 안전 가드 — 무한루프 방지 (10년치)
  for (let i = 0; i < 600; i++) {
    if (dateKey <= weekEnd) return { weekStart, weekEnd }
    const ed = parseDateKey(weekEnd)
    if (!ed) return null
    const ns = new Date(ed); ns.setDate(ns.getDate() + 1)
    const ne = new Date(ns); ne.setDate(ne.getDate() + 6)
    weekStart = toDateKey(ns)
    weekEnd   = toDateKey(ne)
  }
  return null
}

// 어떤 주(weekStart~weekEnd) 안의 어떤 날짜에 어떤 프로젝트/루틴이 잡힐지 디폴트 생성.
// 마스터 데이터의 Project.days / Routine.days / timeline 을 그대로 곱해서 만든다.
// Phase 4 의 주간리뷰 단계에서 사용자가 자유롭게 수정 가능.
export function generateItemsForWeek(
  plan: { projects: Project[]; routines: Routine[] },
  timeline: TimelineSlot[],
  weekStart: string,
  weekEnd: string,
): WeeklyScheduleItem[] {
  const out: WeeklyScheduleItem[] = []
  const sd = parseDateKey(weekStart)
  const ed = parseDateKey(weekEnd)
  if (!sd || !ed) return out

  // 프로젝트가 처음 배치된 월의 1일 → curriculumWeek 계산용 anchor
  function firstAnchorFor(projectId: string): Date | null {
    let best: { year: number; month: number } | null = null
    for (const slot of timeline) {
      if (!slot.projects.some(p => p.id === projectId)) continue
      const parsed = parseMonthLabel(slot.month)
      if (!parsed) continue
      if (!best || parsed.year < best.year || (parsed.year === best.year && parsed.month < best.month)) {
        best = parsed
      }
    }
    return best ? new Date(best.year, best.month - 1, 1) : null
  }

  const cursor = new Date(sd)
  while (cursor.getTime() <= ed.getTime()) {
    const dow     = dowOf(cursor)
    const dateKey = toDateKey(cursor)
    const curY    = cursor.getFullYear()
    const curM    = cursor.getMonth() + 1

    // 이번 달에 활성인 프로젝트만 후보
    const monthSlot = timeline.find(slot => {
      const p = parseMonthLabel(slot.month)
      return p && p.year === curY && p.month === curM
    })
    const activeIds = new Set(monthSlot?.projects.map(p => p.id) ?? [])

    for (const p of plan.projects) {
      if (!activeIds.has(p.id)) continue
      if (!p.days?.includes(dow)) continue

      const anchor = firstAnchorFor(p.id)
      let curriculumWeek: number | null = null
      if (anchor) {
        const days = Math.floor((cursor.getTime() - anchor.getTime()) / 86400000)
        if (days >= 0) curriculumWeek = Math.floor(days / 7) + 1
      }

      out.push({
        id: crypto.randomUUID(),
        itemType: 'project',
        itemId: p.id,
        date: dateKey,
        curriculumWeek,
      })
    }

    for (const r of plan.routines) {
      if (!r.days?.includes(dow)) continue
      out.push({
        id: crypto.randomUUID(),
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
    try {
      const res = await req.get(`/api/career-plan/${planId}/weekly-schedule/${weekStart}`)
      return res.data.schedule ?? null
    } catch {
      return null
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
    plan: { projects: Project[]; routines: Routine[] },
    timeline: TimelineSlot[],
    weekStart: string,
    weekEnd: string,
  ): Promise<WeeklySchedule | null> {
    const existing = await fetchScheduleByWeek(planId, weekStart)
    if (existing) return existing
    const items = generateItemsForWeek(
      { projects: plan.projects, routines: plan.routines },
      timeline,
      weekStart,
      weekEnd,
    )
    return await createSchedule(planId, weekStart, weekEnd, items)
  }

  // 첫 주 schedule 자동 생성 (진로계획 완성 직후 Result 페이지에서 호출).
  async function ensureFirstWeekSchedule(
    planId: string,
    plan: { startDate: string; reviewDay: DayOfWeek | ''; projects: Project[]; routines: Routine[] },
    timeline: TimelineSlot[],
  ): Promise<WeeklySchedule | null> {
    if (!plan.startDate || !plan.reviewDay) return null
    const range = computeFirstWeekRange(plan.startDate, plan.reviewDay)
    if (!range) return null
    return ensureWeekSchedule(planId, plan, timeline, range.weekStart, range.weekEnd)
  }

  return {
    schedules,
    fetchSchedules,
    fetchScheduleByWeek,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    itemsByDate,
    ensureWeekSchedule,
    ensureFirstWeekSchedule,
  }
}

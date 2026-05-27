import { ref, computed, watch } from 'vue'
import type { Project, Routine, DayOfWeek } from '@/modules/career-design/types/career-design'
import { getToday } from '@/shared/utils/dev-date'

const STORAGE_KEY = 'lh_achievement_v1'

type DailyCompletion = { projects: string[]; routines: string[] }
type CompletionMap = Record<string, DailyCompletion>   // key: 'YYYY-MM-DD'

function loadFromStorage(): CompletionMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const completion = ref<CompletionMap>(loadFromStorage())

watch(completion, (v) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)) } catch { /* quota */ }
}, { deep: true })

// ── 헬퍼 ───────────────────────────────────────────
const DOW: DayOfWeek[] = ['일', '월', '화', '수', '목', '금', '토']

function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function getDayOfWeek(d: Date): DayOfWeek {
  return DOW[d.getDay()]!
}

// timeline.month는 표시 형식이 다양함 ("2026년 3월" / "2026.03" / "2026-03")
// → (year, month) 파싱해서 비교
function parseMonthLabel(monthStr: string): { year: number; month: number } | null {
  if (!monthStr) return null
  // "2026년 3월"
  const kr = monthStr.match(/(\d+)\s*년\s*(\d+)\s*월/)
  if (kr) return { year: +kr[1]!, month: +kr[2]! }
  // "2026.03" / "2026.3"
  const dot = monthStr.match(/^(\d+)\.(\d+)/)
  if (dot) return { year: +dot[1]!, month: +dot[2]! }
  // "2026-03" (startDate/endDate 같은 ISO)
  const dash = monthStr.match(/^(\d+)-(\d+)/)
  if (dash) return { year: +dash[1]!, month: +dash[2]! }
  return null
}

function cmpYm(a: { year: number; month: number }, b: { year: number; month: number }): number {
  if (a.year !== b.year) return a.year - b.year
  return a.month - b.month
}

// 오늘이 startDate~endDate 사이인지 (월 단위), endDate 없으면 startDate만 체크
function isMonthInRange(today: Date, startDate: string, endDate: string): boolean {
  const start = parseMonthLabel(startDate)
  if (!start) return true
  const cur = { year: today.getFullYear(), month: today.getMonth() + 1 }
  if (cmpYm(cur, start) < 0) return false
  if (endDate) {
    const end = parseMonthLabel(endDate)
    if (end && cmpYm(cur, end) > 0) return false
  }
  return true
}

// 오늘의 월에 해당하는 timeline 슬롯의 projectIds 가져오기
function getProjectIdsInMonth(
  timeline: { month: string; projects: { id: string }[] }[],
  today: Date,
): Set<string> {
  const cur = { year: today.getFullYear(), month: today.getMonth() + 1 }
  for (const slot of timeline) {
    const parsed = parseMonthLabel(slot.month)
    if (parsed && parsed.year === cur.year && parsed.month === cur.month) {
      return new Set(slot.projects.map(p => p.id))
    }
  }
  return new Set()
}

export function useAchievement() {
  // ── 오늘 (dev date reactive) ──────────────────────
  const today = computed(() => getToday())
  const todayKey = computed(() => toDateKey(today.value))
  const todayDow = computed(() => getDayOfWeek(today.value))

  // ── 이번 주 (월~일) ───────────────────────────────
  const weekDates = computed<Date[]>(() => {
    const t = today.value
    const day = t.getDay()                           // 0(일) ~ 6(토)
    const monOffset = day === 0 ? -6 : 1 - day       // 월요일까지의 오프셋
    const mon = new Date(t)
    mon.setDate(t.getDate() + monOffset)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon)
      d.setDate(mon.getDate() + i)
      return d
    })
  })

  // ── 오늘 해당하는 routine/project 필터링 ──────────
  function todayRoutines(routines: Routine[]): Routine[] {
    return routines.filter(r => r.days.includes(todayDow.value))
  }

  function todayProjects(
    projects: Project[],
    timeline: { month: string; projects: { id: string }[] }[],
    startDate: string,
    endDate: string,
  ): Project[] {
    if (!isMonthInRange(today.value, startDate, endDate)) return []
    const idsInMonth = getProjectIdsInMonth(timeline, today.value)
    return projects.filter(p => idsInMonth.has(p.id) && p.days.includes(todayDow.value))
  }

  // 임의 날짜에 매칭되는 프로젝트 (todayProjects 일반화)
  function dateProjects(
    date: Date,
    projects: Project[],
    timeline: { month: string; projects: { id: string }[] }[],
    startDate: string,
    endDate: string,
  ): Project[] {
    if (!isMonthInRange(date, startDate, endDate)) return []
    const idsInMonth = getProjectIdsInMonth(timeline, date)
    const dow = getDayOfWeek(date)
    return projects.filter(p => idsInMonth.has(p.id) && p.days.includes(dow))
  }

  // ── 완료 상태 조회/토글 ───────────────────────────
  function getDay(dateKey: string): DailyCompletion {
    return completion.value[dateKey] ?? { projects: [], routines: [] }
  }

  function isProjectDone(projectId: string, dateKey?: string): boolean {
    return getDay(dateKey ?? todayKey.value).projects.includes(projectId)
  }

  function isRoutineDone(routineId: string, dateKey?: string): boolean {
    return getDay(dateKey ?? todayKey.value).routines.includes(routineId)
  }

  function toggleProject(projectId: string, dateKey?: string) {
    const key = dateKey ?? todayKey.value
    const day = getDay(key)
    const idx = day.projects.indexOf(projectId)
    if (idx >= 0) day.projects.splice(idx, 1)
    else day.projects.push(projectId)
    completion.value = { ...completion.value, [key]: { ...day } }
  }

  function toggleRoutine(routineId: string, dateKey?: string) {
    const key = dateKey ?? todayKey.value
    const day = getDay(key)
    const idx = day.routines.indexOf(routineId)
    if (idx >= 0) day.routines.splice(idx, 1)
    else day.routines.push(routineId)
    completion.value = { ...completion.value, [key]: { ...day } }
  }

  // ── 일별 예정/완료 수 ─────────────────────────────
  function plannedCount(
    date: Date,
    projects: Project[],
    routines: Routine[],
    timeline: { month: string; projects: { id: string }[] }[],
    startDate: string,
    endDate: string,
  ): number {
    const dow = getDayOfWeek(date)
    let count = routines.filter(r => r.days.includes(dow)).length
    if (isMonthInRange(date, startDate, endDate)) {
      const idsInMonth = getProjectIdsInMonth(timeline, date)
      count += projects.filter(p => idsInMonth.has(p.id) && p.days.includes(dow)).length
    }
    return count
  }

  function doneCount(date: Date): number {
    const day = getDay(toDateKey(date))
    return day.projects.length + day.routines.length
  }

  // ── 타임라인 월 진행도 (현재 월의 인덱스 / 전체 슬롯 수) ─
  function monthProgress(
    timeline: { month: string; projects: { id: string }[] }[],
  ): { current: number; total: number; monthLabel: string } | null {
    if (!timeline.length) return null
    const cur = { year: today.value.getFullYear(), month: today.value.getMonth() + 1 }
    const idx = timeline.findIndex(slot => {
      const p = parseMonthLabel(slot.month)
      return p && p.year === cur.year && p.month === cur.month
    })
    if (idx === -1) return null
    return { current: idx + 1, total: timeline.length, monthLabel: timeline[idx]!.month }
  }

  // ── 이번 주 진행률 ────────────────────────────────
  function weekProgress(
    projects: Project[],
    routines: Routine[],
    timeline: { month: string; projects: { id: string }[] }[],
    startDate: string,
    endDate: string,
  ) {
    let planned = 0
    let done = 0
    for (const d of weekDates.value) {
      planned += plannedCount(d, projects, routines, timeline, startDate, endDate)
      done    += doneCount(d)
    }
    return { planned, done, percent: planned ? Math.round(done / planned * 100) : 0 }
  }

  return {
    today,
    todayKey,
    todayDow,
    weekDates,
    todayRoutines,
    todayProjects,
    dateProjects,
    isProjectDone,
    isRoutineDone,
    toggleProject,
    toggleRoutine,
    plannedCount,
    doneCount,
    weekProgress,
    monthProgress,
    toDateKey,
    getDayOfWeek,
  }
}

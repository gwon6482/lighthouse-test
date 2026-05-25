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

// 'YYYY-MM' 비교 (start ≤ ymCheck ≤ end), endDate 비어있으면 start만 체크
function isMonthInRange(ymCheck: string, startDate: string, endDate: string): boolean {
  const start = startDate.slice(0, 7)
  if (!start) return true
  if (ymCheck < start) return false
  if (endDate) {
    const end = endDate.slice(0, 7)
    if (ymCheck > end) return false
  }
  return true
}

// 현재 월이 timeline의 어떤 month에도 포함되는지 + 그 month의 projectIds 가져오기
function getProjectIdsInMonth(timeline: { month: string; projects: { id: string }[] }[], ym: string): Set<string> {
  // timeline.month 포맷이 'YYYY.MM'이라는 점에 유의 — 'YYYY-MM' 입력을 변환
  const target = ym.replace('-', '.')
  for (const slot of timeline) {
    if (slot.month === target) {
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
  const todayYm = computed(() => todayKey.value.slice(0, 7))

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
    if (!isMonthInRange(todayYm.value, startDate, endDate)) return []
    const idsInMonth = getProjectIdsInMonth(timeline, todayYm.value)
    return projects.filter(p => idsInMonth.has(p.id) && p.days.includes(todayDow.value))
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
    const ym = toDateKey(date).slice(0, 7)
    let count = routines.filter(r => r.days.includes(dow)).length
    if (isMonthInRange(ym, startDate, endDate)) {
      const idsInMonth = getProjectIdsInMonth(timeline, ym)
      count += projects.filter(p => idsInMonth.has(p.id) && p.days.includes(dow)).length
    }
    return count
  }

  function doneCount(date: Date): number {
    const day = getDay(toDateKey(date))
    return day.projects.length + day.routines.length
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
    isProjectDone,
    isRoutineDone,
    toggleProject,
    toggleRoutine,
    plannedCount,
    doneCount,
    weekProgress,
    toDateKey,
    getDayOfWeek,
  }
}

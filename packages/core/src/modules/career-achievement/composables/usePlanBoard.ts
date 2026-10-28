// 진로달성 메인(2026-10-28 개편)의 데이터 — 활성 계획 + 완료 기록 + 주간 일정을 화면용으로 묶는다.
// 계산 규칙은 lib/planBoard.ts(테스트 있음). 예전 메인(CareerAchievementPage copy.vue)의 로직을 옮겨 왔다.
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAchievementStore } from '@/shared/stores/achievement'
import { useAuthStore } from '@/shared/stores/auth'
import { projectWeekIndexOn, weekOfDate, projectsActiveInWeek } from '@/modules/career-design/composables/usePlanTimeline'
import { weekEntriesOf } from '@/modules/career-design/composables/useProjectCurriculum'
import type { DayOfWeek, Project, Routine } from '@/modules/career-design/types/career-design'
import { useAchievement } from './useAchievement'
import { useCurriculumCompletion } from './useCurriculumCompletion'
import {
  useWeeklySchedule, computeWeekRangeContaining, generateItemsForWeek, parseDateKey, toDateKey,
  type WeeklySchedule, type WeeklyScheduleItem,
} from './useWeeklySchedule'
import {
  planPhase, planDayNumber, dDayLabel, overallProgress, streakCount, reviewBadge,
  todayMessage, journeyHeadline, categoryColor,
} from '../lib/planBoard'

export interface PreviewLine { name: string; color: string }
export interface DayPreview { key: string; dow: string; md: string; weekend: boolean; lines: PreviewLine[]; more: number; rest: boolean }
export interface WeekGoalBar { project: Project; weekIdx: number; total: number; done: number }

const DOW: DayOfWeek[] = ['일', '월', '화', '수', '목', '금', '토']
const ROUTINE_COLOR = '#9AA0A6'

export function usePlanBoard() {
  const router = useRouter()
  const store = useAchievementStore()
  const auth = useAuthStore()
  const ach = useAchievement()
  const { isItemDone, weekItemsDoneCount } = useCurriculumCompletion()
  const { ensureWeekSchedule, fetchSchedules } = useWeeklySchedule()

  const loading = ref(true)
  const schedules = ref<WeeklySchedule[]>([])

  const plan = computed(() => store.plan)
  const today = ach.today
  const todayKey = ach.todayKey

  const phase = computed(() => plan.value ? planPhase(plan.value.startDate, plan.value.endDate, today.value) : 'running')
  const dayNumber = computed(() => plan.value ? planDayNumber(plan.value.startDate, today.value) : null)
  const weekNumber = computed(() => plan.value ? weekOfDate(plan.value.startDate, today.value) : null)

  // ── 날짜별 항목: 그 주 일정(사용자가 조정했을 수 있다) 우선, 없으면 계획 배치로 만든다 ──
  function scheduleFor(key: string): WeeklySchedule | null {
    return schedules.value.find((s) => s.weekStart <= key && key <= s.weekEnd) ?? null
  }
  function itemsOn(date: Date): WeeklyScheduleItem[] {
    const p = plan.value
    if (!p) return []
    const key = toDateKey(date)
    const s = scheduleFor(key)
    if (s) return s.items.filter((it) => it.date === key)
    const range = computeWeekRangeContaining(date, p.startDate, (p.reviewDay || '월') as DayOfWeek)
    if (!range) return []
    return generateItemsForWeek(p, p.timeline, range.weekStart, range.weekEnd).filter((it) => it.date === key)
  }
  const projectOf = (id: string) => plan.value?.projects.find((x) => x.id === id)
  const routineOf = (id: string) => plan.value?.routines.find((x) => x.id === id)
  const itemDone = (it: WeeklyScheduleItem, key: string) =>
    it.itemType === 'project' ? ach.isProjectDone(it.itemId, key) : ach.isRoutineDone(it.itemId, key)

  // ── ④ 오늘 할 일 ──
  const todayItems = computed(() => itemsOn(today.value))
  const todayProjects = computed<Project[]>(() =>
    todayItems.value.filter((it) => it.itemType === 'project').map((it) => projectOf(it.itemId)).filter((x): x is Project => !!x))
  const todayRoutines = computed<Routine[]>(() =>
    todayItems.value.filter((it) => it.itemType === 'routine').map((it) => routineOf(it.itemId)).filter((x): x is Routine => !!x))
  const todayTotal = computed(() => todayProjects.value.length + todayRoutines.value.length)
  const todayDone = computed(() =>
    todayProjects.value.filter((p) => ach.isProjectDone(p.id)).length + todayRoutines.value.filter((r) => ach.isRoutineDone(r.id)).length)

  // 이번 주 커리큘럼에서 아직 안 한 첫 항목(없으면 목표)
  function todayFocus(p: Project): { text: string; allDone: boolean; weekIdx: number | null } {
    const pl = plan.value
    if (!pl) return { text: p.goal, allDone: false, weekIdx: null }
    const wIdx = projectWeekIndexOn(pl.timeline, pl.startDate, p.id, today.value)
    const cw = wIdx ? p.curriculum?.find((c) => c.week === wIdx) : undefined
    const entries = weekEntriesOf(cw)
    if (!cw || !entries.length) return { text: p.goal, allDone: false, weekIdx: wIdx }
    const i = entries.findIndex((_, idx) => !isItemDone(p.id, cw.week, idx))
    return i === -1 ? { text: '이번 주 항목을 모두 마쳤어요', allDone: true, weekIdx: wIdx } : { text: entries[i]!, allDone: false, weekIdx: wIdx }
  }
  function startProject(p: Project) {
    router.push({ path: `/career-achievement/start/project/${p.id}`, query: { date: todayKey.value } })
  }
  const toggleRoutine = (id: string) => ach.toggleRoutine(id)

  // ── ① 지표 ──
  const streak = computed(() => {
    const pl = plan.value
    if (!pl) return 0
    return streakCount(today.value, pl.startDate,
      (d) => itemsOn(d).length,
      (d) => { const k = toDateKey(d); return itemsOn(d).filter((it) => itemDone(it, k)).length })
  })
  const progress = computed(() => overallProgress(plan.value?.projects ?? [], isItemDone))
  const dDay = computed(() => plan.value ? dDayLabel(plan.value.endDate, today.value) : '-')

  // ── ② 인사 ──
  const userName = computed(() => auth.user?.name?.trim() || '')
  const headline = computed(() => journeyHeadline(plan.value?.targetJob ?? '', phase.value, dayNumber.value))
  const message = computed(() => todayMessage({
    phase: phase.value, startDate: plan.value?.startDate ?? '', total: todayTotal.value, done: todayDone.value,
  }))

  // ── ③ 앞으로 3일 미리 보기(체크 없음). 머리는 요일 + 날짜(사용자: '내일·모레·글피' 말고)
  const previews = computed<DayPreview[]>(() => {
    const pl = plan.value
    if (!pl) return []
    const end = parseDateKey(pl.endDate)
    const out: DayPreview[] = []
    ;[1, 2, 3].forEach((n) => {
      const d = new Date(today.value); d.setDate(d.getDate() + n)
      if (end && toDateKey(d) > pl.endDate) return // 계획 끝난 뒤는 카드를 줄인다
      const lines: PreviewLine[] = []
      for (const it of itemsOn(d)) {
        if (it.itemType === 'project') { const p = projectOf(it.itemId); if (p) lines.push({ name: p.name, color: categoryColor(p.category) }) }
        else { const r = routineOf(it.itemId); if (r) lines.push({ name: r.name, color: ROUTINE_COLOR }) }
      }
      out.push({
        key: toDateKey(d), dow: `${DOW[d.getDay()]}요일`, md: `${d.getMonth() + 1}/${d.getDate()}`, weekend: d.getDay() === 0 || d.getDay() === 6,
        lines: lines.slice(0, 3), more: Math.max(0, lines.length - 3), rest: lines.length === 0,
      })
    })
    return out
  })

  // ── ⑤ 이번 주 목표 — 이번 주에 배치된 프로젝트 모두 ──
  const weekGoals = computed<WeekGoalBar[]>(() => {
    const pl = plan.value
    const wk = weekNumber.value
    if (!pl || !wk || phase.value !== 'running') return []
    const out: WeekGoalBar[] = []
    for (const p of projectsActiveInWeek(pl.timeline, wk, pl.projects)) {
      const full = projectOf(p.id) ?? p
      const wIdx = projectWeekIndexOn(pl.timeline, pl.startDate, full.id, today.value)
      const cw = wIdx ? full.curriculum?.find((c) => c.week === wIdx) : undefined
      const n = weekEntriesOf(cw).length
      if (!cw || !n) continue
      out.push({ project: full, weekIdx: wIdx!, total: n, done: weekItemsDoneCount(full.id, cw.week, n) })
    }
    return out
  })
  const review = computed(() => plan.value ? reviewBadge(plan.value.reviewDay, today.value, phase.value) : null)

  async function load() {
    loading.value = true
    try {
      await store.loadActivePlan()
      const pl = store.plan
      if (pl?.planId && pl.startDate) {
        const range = computeWeekRangeContaining(today.value, pl.startDate, (pl.reviewDay || '월') as DayOfWeek)
        if (range) await ensureWeekSchedule(pl.planId, pl, pl.timeline, range.weekStart, range.weekEnd).catch(() => null)
        schedules.value = await fetchSchedules(pl.planId).catch(() => [])
      }
    } finally {
      loading.value = false
    }
  }

  return {
    loading, plan, phase, today, todayKey, load,
    streak, progress, dDay,
    userName, headline, message, todayTotal, todayDone,
    previews,
    todayProjects, todayRoutines, todayFocus, startProject, toggleRoutine,
    isProjectDone: ach.isProjectDone, isRoutineDone: ach.isRoutineDone,
    weekGoals, weekNumber, review,
  }
}

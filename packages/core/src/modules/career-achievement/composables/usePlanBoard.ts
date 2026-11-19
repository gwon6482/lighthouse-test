// 진로달성 메인(2026-10-28 개편)의 데이터 — 활성 계획 + 완료 기록 + 주간 일정을 화면용으로 묶는다.
// 계산 규칙은 lib/planBoard.ts(테스트 있음). 예전 메인(CareerAchievementPage copy.vue)의 로직을 옮겨 왔다.
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAchievementStore } from '@/shared/stores/achievement'
import { useAuthStore } from '@/shared/stores/auth'
import { projectWeekIndexOn, weekOfDate, projectsActiveInWeek, planWeekCount, weekDateRange } from '@/modules/career-design/composables/usePlanTimeline'
import { weekEntriesOf } from '@/modules/career-design/composables/useProjectCurriculum'
import type { DayOfWeek, Project, Routine } from '@/modules/career-design/types/career-design'
import { periodWeekInfo, type PeriodWeekInfo } from '@/modules/career-design/lib/period'
import { useAchievement } from './useAchievement'
import { useCurriculumCompletion } from './useCurriculumCompletion'
import {
  useWeeklySchedule, computeWeekRangeContaining, generateItemsForWeek, parseDateKey, toDateKey,
  type WeeklySchedule, type WeeklyScheduleItem,
} from './useWeeklySchedule'
import {
  planPhase, planDayNumber, dDayLabel, overallProgress, streakCount, reviewBadge,
  todayMessage, journeyHeadline, categoryColor, roadmapStops,
} from '../lib/planBoard'
import { useFocusSessions } from './useFocusSessions'
import { sessionKey, isAlive, type FocusSession } from '../lib/focusSession'

export interface PreviewLine { name: string; color: string }
export interface DayPreview { key: string; dow: string; md: string; weekend: boolean; lines: PreviewLine[]; more: number; rest: boolean }
// period: 과정(2026-11-16) — total·done 이 그 주에 다니는 날·완료한 날이다
export interface WeekGoalBar { project: Project; weekIdx: number; total: number; done: number; period?: boolean }

const DOW: DayOfWeek[] = ['일', '월', '화', '수', '목', '금', '토']
const ROUTINE_COLOR = '#9AA0A6'

export function usePlanBoard() {
  const router = useRouter()
  const store = useAchievementStore()
  const auth = useAuthStore()
  const ach = useAchievement()
  const { isItemDone, weekItemsDoneCount } = useCurriculumCompletion()
  const { ensureWeekSchedule, fetchSchedules } = useWeeklySchedule()
  const focus = useFocusSessions()

  const loading = ref(true)
  const schedules = ref<WeeklySchedule[]>([])

  const plan = computed(() => store.plan)
  const today = ach.today
  const todayKey = ach.todayKey

  const phase = computed(() => plan.value ? planPhase(plan.value.startDate, plan.value.endDate, today.value) : 'running')
  const dayNumber = computed(() => plan.value ? planDayNumber(plan.value.startDate, today.value) : null)
  const weekNumber = computed(() => plan.value ? weekOfDate(plan.value.startDate, today.value, plan.value.reviewDay) : null)

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
    const wIdx = projectWeekIndexOn(pl.timeline, pl.startDate, p.id, today.value, pl.reviewDay)
    const cw = wIdx ? p.curriculum?.find((c) => c.week === wIdx) : undefined
    const entries = weekEntriesOf(cw)
    if (!cw || !entries.length) return { text: p.goal, allDone: false, weekIdx: wIdx }
    const i = entries.findIndex((_, idx) => !isItemDone(p.id, cw.week, idx))
    return i === -1 ? { text: '이번 주 항목을 모두 마쳤어요', allDone: true, weekIdx: wIdx } : { text: entries[i]!, allDone: false, weekIdx: wIdx }
  }
  function startProject(p: Project) {
    if (p.period) { ach.toggleProject(p.id); return }   // 과정은 집중모드 없이 '완료' 한 번(2026-11-16)
    router.push({ path: `/career-achievement/start/project/${p.id}`, query: { date: todayKey.value } })
  }
  // ── 멈춘 집중(2026-11-19) — 그 기기에만. 오늘 목록의 그 프로젝트 줄은 '잠시 멈춤 · 이어 하기'로 ──
  function pausedFor(projectId: string): FocusSession | null {
    return focus.get(sessionKey(todayKey.value, 'project', projectId))
  }
  // 오늘 목록에 없는 멈춘 집중(어제 것, 일정을 다른 날로 옮긴 것) — '오늘 할 일' 위에 따로 한 장
  const heldSessions = computed<FocusSession[]>(() => {
    const pl = plan.value
    if (!pl) return []
    const todayIds = new Set(todayProjects.value.map((p) => p.id))
    return Object.values(focus.sessions.value)
      .filter((s) => {
        if ((s.planId && s.planId !== pl.planId) || !projectOf(s.itemId) || !isAlive(s, todayKey.value)) return false
        const done = ach.isProjectDone(s.itemId, s.date)
        if (done && !s.afterDone) return false // 다른 기기에서 완료 — 정리에서 지운다
        // 오늘 목록의 아직 안 한 줄은 그 자리에 '잠시 멈춤'으로 나온다. 완료한 줄(다시 집중)은 여기 한 장으로(2026-11-19 QA)
        return !(s.date === todayKey.value && todayIds.has(s.itemId) && !done)
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.updatedAt - b.updatedAt)
  })
  function resumeFocus(s: FocusSession) {
    router.push({ path: `/career-achievement/start/project/${s.itemId}`, query: { date: s.date } })
  }
  const toggleRoutine = (id: string) => ach.toggleRoutine(id)
  // 과정(2026-11-16) — 다니는 날 '완료' 한 번(루틴처럼). 하루 완료 기록은 프로젝트와 같은 자리에 남는다
  const toggleProject = (id: string) => ach.toggleProject(id)
  // 과정의 오늘 표시 — '근무 · 6/12주'. 쉬는 주면 pause
  function periodToday(p: Project): PeriodWeekInfo | null {
    const pl = plan.value
    if (!pl) return null
    const wIdx = projectWeekIndexOn(pl.timeline, pl.startDate, p.id, today.value, pl.reviewDay)
    return wIdx ? periodWeekInfo(p, wIdx) : null
  }

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
    const range = weekDateRange(pl.startDate, wk, pl.reviewDay)
    for (const p of projectsActiveInWeek(pl.timeline, wk, pl.projects)) {
      const full = projectOf(p.id) ?? p
      const wIdx = projectWeekIndexOn(pl.timeline, pl.startDate, full.id, today.value, pl.reviewDay)
      // 과정 — 그 주에 다니는 날 중 '완료'한 날(쉬는 주면 다니는 날이 없어 빠진다)
      if (full.period) {
        if (!range || !wIdx) continue
        let total = 0
        let done = 0
        const d = parseDateKey(range.start)!
        for (let i = 0; i < 14 && toDateKey(d) <= range.end; i += 1) {
          const key = toDateKey(d)
          if (itemsOn(d).some((it) => it.itemType === 'project' && it.itemId === full.id)) {
            total += 1
            if (ach.isProjectDone(full.id, key)) done += 1
          }
          d.setDate(d.getDate() + 1)
        }
        if (total) out.push({ project: full, weekIdx: wIdx, total, done, period: true })
        continue
      }
      const cw = wIdx ? full.curriculum?.find((c) => c.week === wIdx) : undefined
      const n = weekEntriesOf(cw).length
      if (!cw || !n) continue
      out.push({ project: full, weekIdx: wIdx!, total: n, done: weekItemsDoneCount(full.id, cw.week, n) })
    }
    return out
  })
  const review = computed(() => plan.value ? reviewBadge(plan.value.startDate, plan.value.reviewDay, today.value, phase.value) : null)

  // ── 로드맵 — 계획 전체를 프로젝트 정거장으로 ──
  const totalWeeks = computed(() => plan.value ? planWeekCount(plan.value.startDate, plan.value.endDate, plan.value.reviewDay) : 0)
  const roadmap = computed(() => {
    const pl = plan.value
    if (!pl) return []
    const cur = phase.value === 'before' ? 0 : phase.value === 'finished' ? Number.MAX_SAFE_INTEGER : weekNumber.value
    return roadmapStops(pl.projects, pl.timeline, cur, isItemDone)
  })
  // 'M/D' — 계획 n주차의 월요일·일요일
  function weekSpanLabel(fromWeek: number, toWeek: number): string {
    const pl = plan.value
    const a = pl && weekDateRange(pl.startDate, fromWeek, pl.reviewDay)
    const b = pl && weekDateRange(pl.startDate, toWeek, pl.reviewDay)
    if (!a || !b) return ''
    const md = (k: string) => { const d = parseDateKey(k)!; return `${d.getMonth() + 1}/${d.getDate()}` }
    return `${md(a.start)}~${md(b.end)}`
  }

  async function load() {
    loading.value = true
    try {
      await store.loadActivePlan()
      const pl = store.plan
      // 앱이 꺼졌다 켜짐 — 흐르던 집중은 지금까지 세고 멈춤으로(정할 것 6)
      focus.settleAll(Date.now())
      // ⚠️ 정리(지우기)는 계획을 제대로 불러온 경우에만. 연결이 안 되면 계획이 null 이라 여기서 지우면 오프라인에서 사라진다
      if (pl?.planId) {
        focus.prune({
          planId: pl.planId,
          projectIds: new Set(pl.projects.map((p) => p.id)),
          isDone: (date, id) => ach.isProjectDone(id, date),
          todayKey: todayKey.value,
        })
      }
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
    todayProjects, todayRoutines, todayFocus, startProject, toggleRoutine, toggleProject, periodToday,
    pausedFor, heldSessions, resumeFocus,
    isProjectDone: ach.isProjectDone, isRoutineDone: ach.isRoutineDone,
    weekGoals, weekNumber, review,
    totalWeeks, roadmap, weekSpanLabel,
    // 주간결산이 쓴다 — 날짜별 항목·완료 판정
    itemsOn, itemDone, projectOf, routineOf, isItemDone,
  }
}

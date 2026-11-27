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
import { sessionKey, isAlive, freeSessionOf, type FocusSession } from '../lib/focusSession'
import { useAchievementEntries } from './useAchievementEntries'
import { req } from '@/shared/api'
import { attachedEnded, keepVersion, measureOf, recordOfWeek, type WeekCount } from '@/modules/career-design/lib/routine'
import type { RoutineRecord } from '@/modules/career-design/types/career-design'
import { homePullAhead, type AheadCandidate } from '../lib/pullAhead'
import { lastCheckedIndex, moveAheadBack } from '../lib/undoDone'

export interface PreviewLine { name: string; color: string }
export interface DayPreview { key: string; dow: string; md: string; weekend: boolean; lines: PreviewLine[]; more: number; rest: boolean }
// period: 과정(2026-11-16) — total·done 이 그 주에 다니는 날·완료한 날이다
export interface WeekGoalBar { project: Project; weekIdx: number; total: number; done: number; period?: boolean }

const DOW: DayOfWeek[] = ['일', '월', '화', '수', '목', '금', '토']
// 루틴 색은 하나(2026-11-21 루틴 리뉴얼 — 홈은 파랑, 미리 보기·결산은 회색이던 것을 맞췄다). 아이콘은 ui-repeat
export const ROUTINE_COLOR = '#3B6FD8'
export const ROUTINE_TINT = '#E6F0FF'

export function usePlanBoard() {
  const router = useRouter()
  const store = useAchievementStore()
  const auth = useAuthStore()
  const ach = useAchievement()
  const { isItemDone, weekItemsDoneCount } = useCurriculumCompletion()
  const { ensureWeekSchedule, fetchSchedules, retryAhead } = useWeeklySchedule()
  const focus = useFocusSessions()
  const entriesStore = useAchievementEntries()

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
  // ── 루틴 집중(2026-11-26 #95) — 집중모드를 켠 루틴(1회 시간이 있는 것)만 '시작'. 과정·0분 루틴은 '완료' 한 번 ──
  const routineFocusable = (r: Routine) => r.focus === true && Number(r.duration) > 0
  function startRoutine(r: Routine) {
    router.push({ path: `/career-achievement/start/routine/${r.id}`, query: { date: todayKey.value } })
  }
  /** 그날 집중으로 남긴 루틴인가(기록 화면에서 저장 — 시간·사진·글이 있다). '완료'만 누른 루틴은 기록이 없다 */
  const routineRecorded = (routineId: string, dateKey?: string) => !!entriesStore.getEntry(dateKey ?? todayKey.value, 'routine', routineId)

  // ── 바로 집중(2026-11-26 #96) — 할 일을 고르지 않고. 한 번에 하나(멈춘 것이 있으면 그것을 이어 한다) ──
  const freeSession = computed<FocusSession | null>(() => {
    const pl = plan.value
    return pl ? freeSessionOf(focus.sessions.value, pl.planId, todayKey.value) : null
  })
  function startFree() {
    const s = freeSession.value
    if (s) return resumeFocus(s)
    router.push({ path: '/career-achievement/start/free/new', query: { date: todayKey.value } })
  }
  /** 오늘 남긴 바로 집중 — '오늘 할 일' 카드 안의 회색 줄(오늘 할 일 수·링에는 넣지 않는다) */
  const todayFree = computed(() => {
    void entriesStore.entries.value
    return entriesStore.feedSorted().filter((e) => e.itemType === 'free' && e.date === todayKey.value).reverse()
  })

  // ── 멈춘 집중(2026-11-19) — 그 기기에만. 오늘 목록의 그 프로젝트 줄은 '잠시 멈춤 · 이어 하기'로 ──
  function pausedFor(projectId: string, itemType: 'project' | 'routine' = 'project'): FocusSession | null {
    return focus.get(sessionKey(todayKey.value, itemType, projectId))
  }
  // 오늘 목록에 없는 멈춘 집중(어제 것, 일정을 다른 날로 옮긴 것) — '오늘 할 일' 위에 따로 한 장.
  // 루틴(2026-11-26)도 같다. 바로 집중은 여기 말고 '바로 집중하기' 자리에 나온다
  const heldSessions = computed<FocusSession[]>(() => {
    const pl = plan.value
    if (!pl) return []
    const todayIds = new Set([...todayProjects.value.map((p) => 'p' + p.id), ...todayRoutines.value.map((r) => 'r' + r.id)])
    return Object.values(focus.sessions.value)
      .filter((s) => {
        if (s.itemType === 'free') return false
        const isRoutine = s.itemType === 'routine'
        if ((s.planId && s.planId !== pl.planId) || !(isRoutine ? routineOf(s.itemId) : projectOf(s.itemId)) || !isAlive(s, todayKey.value)) return false
        const done = isRoutine ? ach.isRoutineDone(s.itemId, s.date) : ach.isProjectDone(s.itemId, s.date)
        if (done && !s.afterDone) return false // 다른 기기에서 완료 — 정리에서 지운다
        // 오늘 목록의 아직 안 한 줄은 그 자리에 '잠시 멈춤'으로 나온다. 완료한 줄(다시 집중)은 여기 한 장으로(2026-11-19 QA)
        return !(s.date === todayKey.value && todayIds.has((isRoutine ? 'r' : 'p') + s.itemId) && !done)
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.updatedAt - b.updatedAt)
  })
  function resumeFocus(s: FocusSession) {
    router.push({ path: `/career-achievement/start/${s.itemType}/${s.itemId}`, query: { date: s.date } })
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

  // ── 미리 하기(2026-11-23, 11-24 넓힘) — 오늘 할 일을 모두 끝냈을 때(쉬어 가는 날 포함), 이번 주 뒤 요일의 진도 프로젝트 칸(lib/pullAhead.ts) ──
  // 미리 한 칸도 저장할 때 끝낸 채로 오늘에 오므로, 하나를 미리 한 뒤에도 남은 후보가 계속 나온다
  function hasUndoneThisWeek(projectId: string): boolean {
    const pl = plan.value
    const p = projectOf(projectId)
    if (!pl || !p) return false
    const wIdx = projectWeekIndexOn(pl.timeline, pl.startDate, p.id, today.value, pl.reviewDay)
    const cw = wIdx ? p.curriculum?.find((c) => c.week === wIdx) : undefined
    const n = weekEntriesOf(cw).length
    return !!cw && n > 0 && weekItemsDoneCount(p.id, cw.week, n) < n
  }
  const pullAhead = computed<(AheadCandidate & { project: Project; dow: string; text: string })[]>(() => {
    const pl = plan.value
    if (!pl) return []
    const range = computeWeekRangeContaining(today.value, pl.startDate, (pl.reviewDay || '월') as DayOfWeek)
    return homePullAhead({
      running: phase.value === 'running', today: today.value, todayKey: todayKey.value, weekEnd: range?.weekEnd ?? null,
      itemsOn, sessions: Object.values(focus.sessions.value), projectOf,
      isDone: (id, date) => ach.isProjectDone(id, date), hasUndoneThisWeek,
      // 오늘 할 일 수(todayTotal)와 같은 칸만 센다 — 계획에서 빠진 칸은 끝낸 것으로 넘긴다
      todayItemDone: (it) => !(it.itemType === 'project' ? projectOf(it.itemId) : routineOf(it.itemId))
        || itemDone(it as WeeklyScheduleItem, todayKey.value),
    }).flatMap((c) => {
      const p = projectOf(c.projectId)
      if (!p) return []
      const day = parseDateKey(c.date)!
      return [{ ...c, project: p, dow: `${DOW[day.getDay()]}요일`, text: todayFocus(p).text }]
    })
  })
  function startAhead(c: AheadCandidate) {
    router.push({ path: `/career-achievement/start/project/${c.projectId}`, query: { date: todayKey.value, from: c.date } })
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
    return roadmapStops(pl.projects, pl.timeline, cur, isItemDone, phase.value === 'running' ? todayKey.value : '')
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

  // ── 루틴(2026-11-21 루틴 리뉴얼) ──
  /** 그 루틴의 한 주 — 나온 날 수와 완료한 날 수('이번 주 3번 중 1번') */
  function routineWeekCount(routineId: string, week: number | null): WeekCount {
    const pl = plan.value
    const r = pl && week ? weekDateRange(pl.startDate, week, pl.reviewDay) : null
    if (!r) return { planned: 0, done: 0 }
    let planned = 0
    let done = 0
    const d = parseDateKey(r.start)!
    for (let i = 0; i < 14 && toDateKey(d) <= r.end; i += 1) {
      const key = toDateKey(d)
      if (itemsOn(d).some((it) => it.itemType === 'routine' && it.itemId === routineId)) {
        planned += 1
        if (ach.isRoutineDone(routineId, key)) done += 1
      }
      d.setDate(d.getDate() + 1)
    }
    return { planned, done }
  }
  /** 이번 주 기록을 재는 루틴 — 기준 넘기·실력 올리기에 기록 항목이 있고 이번 주에 나오는 것 */
  const measureDue = computed(() => {
    const pl = plan.value
    const wk = weekNumber.value
    if (!pl || !wk || phase.value !== 'running') return []
    return pl.routines.filter((r) => measureOf(r) && routineWeekCount(r.id, wk).planned > 0).map((r) => ({
      routine: r,
      measure: measureOf(r)!,
      project: r.projectId ? projectOf(r.projectId) ?? null : null,
      record: recordOfWeek(r, wk),
      prev: [...(r.records ?? [])].filter((x) => x.week < wk && (x.value !== null || measureOf(r)!.unit === 'media')).sort((a, b) => b.week - a.week)[0] ?? null,
    }))
  })
  /** 이번 주 기록 저장 — 계획 주차가 열쇠. 화면에는 바로 반영하고 서버에 보낸다 */
  async function saveRecord(routineId: string, value: number | null, total?: number): Promise<boolean> {
    const pl = plan.value
    const wk = weekNumber.value
    const r = pl?.routines.find((x) => x.id === routineId)
    if (!pl || !wk || !r) return false
    const rec: RoutineRecord = { week: wk, date: todayKey.value, value, ...(total ? { total } : {}) }
    try {
      await req.put(`/api/career-plan/${pl.planId}/routines/${routineId}/records/${wk}`, { date: rec.date, value, ...(total ? { total } : {}) })
      r.records = [...(r.records ?? []).filter((x) => x.week !== wk), rec].sort((a, b) => a.week - b.week)
      return true
    } catch {
      return false
    }
  }
  /** 붙은 프로젝트가 끝난 루틴 — 한 번만 묻는다(이 기기). 고르지 않고 닫아도 다시 묻지 않는다(그 루틴은 이미 일정에 안 나온다) */
  const ASKED_KEY = 'lh_routine_end_asked'
  const asked = ref<string[]>((() => { try { return JSON.parse(localStorage.getItem(ASKED_KEY) || '[]') } catch { return [] } })())
  const endedRoutines = computed(() => {
    const pl = plan.value
    const wk = weekNumber.value
    if (!pl || !wk) return []
    return pl.routines
      .map((r) => ({ routine: r, project: attachedEnded(r, pl.projects, pl.timeline, wk, todayKey.value) }))
      .filter((x): x is { routine: Routine; project: Project } => !!x.project && !asked.value.includes(x.routine.id))
  })
  function markAsked(routineId: string) {
    asked.value = [...asked.value, routineId]
    try { localStorage.setItem(ASKED_KEY, JSON.stringify(asked.value.slice(-50))) } catch { /* 저장 못 해도 이번엔 닫힌다 */ }
  }
  /** 감 유지로 바꾸기 / 끝내기 */
  async function decideEnded(routineId: string, choice: 'keep' | 'end'): Promise<boolean> {
    const pl = plan.value
    const r = pl?.routines.find((x) => x.id === routineId)
    if (!pl || !r) return false
    const body = choice === 'keep'
      ? (() => { const k = keepVersion(r); return { kind: 'keep', projectId: '', measure: null, days: k.days, duration: k.duration } })()
      : { endedAt: todayKey.value }
    try {
      await req.put(`/api/career-plan/${pl.planId}/routines/${routineId}`, body)
      markAsked(routineId)
      await store.loadActivePlan(true)
      schedules.value = await fetchSchedules(pl.planId).catch(() => [])
      return true
    } catch {
      return false
    }
  }

  // ── 끝낸 줄(#101, 2026-11-26 — lib/undoDone.ts) ──
  const entries = entriesStore
  const { toggleItem } = useCurriculumCompletion()
  const { updateSchedule } = useWeeklySchedule()
  /** 오늘 그 일의 기록(시간·사진·메모). 없으면 null */
  const recordOf = (itemType: 'project' | 'routine', id: string) => entries.getEntry(todayKey.value, itemType, id)
  /**
   * 완료 취소 때 풀 할 일 칸 — 그 주에 체크된 마지막 칸. 그 주에 끝낸 날 수가 체크 수보다 많으면(할 일을 다 채운 뒤에 끝낸 날)
   * 오늘 완료가 칸을 체크하지 않았으므로 풀지 않는다
   */
  function undoTick(projectId: string): { week: number; idx: number } | null {
    const pl = plan.value
    const p = projectOf(projectId)
    const wk = weekNumber.value
    if (!pl || !p || p.period || !wk) return null
    const wIdx = projectWeekIndexOn(pl.timeline, pl.startDate, p.id, today.value, pl.reviewDay)
    const cw = wIdx ? p.curriculum?.find((c) => c.week === wIdx) : undefined
    const n = weekEntriesOf(cw).length
    if (!cw || !n) return null
    const idx = lastCheckedIndex(n, (i) => isItemDone(p.id, cw.week, i))
    if (idx < 0) return null
    const range = weekDateRange(pl.startDate, wk, pl.reviewDay)
    let doneDays = 0
    if (range) {
      const d = parseDateKey(range.start)!
      for (let i = 0; i < 14 && toDateKey(d) <= range.end; i += 1) {
        if (ach.isProjectDone(p.id, toDateKey(d))) doneDays += 1
        d.setDate(d.getDate() + 1)
      }
    }
    if (weekItemsDoneCount(p.id, cw.week, n) < doneDays) return null
    return { week: cw.week, idx }
  }
  /** 완료 취소 확인 판의 숫자 — 지금 → 되돌린 뒤(오늘 할 일·연속 달성·이번 주 목표·전체 진행) */
  function undoPreview(projectId: string) {
    const pl = plan.value
    const tick = undoTick(projectId)
    const doneToday = ach.isProjectDone(projectId)
    const without = (pid: string, w: number, i: number) => !(tick && pid === projectId && w === tick.week && i === tick.idx) && isItemDone(pid, w, i)
    const streakAfter = pl
      ? streakCount(today.value, pl.startDate,
        (d) => itemsOn(d).length,
        (d) => { const k = toDateKey(d); return itemsOn(d).filter((it) => itemDone(it, k) && !(k === todayKey.value && it.itemType === 'project' && it.itemId === projectId)).length })
      : 0
    const g = weekGoals.value.find((x) => x.project.id === projectId && !x.period)
    return {
      today: { before: todayDone.value, after: todayDone.value - (doneToday ? 1 : 0), total: todayTotal.value },
      streak: { before: streak.value, after: streakAfter },
      goal: g && tick ? { name: g.project.name, before: g.done, after: g.done - 1, total: g.total } : null,
      progress: { before: progress.value.percent, after: overallProgress(pl?.projects ?? [], without).percent, shown: progress.value.done > 0 },
    }
  }
  /**
   * 완료 취소 — 기록을 지우고(서버 DELETE, 지금 동작 그대로) 그 주 할 일 체크 한 칸을 되돌린다.
   * 미리 하기로 당겨 온 칸은 원래 요일이 아직 안 지났으면 그 요일로 돌려놓는다
   */
  /** 기록이 있는 루틴(집중으로 끝냄)의 완료 취소 — 서버 기록은 완료 표시를 끄며 지우고, 기기의 사본도 지운다(로그·'기록 있음' 표시가 남지 않게) */
  function undoRoutine(routineId: string): void {
    if (!ach.isRoutineDone(routineId)) return
    ach.toggleRoutine(routineId)
    entries.dropLocal(todayKey.value, 'routine', routineId)
  }
  async function undoProject(projectId: string): Promise<void> {
    const pl = plan.value
    if (!pl || !ach.isProjectDone(projectId)) return
    const tick = undoTick(projectId)
    ach.toggleProject(projectId)
    entries.dropLocal(todayKey.value, 'project', projectId)
    if (tick) toggleItem(projectId, tick.week, tick.idx)
    const s = scheduleFor(todayKey.value)
    const back = s ? moveAheadBack(s.items, { itemId: projectId, today: todayKey.value, weekEnd: s.weekEnd }) : null
    if (s && back) {
      const saved = await updateSchedule(pl.planId, s.weekStart, { items: back.items })
      if (saved) schedules.value = schedules.value.map((x) => (x.weekStart === s.weekStart ? saved : x))
    }
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
          routineIds: new Set(pl.routines.map((r) => r.id)),
          isDone: (date, id, type) => (type === 'routine' ? ach.isRoutineDone(id, date) : ach.isProjectDone(id, date)),
          todayKey: todayKey.value,
        })
      }
      if (pl?.planId && pl.startDate) {
        const range = computeWeekRangeContaining(today.value, pl.startDate, (pl.reviewDay || '월') as DayOfWeek)
        if (range) await ensureWeekSchedule(pl.planId, pl, pl.timeline, range.weekStart, range.weekEnd).catch(() => null)
        // 미리 하기 옮기기가 실패해 기기에 적어 둔 것 — 다시 시도한다(2026-11-23 코드 검토 1)
        await retryAhead(pl.planId, pl, pl.timeline, { todayKey: todayKey.value, isDone: (id, d) => ach.isProjectDone(id, d) }).catch(() => false)
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
    // 집중모드 넓히기(2026-11-26)
    routineFocusable, startRoutine, routineRecorded, freeSession, startFree, todayFree, routineOf,
    pullAhead, startAhead,
    isProjectDone: ach.isProjectDone, isRoutineDone: ach.isRoutineDone,
    weekGoals, weekNumber, review,
    totalWeeks, roadmap, weekSpanLabel,
    // 주간결산이 쓴다 — 날짜별 항목·완료 판정
    itemsOn, itemDone, projectOf, isItemDone,
    // 루틴(2026-11-21)
    routineWeekCount, measureDue, saveRecord, endedRoutines, markAsked, decideEnded,
    // 끝낸 줄(#101)
    recordOf, undoPreview, undoProject, undoRoutine,
  }
}

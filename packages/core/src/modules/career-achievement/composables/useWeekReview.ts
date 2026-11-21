// 주간결산(2026-10-30 시안) — 5단계 화면이 같이 쓰는 데이터.
// 결산 대상 주 = 시작 요일이 오늘이면 어제까지의 한 주, 아니면 오늘이 든 주(시작 요일 전날 결산).
// ⚠️ 시안: 평가·템포 변경은 아직 저장하지 않는다(4단계 API 작업 때). 단계를 오가도 값이 남게 모듈 상태로 둔다.
import { computed, reactive, ref, watch } from 'vue'
import { usePlanBoard } from './usePlanBoard'
import { useAchievementEntries } from './useAchievementEntries'
import { computeWeekRangeContaining, parseDateKey, toDateKey } from './useWeeklySchedule'
import { weekOfDate, projectStartWeek, planWeekCount, weekDateRange, duringOwners } from '@/modules/career-design/composables/usePlanTimeline'
import { weekEntriesOf } from '@/modules/career-design/composables/useProjectCurriculum'
import { PACES, paceOfHours, paceByKey, rescheduleFrom, examAgeOptions, DEFAULT_PACE_HOURS, type Pace } from '@/modules/career-design/composables/usePlanPace'
import { applyPeriodChange, periodWeekInfo, type PeriodChange, type PeriodWeekInfo } from '@/modules/career-design/lib/period'
import { req } from '@/shared/api'
import { useAchievementStore } from '@/shared/stores/achievement'
import { fetchWeeklyReview, putWeeklyReview, type WeeklyReviewDto } from '../achievement.api'
import { reviewState } from './useReviewState'
import { categoryColor } from '../lib/planBoard'
import type { DayOfWeek, Project, Routine, TimelineSlot } from '@/modules/career-design/types/career-design'
import { budgetHours, measureOf, measureTrend, shortened, stripLoad, twoWeeksLow, withRoutineLoad, type WeekCount } from '@/modules/career-design/lib/routine'
import { ROUTINE_COLOR } from './usePlanBoard'
import { allItemsDone, examAfterChange, examDateOf, type ExamSlot } from '@/modules/career-design/lib/examDate'
import { useCurriculumCompletion } from './useCurriculumCompletion'
import { useAuthStore } from '@/shared/stores/auth'

const DOW = ['일', '월', '화', '수', '목', '금', '토']

// 단계 사이에 남는 입력(시안 — 저장 전)
export const reviewDraft = reactive({
  satisfaction: 0 as 0 | 1 | 2 | 3 | 4 | 5,
  note: '',
  pledge: '',
  feel: '' as '' | 'tight' | 'fit' | 'loose', // 이번 주 속도 느낌
  paceKey: '' as string,                       // 다음 주부터 쓸 속도
})

// 과정(2026-11-16, 정할 것 1번) — 결산 3단계의 과정 카드마다 점검·일정 입력. 단계를 오가도 남게 모듈 상태
export type PeriodKind = PeriodChange['kind']
export interface PeriodDraft { checked: string[]; changed: boolean; kind: PeriodKind | ''; endDelta: number; pauseWeeks: number; days: DayOfWeek[] }
export const periodDrafts = reactive<Record<string, PeriodDraft>>({})
/** 그 과정의 결산 입력(없으면 만든다) — 반응형 객체를 돌려준다(카드가 바로 고친다) */
export function periodDraftOf(p: Project): PeriodDraft {
  if (!periodDrafts[p.id]) periodDrafts[p.id] = { checked: [], changed: false, kind: '', endDelta: 0, pauseWeeks: 2, days: [...p.days] }
  return periodDrafts[p.id]!
}
// 시험 뒤 첫 결산(2026-11-22 시험일 역산 정할 것 9 · 진로상담) — 결과를 기다려요(그대로, 다음 주에 다시 묻기) / 다음 시험 날짜 넣기 / 이 시험은 끝났어요(시험 날 표시만 지움).
// 합격 여부는 묻지 않고, 걸음을 완료 처리하지 않는다
export interface ExamAfterDraft { kind: '' | 'wait' | 'next' | 'done'; date: string }
export const examAfterDrafts = reactive<Record<string, ExamAfterDraft>>({})
export function examAfterDraftOf(id: string): ExamAfterDraft {
  if (!examAfterDrafts[id]) examAfterDrafts[id] = { kind: '', date: '' }
  return examAfterDrafts[id]!
}
// 루틴(2026-11-21 루틴 리뉴얼 정할 것 6) — 2주 연속 절반 미만이면 맞춰 보기. 고른 것은 결산을 마칠 때 적용
export type RoutineAdjust = '' | 'shorter' | 'days' | 'pause' | 'stop'
export interface RoutineDraft { kind: RoutineAdjust; days: DayOfWeek[] }
export const routineDrafts = reactive<Record<string, RoutineDraft>>({})
export function routineDraftOf(r: Routine): RoutineDraft {
  if (!routineDrafts[r.id]) routineDrafts[r.id] = { kind: '', days: [...(r.days ?? [])] }
  return routineDrafts[r.id]!
}
export interface RoutineCard {
  routine: Routine
  cur: WeekCount
  low: boolean                                  // 2주 연속 절반 미만
  trend: ReturnType<typeof measureTrend> | null // 주 1회 기록 추이(기준 넘기·실력 올리기)
  shorter: number                               // '시간 줄이기'로 바뀔 1회 시간
}

export interface PeriodCard {
  project: Project
  idx: number                 // 결산하는 주가 그 과정의 몇 주째인지(1부터)
  info: PeriodWeekInfo | null // '근무 6/12주'
  checks: string[]            // 이번 주 점검(지난주에 못 한 것 포함)
  carried: number             // 그 가운데 지난주에서 넘어온 것
  startWeek: number
  endWeek: number             // 지금 일정으로 끝나는 계획 주차
}

export function useWeekReview() {
  const board = usePlanBoard()
  const { feedSorted, entries } = useAchievementEntries()
  const { plan, today } = board
  const { isItemDone } = useCurriculumCompletion()
  const auth = useAuthStore()

  const startDow = computed(() => (plan.value?.reviewDay || '월') as DayOfWeek)

  // 결산 대상 주
  const range = computed(() => {
    const pl = plan.value
    if (!pl) return null
    const t = new Date(today.value)
    // 리뷰일(2주차 이상의 첫날)이면 지난주를 결산한다
    const cur = computeWeekRangeContaining(t, pl.startDate, startDow.value)
    if (cur && cur.weekStart === toDateKey(t) && (weekOfDate(pl.startDate, t, pl.reviewDay) ?? 0) >= 2) t.setDate(t.getDate() - 1)
    return computeWeekRangeContaining(t, pl.startDate, startDow.value)
  })
  const weekNo = computed(() => {
    const pl = plan.value; const r = range.value
    return pl && r ? weekOfDate(pl.startDate, parseDateKey(r.weekStart)!, pl.reviewDay) : null
  })
  const fmt = (k: string) => { const d = parseDateKey(k)!; return `${d.getMonth() + 1}/${d.getDate()}(${DOW[d.getDay()]})` }
  const rangeLabel = computed(() => (range.value ? `${fmt(range.value.weekStart)} ~ ${fmt(range.value.weekEnd)}` : ''))

  // ── 1. 이번 주 성과 ──
  const days = computed(() => {
    const r = range.value
    if (!r) return []
    const out: { key: string; dow: string; date: number; planned: number; done: number; state: 'all' | 'part' | 'none' | 'rest' | 'before' }[] = []
    const d = parseDateKey(r.weekStart)!
    for (let i = 0; toDateKey(d) <= r.weekEnd && i < 14; i++) { // 1주차는 7~13일
      const key = toDateKey(d)
      const items = board.itemsOn(d)
      const done = items.filter((it) => board.itemDone(it, key)).length
      const before = !!plan.value && key < plan.value.startDate
      out.push({
        key, dow: DOW[d.getDay()]!, date: d.getDate(), planned: items.length, done,
        state: before ? 'before' : !items.length ? 'rest' : done >= items.length ? 'all' : done ? 'part' : 'none',
      })
      d.setDate(d.getDate() + 1)
    }
    return out
  })
  const planned = computed(() => days.value.reduce((n, x) => n + x.planned, 0))
  const done = computed(() => days.value.reduce((n, x) => n + x.done, 0))
  const percent = computed(() => (planned.value ? Math.round((done.value / planned.value) * 100) : 0))
  const fullDays = computed(() => days.value.filter((x) => x.state === 'all').length)
  const workDays = computed(() => days.value.filter((x) => x.planned > 0).length)
  const weekEntries = computed(() => {
    void entries.value
    const r = range.value
    return r ? feedSorted().filter((e) => e.itemType === 'project' && e.date >= r.weekStart && e.date <= r.weekEnd) : []
  })
  const minutes = computed(() => Math.round(weekEntries.value.reduce((n, e) => n + (e.elapsedSec ? e.elapsedSec / 60 : e.duration), 0)))
  const photos = computed(() => weekEntries.value.filter((e) => e.photoUrl).length)
  const headline = computed(() => {
    const p = percent.value
    if (!planned.value) return '쉬어 간 한 주였어요'
    if (p >= 90) return '완벽에 가까운 한 주였어요!'
    if (p >= 70) return '꾸준히 잘 해냈어요'
    if (p >= 40) return '바쁜 중에도 이어 갔어요'
    return '다음 주에 다시 시작해요'
  })

  // ── 2. 전체 계획에서의 성장 ──
  const progress = board.progress
  const weekGain = computed(() => {
    const pl = plan.value; const wk = weekNo.value
    if (!pl || !wk) return { items: [] as { project: string; color: string; text: string }[], count: 0 }
    const items: { project: string; color: string; text: string }[] = []
    for (const p of pl.projects) {
      const sw = projectStartWeek(pl.timeline, p.id)
      if (sw === null) continue
      const cw = p.curriculum?.find((c) => sw + c.week - 1 === wk)
      if (!cw) continue
      weekEntriesOf(cw).forEach((text, i) => { if (board.isItemDone(p.id, cw.week, i)) items.push({ project: p.name, color: categoryColor(p.category), text }) })
    }
    return { items, count: items.length }
  })
  const beforePercent = computed(() => {
    const t = progress.value.total
    return t ? Math.floor(((progress.value.done - weekGain.value.count) / t) * 100) : 0
  })
  const totalWeeks = computed(() => (plan.value ? planWeekCount(plan.value.startDate, plan.value.endDate, plan.value.reviewDay) : 0))

  // 다음 주(결산 뒤 바뀜이 적용되는 첫 주)
  const nextWeek = computed(() => (weekNo.value ?? 0) + 1)

  // ── 3. 과정 카드(2026-11-16) — 결산하는 주에 진행 중인 과정마다: 점검 + 일정(그대로/바뀜) ──
  // 지난주 결산 — 그때 체크하지 못한 점검을 이번 주에 한 번 더 묻는다(결산을 건너뛰었으면 지난주 점검 전부)
  const prevReview = ref<WeeklyReviewDto | null>(null)
  watch([() => plan.value?.planId, weekNo], async ([planId, wk]) => {
    prevReview.value = null
    const pl = plan.value
    if (!planId || !pl || !wk || wk < 2) return
    const prev = weekDateRange(pl.startDate, wk - 1, pl.reviewDay)
    if (prev) prevReview.value = await fetchWeeklyReview(planId, prev.start).catch(() => null)
  }, { immediate: true })

  const periodCards = computed<PeriodCard[]>(() => {
    const pl = plan.value; const wk = weekNo.value
    if (!pl || !wk) return []
    const out: PeriodCard[] = []
    for (const p of pl.projects) {
      if (!p.period || p.stoppedAt) continue
      const sw = projectStartWeek(pl.timeline, p.id)
      const len = p.curriculum?.length ?? 0
      if (sw === null || !len) continue
      const idx = wk - sw + 1
      if (idx < 1 || idx > len) continue
      const here = p.curriculum!.find((c) => c.week === idx)?.checks ?? []
      const asked = p.curriculum!.find((c) => c.week === idx - 1)?.checks ?? []
      const done = prevReview.value?.periodChecks?.find((c) => c.projectId === p.id)?.done ?? []
      const carried = asked.filter((x) => !done.includes(x) && !here.includes(x))
      out.push({ project: p, idx, info: periodWeekInfo(p, idx), checks: [...here, ...carried], carried: carried.length, startWeek: sw, endWeek: sw + len - 1 })
    }
    return out
  })
  function changeOf(d: PeriodDraft): PeriodChange | null {
    if (!d.changed) return null
    if (d.kind === 'end') return d.endDelta ? { kind: 'end', weeks: d.endDelta } : null
    if (d.kind === 'pause') return d.pauseWeeks > 0 ? { kind: 'pause', weeks: d.pauseWeeks } : null
    if (d.kind === 'days') return d.days.length ? { kind: 'days', days: [...d.days] } : null
    if (d.kind === 'stop') return { kind: 'stop' }
    return null
  }
  // 바뀐 일정을 반영한 프로젝트들 — 미리보기·속도 재배치·저장이 모두 이것을 쓴다
  const periodChanges = computed(() => {
    const r = range.value
    const list: { before: Project; after: Project; change: PeriodChange }[] = []
    for (const c of periodCards.value) {
      const d = periodDrafts[c.project.id]
      const ch = d ? changeOf(d) : null
      if (ch) list.push({ before: c.project, after: applyPeriodChange(c.project, ch, c.idx, r?.weekEnd ?? toDateKey(today.value)), change: ch })
    }
    return list
  })
  // ── 시험 뒤(정할 것 9) — 결산하는 주 끝날까지 시험 날이 지난 걸음 ──
  const examsPassed = computed<Project[]>(() => {
    const pl = plan.value; const r = range.value
    if (!pl || !r) return []
    // 할 일을 다 끝낸 걸음에는 묻지 않는다(코드 검토 11-22)
    return pl.projects.filter((p) => { const d = examDateOf(p); return !!d && d <= r.weekEnd && !allItemsDone(p, isItemDone, weekEntriesOf) })
  })
  // 날짜가 바뀌는 것(다음 시험 날짜 넣기 · 끝났어요)
  // '다음 시험 날짜 넣기'는 이미 시작한 걸음이면 남은 주를 새 시험 주에 맞춰 다시 편다(코드 검토 11-22 — 예전엔 날짜만 바뀌었다)
  const examChanges = computed(() => {
    const pl = plan.value
    if (!pl) return []
    return examsPassed.value.flatMap((p) => {
      const d = examAfterDrafts[p.id]
      const ch = d ? examAfterChange(p, d.kind, d.date, { startDate: pl.startDate, reviewDay: pl.reviewDay || '월', startWeek: projectStartWeek(pl.timeline, p.id), fromWeek: nextWeek.value }) : null
      return ch ? [ch] : []
    })
  })
  const projectsNow = computed<Project[]>(() => {
    const pl = plan.value
    if (!pl) return []
    const changed = new Map([...periodChanges.value.map((x) => [x.after.id, x.after] as const), ...examChanges.value.map((p) => [p.id, p] as const)])
    return pl.projects.map((p) => changed.get(p.id) ?? p)
  })
  // 학교 과정이 늘거나 쉬면 그 과정 끝에 맞춰 놓인 '과정 중에' 프로젝트(아직 시작 전)도 같은 만큼 옮긴다
  const timelineNow = computed<TimelineSlot[]>(() => {
    const pl = plan.value
    if (!pl) return []
    const shift = new Map<string, number>()
    for (const { before, after } of periodChanges.value) {
      const d = (after.curriculum?.length ?? 0) - (before.curriculum?.length ?? 0)
      if (d && !after.stoppedAt) shift.set(after.id, d)
    }
    if (!shift.size) return pl.timeline
    const owners = duringOwners(projectsNow.value)
    const starts: { id: string; week: number; p: Project }[] = []
    for (const sl of pl.timeline) for (const p of sl.projects) starts.push({ id: p.id, week: sl.week, p })
    const slots: TimelineSlot[] = []
    for (const s of starts) {
      const o = owners.get(s.id)
      const move = o && s.week >= nextWeek.value ? (shift.get(o.id) ?? 0) : 0
      const week = s.week + move
      let sl = slots.find((x) => x.week === week)
      if (!sl) { sl = { week, projects: [] }; slots.push(sl) }
      sl.projects.push(s.p)
    }
    return slots.sort((a, b) => a.week - b.week)
  })

  // ── 3. 루틴 카드(2026-11-21) — 결산하는 주에 나온 루틴마다: 'N번 중 M번' · 기록 추이 · (2주 연속 절반 미만이면) 맞춰 보기 ──
  const routineCards = computed<RoutineCard[]>(() => {
    const pl = plan.value; const wk = weekNo.value
    if (!pl || !wk) return []
    const out: RoutineCard[] = []
    for (const r of pl.routines) {
      const cur = board.routineWeekCount(r.id, wk)
      if (!cur.planned) continue
      const prev = wk >= 2 ? board.routineWeekCount(r.id, wk - 1) : null
      const m = measureOf(r)
      out.push({ routine: r, cur, low: twoWeeksLow(cur, prev), trend: m ? measureTrend(r.records, m, wk) : null, shorter: shortened(r) })
    }
    return out
  })
  // 맞춰 보기로 고른 것 → 루틴에 보낼 칸
  function routineChangeOf(c: RoutineCard): Record<string, unknown> | null {
    const d = routineDrafts[c.routine.id]
    const r = range.value
    if (!d || !d.kind || !r) return null
    if (d.kind === 'shorter') return c.shorter < c.routine.duration ? { duration: c.shorter } : null
    if (d.kind === 'days') return d.days.length ? { days: d.days } : null
    if (d.kind === 'pause') return { pauseWeeks: [...new Set([...(c.routine.pauseWeeks ?? []), nextWeek.value])] }
    const next = parseDateKey(r.weekEnd)!; next.setDate(next.getDate() + 1)
    return { endedAt: toDateKey(next) }   // 그만두기 — 다음 주부터 안 나온다(지금까지 기록은 남는다)
  }

  // ── 4. 템포 ──
  // ⚠️ 계획의 속도는 서버에 저장되지 않는다(paceKey 는 설계 중 로컬만) — 시안은 프로젝트 주당 시간 합으로 짐작하고, 모르면 '꾸준히'
  // ⚠️ 2026-10-29 서버 수정 전 계획은 프로젝트 시간이 0분 — 그대로 계산하면 '시간이 안 드는 프로젝트'가 돼서
  //    느린 속도를 골라도 빨라진다고 나온다. 시간이 없으면 1회 60분으로 본다
  const FALLBACK_MIN = 60
  const withTime = <T extends { duration?: number }>(p: T) => (p.duration ? p : { ...p, duration: FALLBACK_MIN })
  const weeklyHours = computed(() => {
    const pl = plan.value
    const wk = weekNo.value
    if (!pl || !wk) return 0
    // 결산한 주에 동시에 진행한 프로젝트들의 주당 시간 합 — 과정(학교·근무)은 속도와 상관없어 세지 않는다(2026-11-16)
    const active = pl.projects.filter((p) => {
      if (p.period) return false
      const sw = projectStartWeek(pl.timeline, p.id)
      return sw !== null && sw <= wk && wk <= sw + (p.curriculum?.length || 2) - 1
    })
    // 루틴 시간도 센다(2026-11-21 정할 것 5) — 그 주에 실제로 나온 날 × 1회 시간
    const routineMin = pl.routines.reduce((n, r) => n + board.routineWeekCount(r.id, wk).planned * (r.duration ?? 0), 0)
    return Math.round(active.reduce((n, p) => n + ((p.days?.length ?? 0) * (withTime(p).duration ?? 0)) / 60, 0) + routineMin / 60)
  })
  // 속도 카드 — 올인은 계획에 저장된 주당 시간(하루 시간 × 6)을 쓴다(검토 11-17 L2).
  // PACES 의 올인(주 24시간)을 그대로 쓰면 하루 8시간 올인 계획이 결산에서 '같은 올인'인데 주 24시간으로 다시 짜여 시험이 늘었다
  const paceOptions = computed<Pace[]>(() => {
    const pl = plan.value
    const savedKey = pl?.paceKey || (pl?.paceHours ? paceOfHours(pl.paceHours)?.key : undefined)
    const allinHours = savedKey === 'allin' && pl?.paceHours ? pl.paceHours : 0
    return PACES.map((p) => (p.key === 'allin' && allinHours ? { ...p, hours: allinHours } : p))
  })
  const optionOf = (key?: string) => paceOptions.value.find((p) => p.key === key)
  // 지금 속도 — 계획에 저장된 속도(2026-10-30~)가 정본. 예전 계획은 결산 주의 주당 시간으로 짐작, 그것도 없으면 '꾸준히'
  const currentPace = computed<Pace>(() => {
    const pl = plan.value
    const saved = optionOf(paceByKey(pl?.paceKey)?.key ?? (pl?.paceHours ? paceOfHours(pl.paceHours)?.key : undefined))
    if (saved) return saved
    const h = weeklyHours.value
    if (!h) return paceOfHours(DEFAULT_PACE_HOURS)!
    return [...PACES].sort((a, b) => Math.abs(a.hours - h) - Math.abs(b.hours - h))[0]!
  })
  // 그 속도로 다음 주부터 다시 배치하면(이미 시작한 프로젝트는 그대로) — 미리보기와 실제 적용이 같은 계산을 쓴다.
  // 과정 일정을 바꿨으면(3단계) 바뀐 과정을 넣고 계산한다. moved = 시작 주가 달라지는 프로젝트 수(지금 배치와 비교)
  function endIfPace(pace: Pace) {
    const pl = plan.value
    if (!pl) return { endDate: '', weeks: 0, remaining: 0, moved: 0, timeline: [] as TimelineSlot[], changed: [] as Project[], exams: [] as ExamSlot[] }
    // 루틴 시간도 속도 예산에(2026-11-21 정할 것 5) — 붙은 루틴은 그 프로젝트 시간으로, 붙지 않은 루틴은 예산에서 먼저 뺀다
    const loaded = withRoutineLoad(projectsNow.value, pl.routines.filter((x) => !(routineDrafts[x.id]?.kind === 'stop')))
    // 시험일이 있는 걸음은 그 자리에 두고, 큰 시험이 시험일을 넘는지 함께 본다(2026-11-22 시험일 역산)
    // 응시 나이도 새 계획과 같이(코드 검토 11-22)
    const ageOpts = examAgeOptions(pl.startDate, auth.user?.age, pl.reviewDay || '월')
    const raw = rescheduleFrom(loaded.projects, timelineNow.value, nextWeek.value, budgetHours(pace.hours, loaded.freeMin), 60, { startDate: pl.startDate, reviewDay: pl.reviewDay || '월', minStart: ageOpts.minStart })
    const plain = (p: Project): Project => { if (p.routineMin === undefined) return p; const { routineMin: _m, ...rest } = p; void _m; return rest }
    const r = { ...raw, timeline: stripLoad(raw.timeline, projectsNow.value), changed: raw.changed.map(plain) }
    const remaining = pl.projects.filter((p) => { const sw = projectStartWeek(pl.timeline, p.id); return sw === null || sw >= nextWeek.value }).length
    const end = weekDateRange(pl.startDate, r.endWeek, pl.reviewDay)?.end ?? ''
    const moved = pl.projects.filter((p) => {
      const was = projectStartWeek(pl.timeline, p.id)
      const now = projectStartWeek(r.timeline, p.id)
      return was !== null && was >= nextWeek.value && now !== was
    }).length
    // changed = 새 속도로 다시 잡은 큰 시험(2026-11-17) — 결산을 마칠 때 저장한다
    return { endDate: end, weeks: r.endWeek, remaining, moved, timeline: r.timeline, changed: r.changed, exams: r.exams }
  }
  /** 그 속도로 바꾸면 시험일을 넘기는 시험(가장 많이 넘는 것) — 지금 속도에서는 넘지 않을 때만(바꿔서 생기는 일만 알린다) */
  function examLateIfPace(pace: Pace): { late: ExamSlot; now: ExamSlot | null } | null {
    if (pace.key === currentPace.value.key) return null
    const late = endIfPace(pace).exams.filter((x) => x.spare < 0).sort((a, b) => a.spare - b.spare)[0]
    if (!late) return null
    const now = endIfPace(currentPace.value).exams.find((x) => x.id === late.id) ?? null
    return now && now.spare < 0 ? null : { late, now }
  }
  // 과정 카드의 한 줄 미리보기 — 지금 속도 기준(4단계에서 속도를 바꾸면 거기서 다시 보여 준다)
  function periodPreview(id: string): { endFrom: number; endTo: number; moved: number; planEndFrom: string; planEndTo: string } | null {
    const pl = plan.value
    const card = periodCards.value.find((c) => c.project.id === id)
    const pc = periodChanges.value.find((x) => x.after.id === id)
    if (!pl || !card || !pc) return null
    const after = endIfPace(currentPace.value)
    return {
      endFrom: card.endWeek, endTo: card.startWeek + (pc.after.curriculum?.length ?? 0) - 1,
      moved: after.moved, planEndFrom: currentEnd.value, planEndTo: after.endDate,
    }
  }
  // 지금 실제 타임라인이 끝나는 날 — 비교 기준(같은 속도로 '다시 계산한 날'과 비교하면 실제 배치와 어긋나
  // 아무것도 안 바뀌는데 '늦어져요'로 나왔다, 2026-10-30)
  const currentEnd = computed(() => {
    const pl = plan.value
    if (!pl) return ''
    let last = 0
    for (const sl of pl.timeline) for (const raw of sl.projects) {
      const p = pl.projects.find((x) => x.id === raw.id) ?? raw
      last = Math.max(last, sl.week + (p.weeks || p.curriculum?.length || 2) - 1)
    }
    return last ? (weekDateRange(pl.startDate, last, pl.reviewDay)?.end ?? '') : pl.endDate
  })
  const recommendedPace = computed<Pace>(() => {
    const list = paceOptions.value
    const i = list.findIndex((p) => p.key === currentPace.value.key)
    const rec = reviewDraft.feel === 'tight' ? list[Math.max(0, i - 1)]! : reviewDraft.feel === 'loose' ? list[Math.min(list.length - 1, i + 1)]! : currentPace.value
    // '추천'이 시험일을 넘기는 속도에 붙지 않게(진로상담 11-22 정할 것 7)
    return examLateIfPace(rec) ? currentPace.value : rec
  })

  // ── 5. 다음 주 일정 ──
  const nextDays = computed(() => {
    const r = range.value
    if (!r) return []
    const d = parseDateKey(r.weekEnd)!; d.setDate(d.getDate() + 1)
    const out: { key: string; label: string; lines: { name: string; color: string }[] }[] = []
    for (let i = 0; i < 7; i++) {
      const key = toDateKey(d)
      const lines = board.itemsOn(d).map((it) => {
        if (it.itemType === 'project') { const p = board.projectOf(it.itemId); return { name: p?.name ?? '', color: categoryColor(p?.category) } }
        return { name: board.routineOf(it.itemId)?.name ?? '', color: ROUTINE_COLOR }
      }).filter((x) => x.name)
      out.push({ key, label: `${d.getMonth() + 1}/${d.getDate()} ${DOW[d.getDay()]}`, lines })
      d.setDate(d.getDate() + 1)
    }
    return out
  })

  // ── 결산 마침 — 기록 저장 + (속도를 바꿨으면) 남은 계획 다시 배치 ──
  const store = useAchievementStore()
  async function finishReview(pace: Pace): Promise<boolean> {
    const pl = plan.value; const r = range.value
    if (!pl || !r) return false
    const from = currentPace.value
    const changed = pace.key !== from.key
    const periodList = periodChanges.value
    const examList = examChanges.value
    const examReplace = examList.some((p) => !!examDateOf(p))   // 다음 시험 날짜를 넣었으면 그 날짜에 맞춰 다시 놓는다
    const beforeEnd = currentEnd.value; const after = endIfPace(pace)
    // 루틴 맞춰 보기(2026-11-21) — 시간 줄이기·요일 바꾸기·한 주 쉬기·그만두기. 서버는 요일·쉬는 주·끝낸 날이 바뀌면 이번 주부터 일정을 새로 만든다
    const routineList = routineCards.value.map((c) => ({ c, body: routineChangeOf(c) })).filter((x) => x.body)
    for (const { c, body } of routineList) await req.put(`/api/career-plan/${pl.planId}/routines/${c.routine.id}`, body)
    // 과정 일정(2026-11-16) — 바뀐 과정을 먼저 저장한다(서버는 커리큘럼·요일이 바뀌면 이번 주부터 일정을 새로 만든다)
    for (const { after: p } of periodList) {
      await req.put(`/api/career-plan/${pl.planId}/projects/${p.id}`, {
        curriculum: p.curriculum, days: p.days, ...(p.stoppedAt ? { stoppedAt: p.stoppedAt } : {}),
      })
    }
    // 시험 뒤(정할 것 9) — 시험일만 바꾼다(걸음은 완료 처리하지 않는다)
    for (const p of examList) {
      const before = pl.projects.find((x) => x.id === p.id)
      await req.put(`/api/career-plan/${pl.planId}/projects/${p.id}`, {
        method: p.method, methodDetail: p.methodDetail,
        ...(before && before.curriculum !== p.curriculum ? { curriculum: p.curriculum } : {}),
      })
    }
    if (changed || periodList.length || examReplace) {
      // 0) 큰 시험(2026-11-17) — 새 속도로 기간·요일·1회 시간·커리큘럼을 다시 잡은 것을 먼저 저장한다(남은 시험 기간을 그 시간으로 다시 셈)
      for (const p of after.changed) {
        if (periodList.some((x) => x.after.id === p.id)) continue
        await req.put(`/api/career-plan/${pl.planId}/projects/${p.id}`, { curriculum: p.curriculum, days: p.days, duration: p.duration })
      }
      // 1) 남은 프로젝트 재배치 → 2) 계획에 속도·종료일. 종료일은 예상 완료일이라 재배치 결과 그대로(당겨질 수도 있다, 2026-11-04~)
      //    서버는 타임라인·기간이 바뀌면 이번 주부터 일정을 새로 만든다
      await req.put(`/api/career-plan/${pl.planId}/timeline`, { timeline: after.timeline })
      await req.put(`/api/career-plan/${pl.planId}`, {
        ...(changed ? { paceKey: pace.key, paceHours: pace.hours } : !pl.paceKey ? { paceKey: from.key, paceHours: from.hours } : {}),
        ...(after.endDate ? { endDate: after.endDate } : {}),
      })
    } else if (!pl.paceKey) {
      await req.put(`/api/career-plan/${pl.planId}`, { paceKey: from.key, paceHours: from.hours }).catch(() => {}) // 예전 계획: 짐작한 속도를 저장해 둔다
    }
    await putWeeklyReview(pl.planId, r.weekStart, {
      complete: true, weekEnd: r.weekEnd, weekNo: weekNo.value ?? undefined,
      satisfaction: reviewDraft.satisfaction, note: reviewDraft.note, pledge: reviewDraft.pledge, feel: reviewDraft.feel,
      paceFrom: from.key, paceTo: pace.key,
      endDateFrom: changed || periodList.length || examReplace ? beforeEnd : '', endDateTo: changed || periodList.length || examReplace ? after.endDate : '',
      // 과정 점검·일정 변경 기록(2026-11-16)
      periodChecks: periodCards.value.filter((c) => c.checks.length).map((c) => ({
        projectId: c.project.id, week: c.idx, items: c.checks, done: (periodDrafts[c.project.id]?.checked ?? []).filter((x) => c.checks.includes(x)),
      })),
      periodChanges: periodList.map(({ after: p, before, change }) => ({
        projectId: p.id, name: before.name, kind: change.kind,
        weeks: change.kind === 'end' || change.kind === 'pause' ? change.weeks : 0,
        ...(change.kind === 'days' ? { days: change.days } : {}),
      })),
      stats: {
        planned: planned.value, done: done.value, percent: percent.value, fullDays: fullDays.value, workDays: workDays.value,
        minutes: minutes.value, photos: photos.value, streak: board.streak.value,
        progressBefore: beforePercent.value, progressAfter: progress.value.percent, gainItems: weekGain.value.count,
      },
    })
    reviewState(pl.planId, r.weekStart).markDone()
    Object.assign(reviewDraft, { satisfaction: 0, note: '', pledge: '', feel: '', paceKey: '' })
    for (const k of Object.keys(periodDrafts)) delete periodDrafts[k]
    for (const k of Object.keys(routineDrafts)) delete routineDrafts[k]
    for (const k of Object.keys(examAfterDrafts)) delete examAfterDrafts[k]
    if (changed || periodList.length || routineList.length || examList.length) await store.loadActivePlan(true)
    return true
  }

  return {
    ...board,
    finishReview,
    range, weekNo, rangeLabel, totalWeeks,
    days, planned, done, percent, fullDays, workDays, minutes, photos, headline,
    weekGain, beforePercent,
    weeklyHours, paceOptions, currentPace, recommendedPace, endIfPace, nextWeek, currentEnd,
    nextDays,
    periodCards, periodChanges, periodPreview,
    routineCards,
    examsPassed, examLateIfPace,
  }
}

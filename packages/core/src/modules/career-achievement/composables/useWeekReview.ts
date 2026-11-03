// 주간결산(2026-10-30 시안) — 5단계 화면이 같이 쓰는 데이터.
// 결산 대상 주 = 시작 요일이 오늘이면 어제까지의 한 주, 아니면 오늘이 든 주(시작 요일 전날 결산).
// ⚠️ 시안: 평가·템포 변경은 아직 저장하지 않는다(4단계 API 작업 때). 단계를 오가도 값이 남게 모듈 상태로 둔다.
import { computed, reactive } from 'vue'
import { usePlanBoard } from './usePlanBoard'
import { useAchievementEntries } from './useAchievementEntries'
import { computeWeekRangeContaining, parseDateKey, toDateKey } from './useWeeklySchedule'
import { weekOfDate, weekStartOf, projectStartWeek, planWeekCount, weekDateRange } from '@/modules/career-design/composables/usePlanTimeline'
import { weekEntriesOf } from '@/modules/career-design/composables/useProjectCurriculum'
import { PACES, paceOfHours, paceByKey, rescheduleFrom, DEFAULT_PACE_HOURS, type Pace } from '@/modules/career-design/composables/usePlanPace'
import { req } from '@/shared/api'
import { useAchievementStore } from '@/shared/stores/achievement'
import { putWeeklyReview } from '../achievement.api'
import { reviewState } from './useReviewState'
import { categoryColor } from '../lib/planBoard'
import type { DayOfWeek, TimelineSlot } from '@/modules/career-design/types/career-design'

const DOW = ['일', '월', '화', '수', '목', '금', '토']

// 단계 사이에 남는 입력(시안 — 저장 전)
export const reviewDraft = reactive({
  satisfaction: 0 as 0 | 1 | 2 | 3 | 4 | 5,
  note: '',
  pledge: '',
  feel: '' as '' | 'tight' | 'fit' | 'loose', // 이번 주 속도 느낌
  paceKey: '' as string,                       // 다음 주부터 쓸 속도
})

export function useWeekReview() {
  const board = usePlanBoard()
  const { feedSorted, entries } = useAchievementEntries()
  const { plan, today } = board

  const startDow = computed(() => (plan.value?.reviewDay || '월') as DayOfWeek)

  // 결산 대상 주
  const range = computed(() => {
    const pl = plan.value
    if (!pl) return null
    const t = new Date(today.value)
    if (weekStartOf(t, pl.reviewDay).getTime() === new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime()) t.setDate(t.getDate() - 1)
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
    for (let i = 0; i < 7; i++) {
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
    // 결산한 주에 동시에 진행한 프로젝트들의 주당 시간 합
    const active = pl.projects.filter((p) => {
      const sw = projectStartWeek(pl.timeline, p.id)
      return sw !== null && sw <= wk && wk <= sw + (p.curriculum?.length || 2) - 1
    })
    return Math.round(active.reduce((n, p) => n + ((p.days?.length ?? 0) * (withTime(p).duration ?? 0)) / 60, 0))
  })
  // 지금 속도 — 계획에 저장된 속도(2026-10-30~)가 정본. 예전 계획은 결산 주의 주당 시간으로 짐작, 그것도 없으면 '꾸준히'
  const currentPace = computed<Pace>(() => {
    const pl = plan.value
    const saved = paceByKey(pl?.paceKey) ?? (pl?.paceHours ? paceOfHours(pl.paceHours) : undefined)
    if (saved) return saved
    const h = weeklyHours.value
    if (!h) return paceOfHours(DEFAULT_PACE_HOURS)!
    return [...PACES].sort((a, b) => Math.abs(a.hours - h) - Math.abs(b.hours - h))[0]!
  })
  // 다음 주부터 남은 프로젝트를 그 속도로 다시 배치하면 언제 끝나는가
  const nextWeek = computed(() => (weekNo.value ?? 0) + 1)
  // 그 속도로 다음 주부터 다시 배치하면(이미 시작한 프로젝트는 그대로) — 미리보기와 실제 적용이 같은 계산을 쓴다
  function endIfPace(pace: Pace) {
    const pl = plan.value
    if (!pl) return { endDate: '', weeks: 0, remaining: 0, timeline: [] as TimelineSlot[] }
    const r = rescheduleFrom(pl.projects, pl.timeline, nextWeek.value, pace.hours)
    const remaining = pl.projects.filter((p) => { const sw = projectStartWeek(pl.timeline, p.id); return sw === null || sw >= nextWeek.value }).length
    const end = weekDateRange(pl.startDate, r.endWeek, pl.reviewDay)?.end ?? ''
    return { endDate: end, weeks: r.endWeek, remaining, timeline: r.timeline }
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
    const i = PACES.findIndex((p) => p.key === currentPace.value.key)
    if (reviewDraft.feel === 'tight') return PACES[Math.max(0, i - 1)]!
    if (reviewDraft.feel === 'loose') return PACES[Math.min(PACES.length - 1, i + 1)]!
    return currentPace.value
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
        return { name: board.routineOf(it.itemId)?.name ?? '', color: '#9AA0A6' }
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
    const beforeEnd = currentEnd.value; const after = endIfPace(pace)
    if (changed) {
      // 1) 남은 프로젝트 재배치 → 2) 계획에 속도. 종료일은 재배치가 더 늦게 끝날 때만 늘린다(사용자가 정한 날을 당기지 않는다)
      //    서버는 타임라인·기간이 바뀌면 이번 주부터 일정을 새로 만든다
      await req.put(`/api/career-plan/${pl.planId}/timeline`, { timeline: after.timeline })
      const extend = after.endDate && after.endDate > pl.endDate
      await req.put(`/api/career-plan/${pl.planId}`, { paceKey: pace.key, paceHours: pace.hours, ...(extend ? { endDate: after.endDate } : {}) })
    } else if (!pl.paceKey) {
      await req.put(`/api/career-plan/${pl.planId}`, { paceKey: from.key, paceHours: from.hours }).catch(() => {}) // 예전 계획: 짐작한 속도를 저장해 둔다
    }
    await putWeeklyReview(pl.planId, r.weekStart, {
      complete: true, weekEnd: r.weekEnd, weekNo: weekNo.value ?? undefined,
      satisfaction: reviewDraft.satisfaction, note: reviewDraft.note, pledge: reviewDraft.pledge, feel: reviewDraft.feel,
      paceFrom: from.key, paceTo: pace.key,
      endDateFrom: changed ? beforeEnd : '', endDateTo: changed ? after.endDate : '',
      stats: {
        planned: planned.value, done: done.value, percent: percent.value, fullDays: fullDays.value, workDays: workDays.value,
        minutes: minutes.value, photos: photos.value, streak: board.streak.value,
        progressBefore: beforePercent.value, progressAfter: progress.value.percent, gainItems: weekGain.value.count,
      },
    })
    reviewState(pl.planId, r.weekStart).markDone()
    Object.assign(reviewDraft, { satisfaction: 0, note: '', pledge: '', feel: '', paceKey: '' })
    if (changed) await store.loadActivePlan(true)
    return true
  }

  return {
    ...board,
    finishReview,
    range, weekNo, rangeLabel, totalWeeks,
    days, planned, done, percent, fullDays, workDays, minutes, photos, headline,
    weekGain, beforePercent,
    weeklyHours, currentPace, recommendedPace, endIfPace, nextWeek, currentEnd,
    nextDays,
  }
}

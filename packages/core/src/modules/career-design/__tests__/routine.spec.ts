import { describe, expect, it } from 'vitest'
import {
  applySuggestion, attachedEnded, budgetHours, formatMeasure, keepVersion, measureTrend, restoreProject,
  routineFromSuggestion, routineOnDay, shortened, stripLoad, timeFromParts, twoWeeksLow, withRoutineLoad, josaWa,
} from '../lib/routine'
import { generateItemsForWeek } from '@/modules/career-achievement/composables/useWeeklySchedule'
import type { Project, Routine, TimelineSlot } from '../types/career-design'
import type { PrepRoutineSuggestion } from '@/modules/encyclopedia/types/encyclopedia'

const project = (id: string, weeks: number, extra: Partial<Project> = {}): Project => ({
  id, category: 'skill', name: id, goal: '', days: ['월', '화', '수', '목'], duration: 60, priority: 'normal',
  notification: false, missedNotification: false, notificationTime: '09:00', memo: '',
  curriculum: Array.from({ length: weeks }, (_, i) => ({ week: i + 1, title: `훈련 (${i + 1}/${weeks})`, items: ['종목별 훈련'] })),
  ...extra,
})
const routine = (extra: Partial<Routine> = {}): Routine => ({ id: 'r1', name: '체력 훈련', days: ['월', '수', '금'], duration: 60, memo: '', ...extra })
const sug: PrepRoutineSuggestion = {
  name: '체력 훈련', kind: 'target', days: ['월', '수', '금'], minutes: 60, minMinutes: 10,
  measure: { label: '대표 종목 기록', unit: 'time' }, safety: 'body', safetyText: '…', caution: null, example: '예시 · 현직자 검토 전',
  project: { daysPerWeek: 1, minutesPerSession: 30, phases: [
    { weeks: 1, title: '기준 확인', items: ['현재 기록 재기'] },
    { weeks: 10, title: '기록 재기와 점검', items: ['주 1회 기록 측정'] },
    { weeks: 1, title: '마무리', items: ['시험 응시'] },
  ] },
}
const ctx = (extra: Partial<Parameters<typeof routineOnDay>[1]> = {}) => ({
  date: '2026-11-23', dow: '월' as const, planWeek: 3, projectIds: new Set(['p1']), activeProjectIds: new Set(['p1']), courseDay: false, ...extra,
})

describe('어느 날 나오나', () => {
  it('옛 루틴(칸 없음)은 요일만 보고 과정 날에도 나온다', () => {
    expect(routineOnDay(routine(), ctx({ courseDay: true }))).toBe(true)
    expect(routineOnDay(routine(), ctx({ dow: '화' }))).toBe(false)
  })
  it('붙은 프로젝트가 놓인 주에만 — 지워진 프로젝트면 붙지 않은 것처럼', () => {
    const r = routine({ projectId: 'p1' })
    expect(routineOnDay(r, ctx({ activeProjectIds: new Set() }))).toBe(false)
    expect(routineOnDay(r, ctx({ projectIds: new Set(), activeProjectIds: new Set() }))).toBe(true)
  })
  it('쉬는 주·끝낸 날·과정 날(새 루틴 기본)은 빠진다', () => {
    expect(routineOnDay(routine({ pauseWeeks: [3] }), ctx())).toBe(false)
    expect(routineOnDay(routine({ endedAt: '2026-11-23' }), ctx())).toBe(false)
    expect(routineOnDay(routine({ endedAt: '2026-11-24' }), ctx())).toBe(true)
    expect(routineOnDay(routine({ onCourseDays: false }), ctx({ courseDay: true }))).toBe(false)
    expect(routineOnDay(routine({ onCourseDays: true }), ctx({ courseDay: true }))).toBe(true)
  })
  it('주간 일정 만들기 — 붙은 루틴은 프로젝트 기간에만, 과정 다니는 날은 새 루틴이 빠진다', () => {
    const p1 = project('p1', 2)
    const course = project('c1', 10, { period: true, days: ['화'] })
    const timeline: TimelineSlot[] = [{ week: 1, projects: [course] }, { week: 2, projects: [p1] }]
    const plan = {
      startDate: '2026-11-02', reviewDay: '월' as const, projects: [p1, course],
      routines: [routine({ id: 'att', projectId: 'p1', days: ['월', '화'], onCourseDays: false }), routine({ id: 'old', days: ['화'] })],
    }
    const w1 = generateItemsForWeek(plan, timeline, '2026-11-02', '2026-11-08').filter((it) => it.itemType === 'routine')
    expect(w1.map((it) => it.itemId)).toEqual(['old'])   // 1주차엔 p1 이 아직 없다
    const w2 = generateItemsForWeek(plan, timeline, '2026-11-09', '2026-11-15').filter((it) => it.itemType === 'routine')
    expect(w2.map((it) => `${it.itemId}@${it.date}`)).toEqual(['att@2026-11-09', 'old@2026-11-10'])   // 화(과정 날)엔 새 루틴 빠짐
    const w4 = generateItemsForWeek(plan, timeline, '2026-11-23', '2026-11-29').filter((it) => it.itemType === 'routine')
    expect(w4.map((it) => it.itemId)).toEqual(['old'])   // p1(2~3주차)이 끝났다
  })
})

describe('라이브러리 제안 넣기·빼기', () => {
  it('넣으면 주 1회 기록 재기로 줄고(주 수 그대로), 빼면 원래대로', () => {
    const p = project('p1', 12)
    const after = applySuggestion(p, sug)
    expect(after.days).toEqual(['화'])                   // 루틴 요일(월·수·금)과 겹치지 않는 원래 요일
    expect(after.duration).toBe(30)
    expect(after.curriculum!.length).toBe(12)
    expect(after.curriculum![1]!.title).toBe('기록 재기와 점검 (1/10)')
    const back = restoreProject(after)
    expect(back).toEqual(p)
  })
  it('내 진로상황으로 줄어든 프로젝트는 뒤에서부터 맞춘다', () => {
    const after = applySuggestion(project('p1', 3), sug)
    expect(after.curriculum!.map((w) => w.title)).toEqual(['기록 재기와 점검 (9/10)', '기록 재기와 점검 (10/10)', '마무리'])
  })
  it('제안에서 새 루틴 — 과정 날 빼기 기본', () => {
    const r = routineFromSuggestion(sug, 'p1', 'x')
    expect(r).toMatchObject({ kind: 'target', projectId: 'p1', days: ['월', '수', '금'], duration: 60, minMinutes: 10, safety: 'body', onCourseDays: false })
  })
})

describe('속도 예산', () => {
  it('붙은 루틴은 그 프로젝트 시간으로, 붙지 않은 루틴은 예산에서 뺀다', () => {
    const { projects, freeMin } = withRoutineLoad([project('p1', 2)], [routine({ projectId: 'p1' }), routine({ id: 'k', days: ['토', '일'], duration: 30 }), routine({ id: 'e', endedAt: '2026-01-01' })])
    expect(projects[0]!.routineMin).toBe(180)
    expect(freeMin).toBe(60)
    expect(budgetHours(8, freeMin)).toBe(7)
    expect(budgetHours(1, 600)).toBe(1)
    const slots = stripLoad([{ week: 1, projects }], [project('p1', 2)])
    expect(slots[0]!.projects[0]!.routineMin).toBeUndefined()
  })
})

describe('끝날 때 · 맞춰 보기', () => {
  it('붙은 프로젝트가 끝났으면 묻는다(감 유지·끝낸 것은 묻지 않는다)', () => {
    const p1 = project('p1', 2)
    const tl: TimelineSlot[] = [{ week: 1, projects: [p1] }]
    expect(attachedEnded(routine({ projectId: 'p1' }), [p1], tl, 3, '2026-11-23')?.id).toBe('p1')
    expect(attachedEnded(routine({ projectId: 'p1' }), [p1], tl, 2, '2026-11-23')).toBeNull()
    expect(attachedEnded(routine({ projectId: 'p1', kind: 'keep' }), [p1], tl, 3, '2026-11-23')).toBeNull()
  })
  it('감 유지 — 주 2번 · 시간 절반 · 기록 없이 · 프로젝트에서 떼어 낸다', () => {
    const k = keepVersion(routine({ projectId: 'p1', kind: 'target', measure: { label: 'x', unit: 'time' } }))
    expect(k).toMatchObject({ kind: 'keep', days: ['월', '목'], duration: 30, measure: null })
    expect(k.projectId).toBeUndefined()
    expect(shortened({ duration: 20, minMinutes: 15 })).toBe(15)
  })
  it('2주 연속 절반 미만', () => {
    expect(twoWeeksLow({ planned: 3, done: 1 }, { planned: 3, done: 1 })).toBe(true)
    expect(twoWeeksLow({ planned: 4, done: 2 }, { planned: 3, done: 1 })).toBe(false)
    expect(twoWeeksLow({ planned: 3, done: 1 }, null)).toBe(false)
  })
})

describe('주 1회 기록', () => {
  const time = { label: '코스 시간', unit: 'time' as const }
  it('보이는 모양 — 분:초 · 횟수 · 접미사', () => {
    expect(formatMeasure(312, time)).toBe('5:12')
    expect(formatMeasure(7, { label: 'x', unit: 'count', suffix: '개' })).toBe('7개')
    expect(formatMeasure(250, { label: 'x', unit: 'number', suffix: 'm' })).toBe('250m')
    expect(formatMeasure(null, { label: 'x', unit: 'media' })).toBe('했어요')
    expect(timeFromParts('5', '12')).toBe(312)
    expect(timeFromParts('5', '61')).toBeNull()
  })
  it('추이 — 방향과 좋은 쪽만 말한다', () => {
    const t = measureTrend([{ week: 5, date: '', value: 358 }, { week: 6, date: '', value: 331 }, { week: 7, date: '', value: 312 }], time)
    expect(t.points.map((p) => p.week)).toEqual([5, 6, 7])
    expect(t.line).toBe('코스 시간이 줄고 있어요 · 낮을수록 좋아요')
    expect(measureTrend([{ week: 1, date: '', value: 3 }], time).line).toBe('다음 주 기록과 비교해 볼 수 있어요')
  })
  it("조사 '와/과'", () => {
    expect(josaWa('체력시험 준비')).toBe('와')
    expect(josaWa('영어 말하기 성적(오픽·토익스피킹)')).toBe('과')
    expect(josaWa('보컬 트레이닝')).toBe('과')
  })
})

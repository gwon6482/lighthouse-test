// 하루 시작 시간(2026-11-26 #102) — '오늘'을 받는 순수 함수들이 새벽에 앱의 하루를 따르는가
// 주 경계·주간결산·미리 하기(ahead:)·날짜로 정한 프로젝트·시험일 D-day. 시각은 vitest 가짜 시계로 고정한다
import { describe, it, expect, afterEach, vi } from 'vitest'
import { getToday, getTodayKey, refreshAppDay, setDayStartRule } from '@/shared/utils/dev-date'
import { computeWeekRangeContaining } from '../composables/useWeeklySchedule'
import { reviewMoment } from '../lib/planBoard'
import { pendingStep, pullAheadCandidates } from '../lib/pullAhead'
import { outsideDates } from '@/modules/career-design/lib/projectDates'
import { daysUntil } from '@/modules/career-design/lib/examDate'

function at(s: string) {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(s))
  refreshAppDay() // 앱을 열었다·돌아왔다
}
afterEach(() => { setDayStartRule(null); vi.useRealTimers() })

// 계획: 2026-11-05(목) 시작, 결산 요일 목 → 주 = 목~수. 11/19(목)~11/25(수)가 3주차
const START = '2026-11-05'

describe('주의 경계·주간결산', () => {
  it('주의 마지막 날(수) 다음 새벽 2시는 아직 그 주의 마지막 날 — 결산은 "오늘까지"(eve)', () => {
    at('2026-11-26T02:00:00')
    expect(getTodayKey()).toBe('2026-11-25')
    expect(computeWeekRangeContaining(getToday(), START, '목')).toEqual({ weekStart: '2026-11-19', weekEnd: '2026-11-25' })
    expect(reviewMoment(getToday(), START, '목', 'running')).toEqual({ weekStart: '2026-11-19', day: 'eve' })
  })
  it('04:00 에 새 주로 넘어가고 결산은 "오늘 결산"(start)', () => {
    at('2026-11-26T04:00:00')
    expect(computeWeekRangeContaining(getToday(), START, '목')).toEqual({ weekStart: '2026-11-26', weekEnd: '2026-12-02' })
    expect(reviewMoment(getToday(), START, '목', 'running')).toEqual({ weekStart: '2026-11-19', day: 'start' })
  })
  it('자정으로 정한 계정은 예전처럼 자정에 넘어간다', () => {
    at('2026-11-26T02:00:00')
    setDayStartRule({ hour: 0 })
    expect(computeWeekRangeContaining(getToday(), START, '목')?.weekStart).toBe('2026-11-26')
  })
})

describe('미리 하기(ahead:)', () => {
  const proj = { id: 'p1', name: 'React', period: false }
  it('새벽 1시에는 전날이 "오늘" — 같은 주 뒤 요일(목)을 당겨 오는 후보가 된다', () => {
    at('2026-11-20T01:00:00') // 아직 11/19(목)
    const c = pullAheadCandidates({
      todayKey: getTodayKey(),
      todayItems: [],
      laterDays: [{ date: '2026-11-20', items: [{ itemType: 'project', itemId: 'p1' }] }],
      projectOf: () => proj as never,
      isDone: () => false,
      hasUndoneThisWeek: () => true,
    })
    expect(c).toEqual([{ projectId: 'p1', date: '2026-11-20' }])
  })
  it('기기에 적어 둔 옮길 것은 그 주가 앱의 하루로 끝나야 버린다', () => {
    const e = { planId: 'x', weekStart: '2026-11-19', weekEnd: '2026-11-25', itemId: 'p1', from: '2026-11-24', to: '2026-11-23' }
    at('2026-11-26T03:00:00') // 아직 11/25 — 이번 주
    expect(pendingStep(e as never, { todayKey: getTodayKey(), items: [], doneOnFrom: false })).toBe('move')
    at('2026-11-26T04:00:00')
    expect(pendingStep(e as never, { todayKey: getTodayKey(), items: [], doneOnFrom: false })).toBe('drop')
  })
})

describe('날짜로 정한 프로젝트·시험일 — 앱의 하루를 따른다(오너 정할 것 5)', () => {
  const contest = { category: 'portfolio' as const, method: 'contest' as const, dateStart: '2026-11-26', dateEnd: '2026-12-09' }
  it('시작일 새벽 1시는 아직 시작 전날, 04:00 부터 시작일', () => {
    at('2026-11-26T01:00:00')
    expect(outsideDates(contest, getTodayKey())).toBe(true)
    at('2026-11-26T04:00:00')
    expect(outsideDates(contest, getTodayKey())).toBe(false)
  })
  it('마감일 다음 날 새벽 1시까지는 마감일의 하루', () => {
    at('2026-12-10T01:00:00')
    expect(outsideDates(contest, getTodayKey())).toBe(false)
    at('2026-12-10T04:00:00')
    expect(outsideDates(contest, getTodayKey())).toBe(true)
  })
  it('시험 당일 새벽 1시는 D-1, 04:00 부터 D-day', () => {
    at('2026-12-05T01:00:00')
    expect(daysUntil('2026-12-05', getToday())).toBe(1)
    at('2026-12-05T04:00:00')
    expect(daysUntil('2026-12-05', getToday())).toBe(0)
  })
})

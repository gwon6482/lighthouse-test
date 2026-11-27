// 앱의 하루(2026-11-26 #102 하루 시작 시간) — 정본 appDay.ts 와 화면 상태 dev-date.ts
// 같은 시각 묶음을 서버 사본(lighthouse-api test/appDay.test.js)도 시험한다 — 두 쪽 답이 같아야 한다
import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  appDayOf, appDayKeyOf, carriedOverLine, dateKeyOf, dayStartHourOf, dayStartLabel, dayStartPending,
  DAY_START_HOURS, DEFAULT_DAY_START_HOUR, type DayStartRule,
} from '../appDay'
import { getToday, getTodayKey, refreshAppDay, setDayStartRule, setDevDate, useCarriedOverLine } from '../dev-date'
import { clearAccountScope } from '@/shared/auth/accountScope'

const at = (s: string) => new Date(s) // 기기 현지 시각으로 읽힌다(시간대 표시 없음)
const key = (s: string, rule?: DayStartRule | number | null) => appDayKeyOf(at(s), rule)
// 서버가 정해 주는 바꾸기 규칙(서버 nextDayStartRule 과 같은 값을 손으로 적는다)
const switching = (hour: number, from: string, since: string): DayStartRule => ({ hour, from, since: at(since).toISOString() })

describe('기본값', () => {
  it('새벽 4시, 고르는 값 0~6(서버 사본과 check-method-sync 로 대조)', () => {
    expect(DEFAULT_DAY_START_HOUR).toBe(4)
    expect(DAY_START_HOURS).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(dayStartHourOf(null)).toBe(4)
    expect(dayStartHourOf({ hour: 9 })).toBe(4)
    expect(dayStartHourOf({ hour: 0 })).toBe(0)
    expect(dayStartLabel(0)).toBe('자정')
    expect(dayStartLabel(4)).toBe('새벽 4시')
  })
})

describe('appDayKeyOf — 하루 경계', () => {
  it('기본 4시: 23:59 · 00:00 · 03:59 는 전날의 하루, 04:00 부터 새 하루', () => {
    expect(key('2026-11-25T23:59:00')).toBe('2026-11-25')
    expect(key('2026-11-26T00:00:00')).toBe('2026-11-25')
    expect(key('2026-11-26T03:59:59')).toBe('2026-11-25')
    expect(key('2026-11-26T04:00:00')).toBe('2026-11-26')
  })
  it('월말·연말·윤년', () => {
    expect(key('2026-12-01T03:00:00')).toBe('2026-11-30')
    expect(key('2027-01-01T01:00:00')).toBe('2026-12-31')
    expect(key('2028-03-01T02:00:00')).toBe('2028-02-29')
  })
  it('자정으로 정한 계정은 예전과 같다', () => {
    expect(key('2026-11-25T23:59:00', { hour: 0 })).toBe('2026-11-25')
    expect(key('2026-11-26T00:00:00', { hour: 0 })).toBe('2026-11-26')
    expect(key('2026-11-26T00:00:00', 0)).toBe('2026-11-26')
  })
  it('2시로 정함: 01:59 전날, 02:00 그 날', () => {
    expect(key('2026-11-26T01:59:00', { hour: 2 })).toBe('2026-11-25')
    expect(key('2026-11-26T02:00:00', { hour: 2 })).toBe('2026-11-26')
  })
  it('appDayOf 는 시각을 지우지 않는다(받는 쪽이 자정으로 맞춘다)', () => {
    const now = at('2026-11-26T13:45:10')
    expect(appDayOf(now, 0).getTime()).toBe(now.getTime())
    expect(dateKeyOf(appDayOf(now))).toBe('2026-11-26')
  })
})

describe('바꾼 시각은 다음 하루부터', () => {
  it('4시 → 자정, 목요일 02:00 에 바꿈: 수요일은 04:00 까지, 목요일부터 자정 규칙', () => {
    const r = switching(0, '2026-11-26', '2026-11-26T04:00:00')
    expect(key('2026-11-26T02:00:00', r)).toBe('2026-11-25')
    expect(key('2026-11-26T03:59:00', r)).toBe('2026-11-25')
    expect(key('2026-11-26T04:00:00', r)).toBe('2026-11-26')
    expect(key('2026-11-27T00:00:00', r)).toBe('2026-11-27')
    expect(dayStartPending(r, at('2026-11-26T02:00:00'))).toBe(true)
    expect(dayStartPending(r, at('2026-11-26T04:00:00'))).toBe(false)
  })
  it('자정 → 4시, 수요일 23:00 에 바꿈: 목요일이 뒤로 가지 않고 금요일 04:00 까지 이어진다', () => {
    const r = switching(4, '2026-11-26', '2026-11-26T00:00:00')
    expect(key('2026-11-25T23:30:00', r)).toBe('2026-11-25')
    expect(key('2026-11-26T00:00:00', r)).toBe('2026-11-26')
    expect(key('2026-11-26T02:00:00', r)).toBe('2026-11-26')
    expect(key('2026-11-27T02:00:00', r)).toBe('2026-11-26')
    expect(key('2026-11-27T04:00:00', r)).toBe('2026-11-27')
  })
  it('이틀 넘게 남은 since 는 잘못된 값으로 보고 무시', () => {
    expect(key('2026-11-26T02:00:00', switching(0, '2026-12-30', '2026-12-30T04:00:00'))).toBe('2026-11-26')
  })
})

describe('홈의 한 줄', () => {
  it('달력이 앞서 있을 때만', () => {
    expect(carriedOverLine('2026-11-25', '2026-11-26')).toBe('아직 11월 25일(수)의 하루예요')
    expect(carriedOverLine('2026-12-31', '2027-01-01')).toBe('아직 12월 31일(목)의 하루예요')
    expect(carriedOverLine('2026-11-26', '2026-11-26')).toBe('')
  })
})

describe('getToday — 정해 둔 때에만 다시 센다', () => {
  afterEach(() => { setDevDate(null); setDayStartRule(null); vi.useRealTimers() })

  it('테스트 날짜는 밀지 않는다 — 그 날 00:00', () => {
    vi.useFakeTimers()
    vi.setSystemTime(at('2026-11-26T01:00:00'))
    setDevDate('2026-12-31')
    const d = getToday()
    expect(dateKeyOf(d)).toBe('2026-12-31')
    expect([d.getHours(), d.getMinutes()]).toEqual([0, 0])
    expect(getTodayKey()).toBe('2026-12-31')
    expect(useCarriedOverLine().value).toBe('') // 테스트 날짜를 쓰는 동안 한 줄은 숨긴다
  })

  it('새벽 1:10 은 전날, 켜 둔 채 4:05 가 돼도 다시 셀 때까지 그대로, 다시 세면 새 하루', () => {
    vi.useFakeTimers()
    vi.setSystemTime(at('2026-11-26T01:10:00'))
    refreshAppDay()
    const line = useCarriedOverLine()
    expect(getTodayKey()).toBe('2026-11-25')
    expect(line.value).toBe('아직 11월 25일(수)의 하루예요')
    vi.setSystemTime(at('2026-11-26T04:05:00'))
    expect(getTodayKey()).toBe('2026-11-25') // 화면을 쓰는 도중에는 바뀌지 않는다
    refreshAppDay() // 앱으로 돌아옴·홈으로 옴
    expect(getTodayKey()).toBe('2026-11-26')
    expect(line.value).toBe('')
  })

  it('계정 설정을 받으면 그 시각으로, 계정이 바뀌면 기본으로', () => {
    vi.useFakeTimers()
    vi.setSystemTime(at('2026-11-26T01:10:00'))
    setDayStartRule({ hour: 0 })
    expect(getTodayKey()).toBe('2026-11-26')
    clearAccountScope()
    expect(getTodayKey()).toBe('2026-11-25')
  })
})

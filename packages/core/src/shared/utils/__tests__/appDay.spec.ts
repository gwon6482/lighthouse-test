// 앱의 하루(2026-11-26 #102) — 1단계: 따로 계산하던 '오늘'을 도우미 하나로 모았다. 하루 시작은 아직 자정(0시)
import { describe, it, expect, vi, afterEach } from 'vitest'
import { appDayOf, dateKeyOf, DEFAULT_DAY_START_HOUR } from '../appDay'
import { getToday, getTodayKey, setDevDate } from '../dev-date'

const at = (s: string) => new Date(s) // 기기 현지 시각으로 읽힌다(시간대 표시 없음)

describe('appDayOf — 하루 시작 0시(1단계)', () => {
  it('기본값은 자정', () => {
    expect(DEFAULT_DAY_START_HOUR).toBe(0)
  })
  it('23:59 는 그 날, 00:00 은 다음 날 — 지금과 같다', () => {
    expect(dateKeyOf(appDayOf(at('2026-11-25T23:59:00')))).toBe('2026-11-25')
    expect(dateKeyOf(appDayOf(at('2026-11-26T00:00:00')))).toBe('2026-11-26')
    expect(dateKeyOf(appDayOf(at('2026-11-26T03:59:00')))).toBe('2026-11-26')
  })
  it('시각을 지우지 않는다(받는 쪽이 자정으로 맞춘다)', () => {
    const now = at('2026-11-26T13:45:10')
    expect(appDayOf(now).getTime()).toBe(now.getTime())
  })
})

describe('getToday — 테스트 날짜는 밀지 않는다', () => {
  afterEach(() => { setDevDate(null); vi.useRealTimers() })

  it('테스트 날짜가 있으면 그 날 00:00', () => {
    setDevDate('2026-12-31')
    const d = getToday()
    expect(dateKeyOf(d)).toBe('2026-12-31')
    expect([d.getHours(), d.getMinutes()]).toEqual([0, 0])
    expect(getTodayKey()).toBe('2026-12-31')
  })
  it('없으면 지금 시각의 앱 하루', () => {
    vi.useFakeTimers()
    vi.setSystemTime(at('2026-11-26T00:30:00'))
    expect(getTodayKey()).toBe('2026-11-26')
  })
})

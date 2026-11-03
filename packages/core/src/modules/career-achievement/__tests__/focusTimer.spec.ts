import { describe, it, expect } from 'vitest'
import { clampGoal, durationLabel, focusGap, focusDigits, clockLabel } from '../lib/focusTimer'

describe('focusTimer', () => {
  it('목표 기본값 — 계획 1회 시간, 5~180분', () => {
    expect(clampGoal(60)).toBe(60)
    expect(clampGoal(0)).toBe(25)
    expect(clampGoal(undefined)).toBe(25)
    expect(clampGoal(2)).toBe(5)
    expect(clampGoal(300)).toBe(180)
  })

  it('완료는 판정하지 않고 빨리·늦게만 — 1분 안쪽은 딱 맞게', () => {
    expect(focusGap(37 * 60, 50 * 60)).toEqual({ diff: '13분 빨리', line: '목표 50분보다 13분 빨리 했어요' })
    expect(focusGap(66 * 60, 50 * 60)).toEqual({ diff: '16분 늦게', line: '목표 50분보다 16분 늦게 했어요' })
    expect(focusGap(50 * 60 + 40, 50 * 60).diff).toBe('딱 맞게')
    expect(focusGap(150 * 60, 90 * 60).line).toBe('목표 90분보다 1시간 늦게 했어요')
  })

  it('큰 숫자 — 남은 시간, 넘기면 +', () => {
    expect(focusDigits(0, 3000)).toEqual({ over: false, min: '50', sec: '00' })
    expect(focusDigits(1185.6, 3000)).toEqual({ over: false, min: '30', sec: '14' })
    expect(focusDigits(3151, 3000)).toEqual({ over: true, min: '+02', sec: '31' })
    expect(durationLabel(7200)).toBe('2시간')
    expect(clockLabel(3985)).toBe('1:06:25')
    expect(clockLabel(2244)).toBe('37:24')
  })
})

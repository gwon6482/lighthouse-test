import { describe, it, expect } from 'vitest'
import { clampGoal, durationLabel, focusGap, focusDigits, clockLabel, focusBadge, logMinutesLabel } from '../lib/focusTimer'

describe('focusTimer', () => {
  it('목표 기본값 — 계획 1회 시간, 5~180분', () => {
    expect(clampGoal(60)).toBe(60)
    expect(clampGoal(0)).toBe(25)
    expect(clampGoal(undefined)).toBe(25)
    expect(clampGoal(2)).toBe(5)
    expect(clampGoal(300)).toBe(180)
  })

  it('완료는 판정하지 않고 일찍·늦게만 — 1분 안쪽은 딱 맞게', () => {
    expect(focusGap(37 * 60, 50 * 60)).toEqual({ diff: '13분 일찍', line: '목표 50분보다 13분 일찍 끝냈어요', sub: '목표 50분보다' })
    expect(focusGap(66 * 60, 50 * 60)).toEqual({ diff: '16분 늦게', line: '목표 50분보다 16분 늦게 했어요', sub: '목표 50분보다' })
    expect(focusGap(50 * 60 + 40, 50 * 60).diff).toBe('딱 맞게')
    expect(focusGap(150 * 60, 90 * 60).line).toBe('목표 90분보다 1시간 늦게 했어요')
    // 시안 A1 12분 경우 — 12:04 / 목표 15분
    expect(focusGap(12 * 60 + 4, 15 * 60)).toEqual({ diff: '3분 일찍', line: '목표 15분보다 3분 일찍 끝냈어요', sub: '목표 15분보다' })
  })

  it('목표의 절반을 못 채우면 차이 대신 고른 목표', () => {
    expect(focusGap(14, 15 * 60)).toEqual({ diff: '15분', line: '목표 15분 중 14초 집중했어요', sub: '고른 목표' })
    expect(focusGap(7 * 60 + 20, 15 * 60).line).toBe('목표 15분 중 7분 집중했어요')
    // 딱 절반은 채운 것으로
    expect(focusGap(25 * 60, 50 * 60).diff).toBe('25분 일찍')
    // 목표가 1분 안쪽으로 남으면 절반 규칙보다 '딱 맞게'가 먼저(목표 5분 · 4분 10초)
    expect(focusGap(250, 300).diff).toBe('딱 맞게')
  })

  it('큰 원 — 1분이 안 되면 초, 그 밖은 분을 버림', () => {
    expect(focusBadge(14)).toEqual({ num: 14, unit: '초' })
    expect(focusBadge(59.9)).toEqual({ num: 59, unit: '초' })
    expect(focusBadge(60)).toEqual({ num: 1, unit: '분' })
    expect(focusBadge(12 * 60 + 4)).toEqual({ num: 12, unit: '분' })
    expect(focusBadge(-3)).toEqual({ num: 0, unit: '초' })
  })

  it('로그 한 줄 — 1분이 안 되면 1분 미만', () => {
    expect(logMinutesLabel(14)).toBe('1분 미만')
    expect(logMinutesLabel(59)).toBe('1분 미만')
    expect(logMinutesLabel(60)).toBe('1분')
    expect(logMinutesLabel(12 * 60 + 40)).toBe('13분')
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

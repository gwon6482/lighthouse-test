import { describe, expect, it } from 'vitest'
import { CAREER_SITUATION_OPENS_AT, careerSituationOpen } from '../features'

// 내 진로상황은 처리방침 시행일(2026-11-23 0시, 한국 시간)부터 연다 — 스테이징·로컬 개발은 VITE_CAREER_SITUATION_EARLY=1 로 미리
describe('내 진로상황 여는 날', () => {
  const early = import.meta.env.VITE_CAREER_SITUATION_EARLY === '1'
  it('시행일 0시부터 열린다', () => {
    expect(CAREER_SITUATION_OPENS_AT).toBe('2026-11-23T00:00:00+09:00')
    expect(careerSituationOpen(Date.parse('2026-11-23T00:00:00+09:00'))).toBe(true)
    expect(careerSituationOpen(Date.parse('2026-12-01T09:00:00+09:00'))).toBe(true)
  })
  it('그 전에는 닫혀 있다(미리 여는 스위치가 없을 때)', () => {
    expect(careerSituationOpen(Date.parse('2026-11-22T23:59:59+09:00'))).toBe(early)
    expect(careerSituationOpen(Date.parse('2026-11-16T12:00:00+09:00'))).toBe(early)
  })
})

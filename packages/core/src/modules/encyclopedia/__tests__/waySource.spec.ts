// '되는 길' 직접 쓴 글의 출처·검토 표시(2026-11-19 진로상담 1차 검토 반영)
import { describe, it, expect } from 'vitest'
import { waySourceView, basisLine } from '../lib/waySource'
import type { WaySource } from '../types/encyclopedia'

const base: Omit<WaySource, 'reviewed' | 'reviewedAt'> = { by: 'lighthouse', basis: 'law', sources: ['법 제1조(2026-01-01 시행 기준)'], caution: '채용 경로는 일반적인 내용이에요.', updatedAt: '2026-11-19' }

describe('waySourceView', () => {
  it('근거 문구 — 법령 근거라도 일부만 원문 확인이라고 쓴다', () => {
    expect(basisLine('law')).toBe('자격 기준 일부는 법령 원문으로 확인했어요.')
    expect(basisLine('general')).toBe('일반적인 경로를 정리했어요.')
  })

  it('직업별 검토 칸이 오고 꺼져 있으면 — 검토 전 초안 줄과 caution', () => {
    const v = waySourceView({ ...base, reviewed: false, reviewedAt: null })
    expect(v.review).toEqual({ kind: 'draft', text: '검토 전 초안이에요' })
    expect(v.caution).toBe(base.caution)
    expect(v.sources).toEqual(base.sources)
  })

  it('켜진 직업 — 라이트하우스 검토(날짜), 검토 전 줄은 없다', () => {
    const v = waySourceView({ ...base, reviewed: true, reviewedAt: '2026-12-01' })
    expect(v.review).toEqual({ kind: 'reviewed', text: '라이트하우스 검토 · 2026.12.01' })
    expect(v.review?.text).not.toContain('현직자')
  })

  it('켜졌는데 날짜가 없으면 날짜 없이', () => {
    expect(waySourceView({ ...base, reviewed: true, reviewedAt: null }).review?.text).toBe('라이트하우스 검토')
  })

  it('그 전 API(reviewedAt 칸 없음) — 지금처럼: 검토 줄·caution 을 그리지 않는다', () => {
    const old: WaySource = { ...base, reviewed: false }
    const v = waySourceView(old)
    expect(v.review).toBeNull()
    expect(v.caution).toBeNull()
    expect(v.sources).toEqual(base.sources)
  })

  it('caution 이 비면 그리지 않는다', () => {
    expect(waySourceView({ ...base, caution: null, reviewed: false, reviewedAt: null }).caution).toBeNull()
  })
})

import { describe, it, expect } from 'vitest'
import { josa, whyParts, whyText, REASON_AXIS } from '../lib/jobGroupWhy'

describe('jobGroupWhy — 직무 추천 이유 한 문장(결과지·나의 추천 진로 카드 공용)', () => {
  it('받침에 따라 조사를 고른다', () => {
    expect(josa('지적 추구', '과', '와')).toBe('와')
    expect(josa('논리-수학 지능', '이', '가')).toBe('이')
    expect(josa('기발함', '이', '가')).toBe('이')
    expect(josa('ABC', '이', '가')).toBe('이(가)')
  })

  it('이유 둘 — 결과지와 같은 문장', () => {
    const g = { reasons: [{ axis: 'T23' as const, code: 'a', name: '지적 추구' }, { axis: 'T21' as const, code: 'b', name: '언어 지능' }] }
    expect(whyText(g)).toBe('특히 지적 추구(가치관)와 언어 지능(재능)이 잘 맞아요')
    expect(whyParts(g).filter((p) => p.kw).map((p) => p.kw!.name)).toEqual(['지적 추구', '언어 지능'])
  })

  it('이유 하나·없음', () => {
    expect(whyText({ reasons: [{ axis: 'T1', code: 'x', name: '기발함' }] })).toBe('특히 기발함(성격)이 잘 맞아요')
    expect(whyParts({ reasons: [] })).toEqual([])
  })

  it('영역 이름 네 가지', () => {
    expect(REASON_AXIS).toEqual({ T1: '성격', T21: '재능', T22: '관심', T23: '가치관' })
  })
})

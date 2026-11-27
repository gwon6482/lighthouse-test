// 직업 상세 개요 탭 칩 — 값 0인 항목(고용24 자료 없음)을 '특히 중요해요'로 그리지 않는다(2026-11-27)
import { describe, it, expect } from 'vitest'
import { topRankItems } from '../lib/detailChips'

const it3 = (scores: number[]) => scores.map((score, i) => ({ code: `C${i}`, name: `항목${i}`, score }))

describe('topRankItems', () => {
  it('값이 있는 직업 — 점수 높은 순 앞 3개', () => {
    expect(topRankItems(it3([3.1, 4.8, 2.0, 3.9])).map((i) => i.score)).toEqual([4.8, 3.9, 3.1])
  })

  it('값이 전부 0인 영역(자료 없음) — 아무것도 그리지 않는다', () => {
    expect(topRankItems(it3([0, 0, 0, 0, 0]))).toEqual([])
  })

  it('일부만 0이면 0인 항목은 빼고 남는 것만', () => {
    expect(topRankItems(it3([93, 70, 7, 0, 0])).map((i) => i.score)).toEqual([93, 70, 7])
    expect(topRankItems(it3([5, 0, 0])).map((i) => i.score)).toEqual([5])
  })

  it('빈 배열·없음·이상한 값도 깨지지 않는다', () => {
    expect(topRankItems(undefined)).toEqual([])
    expect(topRankItems(null)).toEqual([])
    expect(topRankItems([{ code: 'a', name: 'a', score: null as unknown as number }, { code: 'b', name: 'b', score: -1 }])).toEqual([])
  })

  it('원래 배열 순서를 바꾸지 않는다', () => {
    const src = it3([1, 3, 2])
    topRankItems(src)
    expect(src.map((i) => i.score)).toEqual([1, 3, 2])
  })
})

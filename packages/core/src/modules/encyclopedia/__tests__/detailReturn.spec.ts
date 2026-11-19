import { beforeEach, describe, expect, it } from 'vitest'
import { saveDetailReturn, takeDetailReturn } from '../lib/detailReturn'

// sessionStorage 가 없는 시험 환경 — 간단한 대역
const mem = new Map<string, string>()
;(globalThis as { sessionStorage?: unknown }).sessionStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => { mem.set(k, v) },
  removeItem: (k: string) => { mem.delete(k) },
}

describe('직업 상세 — 뒤로 왔을 때 읽던 탭·자리(2026-11-19 다듬기 3차)', () => {
  beforeEach(() => mem.clear())
  const A = '/career-encyclopedia/job/111111'
  it('기록을 거슬러 왔으면(forward 있음) 라우터가 남긴 스크롤과 남긴 탭', () => {
    saveDetailReturn(A, 'preparation', 900, 1000)
    expect(takeDetailReturn(A, { forward: '/career-encyclopedia/job/222222', scroll: { top: 1234, left: 0 } }, 2000)).toEqual({ tab: 'preparation', y: 1234 })
    // 한 번 쓰면 지운다 — 탭은 개요로
    expect(takeDetailReturn(A, { forward: '/x', scroll: { top: 50 } }, 3000)).toEqual({ tab: 'overview', y: 50 })
  })
  it('새로 눌러 들어온 것(forward 없음)이면 맨 위에서', () => {
    saveDetailReturn(A, 'review', 500, 1000)
    expect(takeDetailReturn(A, { forward: null, scroll: null }, 2000)).toBeNull()
  })
  it('라우터 스크롤이 없으면 남긴 값 · 30분 지나면 버린다', () => {
    saveDetailReturn(A, 'overview', 700, 1000)
    expect(takeDetailReturn(A, { forward: '/x' }, 2000)).toEqual({ tab: 'overview', y: 700 })
    saveDetailReturn(A, 'review', 700, 1000)
    expect(takeDetailReturn(A, { forward: '/x' }, 1000 + 31 * 60 * 1000)).toBeNull()
  })
})

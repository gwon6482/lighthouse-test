import { beforeEach, describe, expect, it } from 'vitest'
import { POSITION_TTL_MS, clearPosition, positionKey, readPosition, savePosition } from '../lib/browsePosition'
import { listQuery, stateFromQuery } from '../lib/browseQuery'

// 시험 환경(node)에는 sessionStorage 가 없다 — 메모리로 대신한다
const mem = new Map<string, string>()
Object.assign(globalThis, {
  sessionStorage: {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => { mem.set(k, String(v)) },
    removeItem: (k: string) => { mem.delete(k) },
    clear: () => mem.clear(),
  },
})

describe('분류로 찾기 — 보던 자리(2026-11-19)', () => {
  beforeEach(() => sessionStorage.clear())

  it('같은 조건·순서면 펼친 수(n)가 주소에 없어도 같은 목록이다 — 로그인 뒤 돌아오는 주소는 n 이 없다', () => {
    const list = stateFromQuery({ value: 'T23_1', order: 'value', sort: 'value', n: '60' })
    // 고르기 화면(연봉 탭)이 만든 '로그인 뒤 돌아올 곳' — 같은 조건, n 없음
    const back = stateFromQuery(listQuery(stateFromQuery({ value: 'T23_1' }), ['value']) as Record<string, string>)
    expect(positionKey(back, ['value'])).toBe(positionKey(list, ['value']))
    // 순서가 다르면 정렬이 달라 다른 목록
    const two = stateFromQuery({ value: 'T23_1', env: 'remote' })
    expect(positionKey(two, ['value', 'env'])).not.toBe(positionKey(two, ['env', 'value']))
  })

  it('펼친 수·묶음별 펼친 수·스크롤을 남기고 읽는다', () => {
    const key = positionKey(stateFromQuery({ value: 'T23_1' }), ['value'])
    savePosition({ key, n: 60, near: { env: 25, salary: 0 }, y: 1840 }, 1000)
    expect(readPosition(key, 2000)).toEqual({ key, n: 60, near: { env: 25 }, y: 1840, at: 1000 })
  })

  it('다른 목록이거나 오래된 자리는 쓰지 않는다', () => {
    const key = positionKey(stateFromQuery({ value: 'T23_1' }), ['value'])
    savePosition({ key, n: 60, near: {}, y: 100 }, 0)
    expect(readPosition(positionKey(stateFromQuery({ value: 'T23_2' }), ['value']), 10)).toBeNull()
    expect(readPosition(key, POSITION_TTL_MS + 1)).toBeNull()
    clearPosition()
    expect(readPosition(key, 10)).toBeNull()
  })

  it('망가진 값은 버린다', () => {
    sessionStorage.setItem('lh_browse_pos', '{oops')
    expect(readPosition('x')).toBeNull()
  })
})

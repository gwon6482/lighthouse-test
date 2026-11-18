import { beforeEach, describe, expect, it } from 'vitest'
import { dropAfterLogin, rememberAfterLogin, safeNext, takeAfterLogin } from '../afterLogin'

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

describe('로그인 뒤 돌아갈 곳(?next=)', () => {
  beforeEach(() => sessionStorage.clear())

  it('앱 안 경로만 받는다', () => {
    expect(safeNext('/career-encyclopedia/browse?interest=T22_TEC_2')).toBe('/career-encyclopedia/browse?interest=T22_TEC_2')
    expect(safeNext('//evil.example.com')).toBeNull()
    expect(safeNext('/\\evil.example.com')).toBeNull()
    expect(safeNext('https://evil.example.com')).toBeNull()
    expect(safeNext('/onboarding/auth')).toBeNull()   // 되돌이
    expect(safeNext(['/a'])).toBeNull()
    expect(safeNext('/' + 'a'.repeat(600))).toBeNull()
  })

  it('기억 → 꺼내면 지워진다 · 새로 가입하는 길에서는 버린다', () => {
    expect(rememberAfterLogin('/career-encyclopedia/browse/salary')).toBe('/career-encyclopedia/browse/salary')
    expect(takeAfterLogin()).toBe('/career-encyclopedia/browse/salary')
    expect(takeAfterLogin()).toBeNull()
    rememberAfterLogin('/career-encyclopedia/browse/salary')
    dropAfterLogin()
    expect(takeAfterLogin()).toBeNull()
    expect(rememberAfterLogin('https://evil.example.com')).toBeNull()
    expect(takeAfterLogin()).toBeNull()
  })
})

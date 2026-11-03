import { describe, it, expect, vi, afterEach } from 'vitest'
import { uid } from '../uid'

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('uid', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('UUID v4 형식', () => {
    expect(uid()).toMatch(V4)
  })

  // 2026-11-03: http://<맥 이름>.local 로 연 폰에서 crypto.randomUUID 가 없어 진로달성 홈이 멈췄다
  it('randomUUID 가 없는 곳(보안 연결 아님)에서도 만든다', () => {
    const real = globalThis.crypto
    vi.stubGlobal('crypto', { getRandomValues: real.getRandomValues.bind(real) })
    const ids = new Set(Array.from({ length: 200 }, () => uid()))
    expect([...ids].every((id) => V4.test(id))).toBe(true)
    expect(ids.size).toBe(200)
  })
})

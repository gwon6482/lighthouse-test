import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// 자동로그인(2026-11-04) — 로그아웃은 서버가 토큰을 거절할 때만, 연장 토큰은 바꿔 저장
const get = vi.fn()
vi.mock('@/shared/api', () => ({ req: { get: (...a: unknown[]) => get(...a), defaults: { headers: { common: {} as Record<string, string> } } } }))

const store: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v },
  removeItem: (k: string) => { delete store[k] },
})

const { useAuthStore } = await import('../auth')
const fail = (status?: number) => Object.assign(new Error('x'), status ? { response: { status } } : {})

describe('auth.fetchMe', () => {
  beforeEach(() => {
    for (const k of Object.keys(store)) delete store[k]
    store.lh_token = 'old'
    get.mockReset()
    setActivePinia(createPinia())
  })

  it('서버가 새 토큰을 주면 바꿔 저장한다(90일 연장)', async () => {
    get.mockResolvedValue({ data: { user: { uid: 'u1' }, token: 'new' } })
    const auth = useAuthStore()
    expect(await auth.fetchMe()).toBe('ok')
    expect(auth.token).toBe('new')
    expect(store.lh_token).toBe('new')
  })

  it('새 토큰이 없으면 그대로', async () => {
    get.mockResolvedValue({ data: { user: { uid: 'u1' } } })
    const auth = useAuthStore()
    await auth.fetchMe()
    expect(store.lh_token).toBe('old')
  })

  it('401·404 면 로그아웃', async () => {
    for (const s of [401, 404]) {
      store.lh_token = 'old'
      setActivePinia(createPinia())
      get.mockRejectedValueOnce(fail(s))
      const auth = useAuthStore()
      expect(await auth.fetchMe()).toBe('invalid')
      expect(auth.isLoggedIn).toBe(false)
      expect(store.lh_token).toBeUndefined()
    }
  })

  it('연결 끊김·서버 오류로는 로그아웃하지 않는다', async () => {
    for (const err of [fail(), fail(500), fail(503)]) {
      get.mockRejectedValueOnce(err)
      const auth = useAuthStore()
      expect(await auth.fetchMe()).toBe('offline')
      expect(auth.isLoggedIn).toBe(true)
      expect(store.lh_token).toBe('old')
    }
  })
})

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// 계정이 바뀌면 담아 둔 검사 목록·탭의 검사 id 를 비우고, 탭의 id 는 내 목록에 있을 때만 쓴다(2026-11-24 검토 1번)
const get = vi.fn()
const post = vi.fn()
vi.mock('@/shared/api', () => ({ req: { get: (...a: unknown[]) => get(...a), post: (...a: unknown[]) => post(...a), defaults: { headers: { common: {} as Record<string, string> } } } }))

const mem = (): Storage => {
  const m: Record<string, string> = {}
  return { getItem: (k: string) => m[k] ?? null, setItem: (k: string, v: string) => { m[k] = v }, removeItem: (k: string) => { delete m[k] }, clear: () => {}, key: () => null, length: 0 } as Storage
}
const local = mem()
const session = mem()
vi.stubGlobal('localStorage', local)
vi.stubGlobal('sessionStorage', session)

const { resolveLatestSurveyId } = await import('../lib/latestSurvey')
const { useAuthStore } = await import('@/shared/stores/auth')
const { onAccountChange, accountGeneration } = await import('@/shared/auth/accountScope')

const list = (...ids: [string, string][]) => ({ data: { success: true, surveyResults: ids.map(([survey_id, submitted_at]) => ({ survey_id, submitted_at })) } })

describe('resolveLatestSurveyId · 계정 바꿈', () => {
  beforeEach(() => {
    get.mockReset(); post.mockReset()
    session.removeItem('lh_survey_id'); local.removeItem('lh_guest_survey'); local.removeItem('lh_token')
    setActivePinia(createPinia())
    useAuthStore().logout() // 앞 시험이 담아 둔 것을 비운다
  })

  it('다른 계정의 검사 id 가 탭에 있어도 내 목록의 최신을 쓴다', async () => {
    session.setItem('lh_survey_id', 'A-survey')
    get.mockResolvedValue(list(['B-old', '2026-01-01'], ['B-new', '2026-02-01']))
    expect(await resolveLatestSurveyId()).toBe('B-new')
  })

  it('목록은 잠깐 담아 두고(다시 부르지 않음), 계정이 바뀌면 비운다', async () => {
    get.mockResolvedValue(list(['A1', '2026-01-01']))
    expect(await resolveLatestSurveyId()).toBe('A1')
    expect(await resolveLatestSurveyId()).toBe('A1')
    expect(get).toHaveBeenCalledTimes(1)

    post.mockResolvedValue({ data: { token: 't-b', user: { uid: 'B' } } })
    await useAuthStore().login('b@example.com', 'pw')
    get.mockResolvedValue(list(['B1', '2026-03-01']))
    expect(await resolveLatestSurveyId()).toBe('B1')
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('방금 낸 검사(탭의 id)가 담아 둔 목록에 없으면 한 번 새로 받는다', async () => {
    get.mockResolvedValueOnce(list(['A1', '2026-01-01']))
    expect(await resolveLatestSurveyId()).toBe('A1')
    session.setItem('lh_survey_id', 'A2')
    get.mockResolvedValueOnce(list(['A1', '2026-01-01'], ['A2', '2026-01-02']))
    expect(await resolveLatestSurveyId()).toBe('A2')
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('계정이 바뀌는 자리마다 비운다 — 로그인·setAuth·applyToken·로그아웃(토큰 연장은 아님)', async () => {
    const cleared = vi.fn()
    const off = onAccountChange(cleared)
    const auth = useAuthStore()
    post.mockResolvedValue({ data: { token: 't', user: { uid: 'u' } } })
    await auth.login('a@example.com', 'pw')
    auth.setAuth('t2', { uid: 'u2' } as never)
    auth.applyToken('t3')
    auth.logout()
    expect(cleared).toHaveBeenCalledTimes(4)
    const gen = accountGeneration()
    get.mockResolvedValue({ data: { user: { uid: 'u' }, token: 'longer' } })
    local.setItem('lh_token', 'x'); setActivePinia(createPinia())
    await useAuthStore().fetchMe()
    expect(accountGeneration()).toBe(gen) // 같은 계정의 토큰 연장은 계정 바꿈이 아니다
    off()
  })

  it('비회원 검사 → 가입: 탭의 검사 id 는 지우되, 새 계정에 잇는 열람 키(lh_guest_survey)는 남긴다', () => {
    session.setItem('lh_survey_id', 'guest-survey')
    local.setItem('lh_guest_survey', JSON.stringify({ surveyId: 'guest-survey', key: 'k', at: '2026-11-24' }))
    useAuthStore().setAuth('t-new', { uid: 'new' } as never)
    expect(session.getItem('lh_survey_id')).toBeNull()
    expect(local.getItem('lh_guest_survey')).not.toBeNull()
  })
})

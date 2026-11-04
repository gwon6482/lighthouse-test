import { describe, it, expect, vi, beforeEach } from 'vitest'

// 휴지통 되돌리기(2026-11-04) — 진행 중 계획과 겹치면 서버가 409 로 묻고, 사용자 선택을 makeActive 로 다시 보낸다
const post = vi.fn()
vi.mock('@/shared/api', () => ({ req: { post: (...a: unknown[]) => post(...a) } }))
const confirmFn = vi.fn()
vi.stubGlobal('confirm', (m: string) => confirmFn(m))

const { restoreWithConfirm, daysLeft } = await import('../planTrash.api')
const conflict = () => Object.assign(new Error('409'), { response: { status: 409, data: { conflict: true, activePlan: { name: '새 계획', targetJob: '' } } } })

describe('planTrash', () => {
  beforeEach(() => { post.mockReset(); confirmFn.mockReset() })

  it('겹치지 않으면 한 번에', async () => {
    post.mockResolvedValueOnce({ data: { plan: { status: 'active' } } })
    expect(await restoreWithConfirm('A')).toBe('active')
    expect(post).toHaveBeenCalledTimes(1)
    expect(post.mock.calls[0]![1]).toEqual({})
  })

  it('겹치면 물어보고 — 예 → makeActive true', async () => {
    post.mockRejectedValueOnce(conflict()).mockResolvedValueOnce({ data: { plan: { status: 'active' } } })
    confirmFn.mockReturnValue(true)
    expect(await restoreWithConfirm('A')).toBe('active')
    expect(confirmFn.mock.calls[0]![0]).toContain('새 계획')
    expect(post.mock.calls[1]![1]).toEqual({ makeActive: true })
  })

  it('겹치면 물어보고 — 취소 → 초안으로(makeActive false)', async () => {
    post.mockRejectedValueOnce(conflict()).mockResolvedValueOnce({ data: { plan: { status: 'draft' } } })
    confirmFn.mockReturnValue(false)
    expect(await restoreWithConfirm('A')).toBe('draft')
    expect(post.mock.calls[1]![1]).toEqual({ makeActive: false })
  })

  it('남은 날 — 올림, 지나면 0', () => {
    const now = Date.parse('2026-11-04T09:00:00Z')
    expect(daysLeft('2026-12-04T08:00:00Z', now)).toBe(30)
    expect(daysLeft('2026-11-04T10:00:00Z', now)).toBe(1)
    expect(daysLeft('2026-11-01T00:00:00Z', now)).toBe(0)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'

// 서버 대신 — 주간 일정 GET/POST/PUT 만 흉내 낸다(운영 API 로 아무것도 나가지 않는다)
const api = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }))
vi.mock('@/shared/api', () => ({ req: api }))

// node 환경에는 localStorage 가 없다 — 실패분 저장을 보려고 간단한 것을 둔다
const store = new Map<string, string>()
;(globalThis as any).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => { store.set(k, v) },
  removeItem: (k: string) => { store.delete(k) },
}

import { useWeeklySchedule, queueAhead } from '../composables/useWeeklySchedule'
import { AHEAD_PENDING_KEY } from '../lib/pullAhead'
import { clearAccountScope } from '@/shared/auth/accountScope'
import type { Project, TimelineSlot } from '@/modules/career-design/types/career-design'

const ux = { id: 'ux', name: 'UX', days: ['월', '수', '금'], curriculum: [{ week: 1, items: ['a'] }, { week: 2, items: ['a'] }] } as unknown as Project
const plan = { startDate: '2026-11-18', reviewDay: '수' as const, projects: [ux], routines: [] }
const timeline = [{ week: 1, projects: [ux] }] as unknown as TimelineSlot[]
const o = { itemId: 'ux', from: '2026-11-30', to: '2026-11-29' }
const sched = (items: any[]) => ({ scheduleId: 's', planId: 'p', weekStart: '2026-11-25', weekEnd: '2026-12-01', items, reviewedAt: null, reviewNote: '', status: 'pending' })

beforeEach(() => { api.get.mockReset(); api.post.mockReset(); api.put.mockReset(); store.clear() })

describe('moveAheadOnSave', () => {
  it('그 주 일정이 없으면 계획 배치로 만들고(POST) 칸을 옮겨 저장한다(PUT)', async () => {
    api.get.mockRejectedValueOnce({ response: { status: 404 } })
    api.post.mockImplementation(async (_u: string, body: any) => ({ data: { schedule: sched(body.items) } }))
    api.put.mockImplementation(async (_u: string, body: any) => ({ data: { schedule: sched(body.items) } }))
    const ok = await useWeeklySchedule().moveAheadOnSave('p', plan, timeline, o)
    expect(ok).toBe(true)
    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.put.mock.calls[0]![0]).toBe('/api/career-plan/p/weekly-schedule/2026-11-25')
    const moved = api.put.mock.calls[0]![1].items.filter((it: any) => it.itemId === 'ux')
    expect(moved.map((it: any) => it.date)).toEqual(['2026-11-25', '2026-11-27', '2026-11-29'])
    expect(moved[2].note).toBe('ahead:2026-11-30')
  })
  it('PUT 이 실패하면 false(부르는 쪽이 기기에 적어 둔다)', async () => {
    api.get.mockResolvedValueOnce({ data: { schedule: sched([{ id: 'e', itemType: 'project', itemId: 'ux', date: '2026-11-30' }]) } })
    api.put.mockRejectedValueOnce(new Error('offline'))
    expect(await useWeeklySchedule().moveAheadOnSave('p', plan, timeline, o)).toBe(false)
  })
  it('일정을 받지도 만들지도 못하면 false', async () => {
    api.get.mockRejectedValueOnce(new Error('offline'))
    api.post.mockRejectedValueOnce(new Error('offline'))
    expect(await useWeeklySchedule().moveAheadOnSave('p', plan, timeline, o)).toBe(false)
    expect(api.put).not.toHaveBeenCalled()
  })
})

describe('retryAhead — 홈을 불러올 때', () => {
  const pending = { planId: 'p', weekStart: '2026-11-25', weekEnd: '2026-12-01', ...o }
  const ctx = { todayKey: '2026-11-29', isDone: () => false }
  const saved = () => JSON.parse(store.get(AHEAD_PENDING_KEY) ?? '[]')

  it('성공하면 지운다', async () => {
    queueAhead(pending)
    const week = sched([{ id: 'e', itemType: 'project', itemId: 'ux', date: '2026-11-30' }])
    api.get.mockResolvedValue({ data: { schedule: week } })
    api.put.mockImplementation(async (_u: string, body: any) => ({ data: { schedule: sched(body.items) } }))
    expect(await useWeeklySchedule().retryAhead('p', plan, timeline, ctx)).toBe(true)
    expect(api.put).toHaveBeenCalledTimes(1)
    expect(saved()).toEqual([])
  })
  it('또 실패하면 남긴다', async () => {
    queueAhead(pending)
    api.get.mockResolvedValue({ data: { schedule: sched([{ id: 'e', itemType: 'project', itemId: 'ux', date: '2026-11-30' }]) } })
    api.put.mockRejectedValue(new Error('offline'))
    expect(await useWeeklySchedule().retryAhead('p', plan, timeline, ctx)).toBe(false)
    expect(saved()).toEqual([pending])
  })
  it('이미 옮겨졌거나 주가 지났으면 보내지 않고 버린다. 다른 계획 것은 그대로', async () => {
    queueAhead(pending)
    queueAhead({ ...pending, planId: 'other' })
    api.get.mockResolvedValue({ data: { schedule: sched([{ id: 'e', itemType: 'project', itemId: 'ux', date: '2026-11-29', note: 'ahead:2026-11-30' }]) } })
    expect(await useWeeklySchedule().retryAhead('p', plan, timeline, ctx)).toBe(false)
    expect(api.put).not.toHaveBeenCalled()
    expect(saved()).toEqual([{ ...pending, planId: 'other' }])
    queueAhead(pending)
    expect(await useWeeklySchedule().retryAhead('p', plan, timeline, { ...ctx, todayKey: '2026-12-02' })).toBe(false)
    expect(saved()).toEqual([{ ...pending, planId: 'other' }])
  })
})

describe('실패분과 계정', () => {
  const pending = { planId: 'p', weekStart: '2026-11-25', weekEnd: '2026-12-01', itemId: 'ux', from: '2026-11-30', to: '2026-11-29' }
  const ctx = { todayKey: '2026-11-29', isDone: () => false }
  it('다른 계정의 계획 것은 이 계정 일정으로 보내지 않는다(계획 id 로 가름)', async () => {
    queueAhead({ ...pending, planId: 'someone-else' })
    expect(await useWeeklySchedule().retryAhead('p', plan, timeline, ctx)).toBe(false)
    expect(api.get).not.toHaveBeenCalled()
    expect(api.put).not.toHaveBeenCalled()
  })
  it('계정이 바뀌면(로그아웃·다른 계정 로그인) 실패분을 비운다', () => {
    queueAhead(pending)
    expect(store.has(AHEAD_PENDING_KEY)).toBe(true)
    clearAccountScope()
    expect(store.has(AHEAD_PENDING_KEY)).toBe(false)
  })
})

// 달성 화면이 읽는 계획(2026-11-27 핫픽스) — 편집 사본이 다른 계획이어도 홈과 같은 '진행 중인 계획'에서 항목을 찾는다
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/shared/api', () => ({ req: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() } }))

import { useAchievementStore } from '@/shared/stores/achievement'
import { useCareerDesign } from '@/modules/career-design/composables/useCareerDesign'
import { useActivePlanSource, pickPlanSource } from '../composables/useActivePlanSource'

const project = (id: string, name: string) => ({ id, name }) as any

describe('useActivePlanSource', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const { draftPlan, draftTimeline } = useCareerDesign()
    draftPlan.planId = null
    draftPlan.projects = []
    draftPlan.routines = []
    draftTimeline.value = []
  })

  it('편집 사본이 다른 계획이어도 진행 중인 계획의 프로젝트를 준다', () => {
    const { draftPlan } = useCareerDesign()
    draftPlan.planId = 'draft-plan'
    draftPlan.projects = [project('d1', '새로 만들던 계획의 프로젝트')]
    const store = useAchievementStore()
    store.plan = { planId: 'active-plan', name: '', targetJob: '', startDate: '2026-11-02', endDate: '', reviewDay: '월', paceKey: '', paceHours: null, status: 'active', projects: [project('a1', '오늘 할 일')], routines: [], timeline: [] } as any

    const { plan } = useActivePlanSource()
    expect(plan.planId).toBe('active-plan')
    expect(plan.projects.find((p) => p.id === 'a1')?.name).toBe('오늘 할 일')
    expect(plan.projects.find((p) => p.id === 'd1')).toBeUndefined()
    expect(plan.startDate).toBe('2026-11-02')
  })

  it('진행 중인 계획을 못 읽었으면(오프라인) 편집 사본으로 그린다', () => {
    const { draftPlan } = useCareerDesign()
    draftPlan.planId = 'p1'
    draftPlan.projects = [project('x', '기기에 있던 것')]
    const { plan } = useActivePlanSource()
    expect(plan.planId).toBe('p1')
    expect(plan.projects[0]?.name).toBe('기기에 있던 것')
  })

  it('진행 중인 계획이 바뀌면 따라 바뀐다', () => {
    const store = useAchievementStore()
    const { plan } = useActivePlanSource()
    expect(plan.planId).toBeNull()
    store.plan = { planId: 'p2', startDate: '', endDate: '', reviewDay: '', projects: [], routines: [], timeline: [] } as any
    expect(plan.planId).toBe('p2')
  })

  it('pickPlanSource — 진행 중인 계획이 먼저', () => {
    expect(pickPlanSource({ planId: 'a' }, { planId: 'd' }).from).toBe('active')
    expect(pickPlanSource(null, { planId: 'd' }).from).toBe('draft')
  })
})

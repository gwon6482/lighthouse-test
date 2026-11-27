// 계정에 딸린 기기 사본 비우기(2026-11-27 오너 결정) — 계정이 바뀌거나 어떤 길로든 로그아웃될 때 비우고, 표 연장 때는 두고,
// 비회원 검사 열람 키·로그인 표는 accountScope 가 건드리지 않는다
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'

const get = vi.fn()
vi.mock('@/shared/api', () => ({
  req: { get: (...a: unknown[]) => get(...a), put: vi.fn(), post: vi.fn(), delete: vi.fn(), defaults: { headers: { common: {} as Record<string, string> } } },
}))

function memStorage() {
  const m: Record<string, string> = {}
  return {
    m,
    api: {
      getItem: (k: string) => m[k] ?? null,
      setItem: (k: string, v: string) => { m[k] = String(v) },
      removeItem: (k: string) => { delete m[k] },
      key: (i: number) => Object.keys(m)[i] ?? null,
      get length() { return Object.keys(m).length },
      clear: () => { for (const k of Object.keys(m)) delete m[k] },
    },
  }
}
const local = memStorage()
const session = memStorage()
// 앱을 열 때 쓰지 않는 사본을 지우는지 보려고 import 전에 심는다
local.m.lh_onboarding_v1 = '{"q1":1}'
vi.stubGlobal('localStorage', local.api)
vi.stubGlobal('sessionStorage', session.api)

const scope = await import('../accountScope')
const onboardingAtOpen = local.m.lh_onboarding_v1
const { useAuthStore } = await import('@/shared/stores/auth')
const { useAchievementStore } = await import('@/shared/stores/achievement')
const { useCareerDesign, DRAFT_KEY } = await import('@/modules/career-design/composables/useCareerDesign')
const { useWeeklySchedule } = await import('@/modules/career-achievement/composables/useWeeklySchedule')
const { useAddProject, ADD_PROJECT_KEY } = await import('@/modules/career-achievement/composables/useAddProject')
const { ROUTINE_END_ASKED_KEY } = await import('@/modules/career-achievement/composables/usePlanBoard')
const { STORAGE_KEY: ACH_KEY, useAchievement } = await import('@/modules/career-achievement/composables/useAchievement')
const { STORAGE_KEY: ENTRIES_KEY } = await import('@/modules/career-achievement/composables/useAchievementEntries')
const { STORAGE_KEY: CURRICULUM_KEY } = await import('@/modules/career-achievement/composables/useCurriculumCompletion')
const { FOCUS_SESSIONS_KEY } = await import('@/modules/career-achievement/lib/focusSession')
const { AHEAD_PENDING_KEY } = await import('@/modules/career-achievement/lib/pullAhead')

const fail = (status: number) => Object.assign(new Error('x'), { response: { status } })

// 계정 A 가 기기에 남긴 것
function seedAccountA() {
  local.m[DRAFT_KEY] = JSON.stringify({ draftPlan: { planId: 'planA', name: 'A의 계획', targetJob: '간호사' } })
  local.m[ACH_KEY] = '{"2026-11-27":{"projects":["p1"],"routines":[]}}'
  local.m[ENTRIES_KEY] = '{"x":{"memo":"A의 메모"}}'
  local.m[CURRICULUM_KEY] = '{"c1":true}'
  local.m[FOCUS_SESSIONS_KEY] = '{"s":1}'
  local.m[ROUTINE_END_ASKED_KEY] = '["r1"]'
  local.m[AHEAD_PENDING_KEY] = '[]'
  local.m.lh_onboarding_v1 = '{"q1":1}'
  local.m.lh_guest_survey = '{"id":"g1"}'
  local.m.lh_token = 'tokenA'
  session.m[ADD_PROJECT_KEY] = '{"active":true,"planId":"planA"}'
}
const ACCOUNT_KEYS = () => [DRAFT_KEY, ACH_KEY, ENTRIES_KEY, CURRICULUM_KEY, FOCUS_SESSIONS_KEY, ROUTINE_END_ASKED_KEY, AHEAD_PENDING_KEY, 'lh_onboarding_v1']
// 비운 기록 사본은 '{}' 로 다시 적힐 수 있다(각 모듈의 watch) — 내용이 없으면 남지 않은 것으로 본다
const leftover = () => ACCOUNT_KEYS().filter((k) => local.m[k] !== undefined && local.m[k] !== '{}' && local.m[k] !== '[]')

describe('accountScope — 계정에 딸린 기기 사본', () => {
  beforeEach(() => {
    local.api.clear()
    session.api.clear()
    get.mockReset()
    setActivePinia(createPinia())
  })

  it('지우는 열쇠 목록이 각 모듈의 열쇠와 같다', () => {
    expect([...scope.ACCOUNT_LOCAL_KEYS].sort()).toEqual(
      [DRAFT_KEY, ACH_KEY, ENTRIES_KEY, CURRICULUM_KEY, FOCUS_SESSIONS_KEY, ROUTINE_END_ASKED_KEY, AHEAD_PENDING_KEY].sort(),
    )
    expect(scope.ACCOUNT_SESSION_KEYS).toEqual([ADD_PROJECT_KEY])
  })

  it('앱을 열 때 쓰지 않는 가입 답 사본(lh_onboarding_v1)을 지운다', () => {
    expect(onboardingAtOpen).toBeUndefined()
  })

  it('clearAccountScope — 계정 사본은 지우고, 비회원 검사 열람 키·로그인 표는 둔다', async () => {
    seedAccountA()
    scope.clearAccountScope()
    await nextTick()
    expect(leftover()).toEqual([])
    expect(local.m[DRAFT_KEY]).toBeUndefined()
    expect(local.m.lh_guest_survey).toBe('{"id":"g1"}')
    expect(local.m.lh_token).toBe('tokenA')
    expect(JSON.parse(session.m[ADD_PROJECT_KEY] ?? '{}').planId ?? '').toBe('')
  })

  it('메모리의 편집 사본·계획 목록·주간 일정·새 프로젝트 흐름도 비운다', async () => {
    const cd = useCareerDesign()
    cd.draftPlan.planId = 'planA'
    cd.draftPlan.name = 'A의 계획'
    cd.draftPlan.projects = [{ id: 'p1', name: 'A' } as any]
    cd.draftProject.name = 'A의 프로젝트'
    cd.editingProjectId.value = 'p1'
    cd.plans.value = [{ id: 'x' } as any]
    useWeeklySchedule().schedules.value = [{ planId: 'planA' } as any]
    useAddProject().begin('planA')
    scope.clearAccountScope()
    await nextTick()
    expect(cd.draftPlan.planId).toBeNull()
    expect(cd.draftPlan.name).toBe('')
    expect(cd.draftPlan.projects).toEqual([])
    expect(cd.draftProject.name).toBe('')
    expect(cd.editingProjectId.value).toBeNull()
    expect(cd.plans.value).toEqual([])
    expect(useWeeklySchedule().schedules.value).toEqual([])
    expect(useAddProject().state.planId).toBe('')
    expect(local.m[DRAFT_KEY]).toBeUndefined() // 비운 값을 watch 가 다시 적어도 그 뒤에 지운다
  })

  it('로그인 표 연장(fetchMe 같은 계정 새 표)에는 편집 사본을 지우지 않는다', async () => {
    seedAccountA()
    const auth = useAuthStore()
    get.mockResolvedValueOnce({ data: { user: { uid: 'uA' }, token: 'tokenA2' } })
    expect(await auth.fetchMe()).toBe('ok')
    await nextTick()
    expect(local.m.lh_token).toBe('tokenA2')
    expect(JSON.parse(local.m[DRAFT_KEY]!).draftPlan.planId).toBe('planA')
    expect(local.m[ENTRIES_KEY]).toBe('{"x":{"memo":"A의 메모"}}')
  })

  it('401·404 로 풀리면(앱을 열자마자 표 거절) 기록 사본·멈춘 집중이 비워지고 달성 스토어가 다시 읽게 된다', async () => {
    for (const s of [401, 404]) {
      local.api.clear()
      seedAccountA()
      setActivePinia(createPinia())
      const auth = useAuthStore()
      const ach = useAchievementStore()
      ach.loaded = true
      get.mockResolvedValueOnce({ data: { records: [{ done: true, date: '2026-11-27', itemType: 'project', itemId: 'p1' }] } })
      await useAchievement().loadFromServer('planA')
      expect(useAchievement().isProjectDone('p1', '2026-11-27')).toBe(true)
      get.mockRejectedValueOnce(fail(s))
      expect(await auth.fetchMe()).toBe('invalid')
      await nextTick()
      expect(leftover()).toEqual([])
      expect(local.m.lh_guest_survey).toBe('{"id":"g1"}')
      expect(ach.loaded).toBe(false)
      expect(useAchievement().isProjectDone('p1', '2026-11-27')).toBe(false)
    }
  })

  it('로그인 표 없이 열면 주인 없는 계정 사본을 지운다(비회원 검사 진행은 둔다)', () => {
    seedAccountA()
    delete local.m.lh_token
    local.m.lh_survey_progress_v1 = '{"step":3}'
    useAuthStore()
    expect(leftover()).toEqual([])
    expect(local.m.lh_survey_progress_v1).toBe('{"step":3}')
    expect(local.m.lh_guest_survey).toBe('{"id":"g1"}')
  })

  it('계정이 바뀌면 앞 계정의 늦은 응답을 버리고 새 계정의 계획을 읽는다', async () => {
    local.m.lh_token = 'tokenA'
    const auth = useAuthStore()
    const ach = useAchievementStore()
    let releaseA!: (v: unknown) => void
    get.mockImplementationOnce(() => new Promise((r) => { releaseA = r })) // A 의 목록 — 늦게 온다
    const loadingA = ach.loadActivePlan()
    auth.setAuth('tokenB', { uid: 'uB' } as any) // 그 사이 B 로 로그인
    get.mockImplementation((url: string) => Promise.resolve(url === '/api/career-plan'
      ? { data: { plans: [{ planId: 'planB', status: 'active' }] } }
      : url === '/api/career-plan/planB'
        ? { data: { plan: { planId: 'planB', name: 'B의 계획', status: 'active', projects: [], routines: [], timeline: [] } } }
        : { data: { records: [], entries: [], items: [] } }))
    await ach.loadActivePlan()
    expect(ach.plan?.planId).toBe('planB')
    releaseA({ data: { plans: [{ planId: 'planA', status: 'active' }] } })
    await loadingA
    expect(ach.plan?.planId).toBe('planB')
    expect(ach.loaded).toBe(true)
  })
})

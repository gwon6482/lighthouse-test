// 달성 화면(집중모드·완료·이번 주 일정·주간결산)이 읽는 계획 — 홈과 같은 '진행 중인 계획'(achievement 저장소).
//
// 2026-11-27 핫픽스: 이 화면들은 진로설계의 편집 사본(draftPlan — 기기에 저장된다, lh_cd_draft)을 읽었고
// 사본에 계획 번호가 있으면 서버에서 다시 받지 않았다. 그래서 사본이 다른 계획(새로 만들던 계획·열어 본 다른 계획·
// 다른 기기에서 고치기 전의 옛 계획)이면 홈에 보이는 프로젝트를 못 찾아 '항목을 찾을 수 없어요'가 나왔다.
// 편집 사본은 진로설계가 고치는 중인 것이라 여기서 덮어쓰지 않는다(읽는 곳만 바꾼다).
//   · 진행 중인 계획을 읽었으면 그것
//   · 못 읽었거나(오프라인) 진행 중인 계획이 없으면 예전처럼 편집 사본
import { computed, reactive } from 'vue'
import { useAchievementStore } from '@/shared/stores/achievement'
import { useCareerDesign } from '@/modules/career-design/composables/useCareerDesign'
import type { DayOfWeek, Project, Routine, TimelineSlot } from '@/modules/career-design/types/career-design'

export interface ActivePlanView {
  planId: string | null
  startDate: string
  endDate: string
  reviewDay: DayOfWeek | ''
  projects: Project[]
  routines: Routine[]
}

/** 어느 쪽을 읽을지 — 화면과 무관한 판단만(시험용으로 따로 둔다) */
export function pickPlanSource<A extends { planId: string }, D>(active: A | null, draft: D): { from: 'active'; plan: A } | { from: 'draft'; plan: D } {
  return active ? { from: 'active', plan: active } : { from: 'draft', plan: draft }
}

export function useActivePlanSource() {
  const store = useAchievementStore()
  const { draftPlan, draftTimeline, fetchMyPlans, loadPlanFromApi } = useCareerDesign()

  const src = computed(() => pickPlanSource(store.plan, draftPlan))
  const plan = reactive({
    planId: computed<string | null>(() => src.value.plan.planId ?? null),
    startDate: computed(() => src.value.plan.startDate),
    endDate: computed(() => src.value.plan.endDate),
    reviewDay: computed<DayOfWeek | ''>(() => (src.value.plan.reviewDay || '') as DayOfWeek | ''),
    projects: computed<Project[]>(() => src.value.plan.projects),
    routines: computed<Routine[]>(() => src.value.plan.routines),
  }) as ActivePlanView
  const timeline = computed<TimelineSlot[]>(() => (store.plan ? store.plan.timeline : draftTimeline.value))

  /** 진행 중인 계획을 읽는다(이미 읽었으면 바로 끝난다). 없거나 못 읽었고 편집 사본도 비어 있으면 예전처럼 사본을 채운다 */
  async function load(): Promise<void> {
    await store.loadActivePlan().catch(() => {})
    if (store.plan || draftPlan.planId) return
    const plans = await fetchMyPlans()
    const target = plans.find((p: any) => p.status === 'active') ?? plans[0]
    if (target?.planId) await loadPlanFromApi(target.planId)
  }

  return { plan, timeline, load }
}

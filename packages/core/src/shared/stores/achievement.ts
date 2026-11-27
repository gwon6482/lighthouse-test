import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { req } from '@/shared/api'
import { accountGeneration, onAccountChange } from '@/shared/auth/accountScope'
import { useAchievement } from '@/modules/career-achievement/composables/useAchievement'
import { useAchievementEntries } from '@/modules/career-achievement/composables/useAchievementEntries'
import { useCurriculumCompletion } from '@/modules/career-achievement/composables/useCurriculumCompletion'
import { useFocusSessions } from '@/modules/career-achievement/composables/useFocusSessions'
import type { Project, Routine, DayOfWeek, TimelineSlot } from '@/modules/career-design/types/career-design'
import { projectedEndDate } from '@/modules/career-design/composables/usePlanTimeline'
import { computeWeekRangeContaining, generateItemsForWeek, toDateKey, useWeeklySchedule } from '@/modules/career-achievement/composables/useWeeklySchedule'

interface ActivePlan {
  planId: string
  name: string
  targetJob: string
  startDate: string
  endDate: string
  reviewDay: DayOfWeek | ''
  paceKey?: string          // 진행 속도(2026-10-30~ 서버 저장). 예전 계획은 비어 있다
  paceHours?: number | null
  status: 'draft' | 'active' | 'completed'
  projects: Project[]
  routines: Routine[]
  timeline: TimelineSlot[]
}

export const useAchievementStore = defineStore('achievement', () => {
  const plan = ref<ActivePlan | null>(null)
  const loaded = ref(false)
  const loading = ref(false)
  // 마지막 읽기가 실패했나(2026-11-25 핫픽스) — '진행 중인 계획이 없다'와 '못 읽었다'는 둘 다 plan 이 null 이라 따로 적는다.
  // 진로달성 홈이 이걸 보고 가른다: 없으면 계획 전 홈(/main/before)으로, 못 읽었으면 '다시 불러오기'
  const loadFailed = ref(false)

  const hasActivePlan = computed(() => !!plan.value && plan.value.status === 'active')

  // 하단 탭 배지 — 홈 '오늘 할 일'(usePlanBoard.itemsOn)과 같은 셈(2026-11-23 미리 하기 코드 검토 5).
  // 그 주 일정(일정 조정·미리 하기로 옮겼을 수 있다)을 받아 두었으면 그것, 없으면 계획 배치로. 예전엔 늘 계획 요일로 세서
  // 미리 해서 비운 날에도 '할 일 1'이 남았다
  const todayPendingCount = computed(() => {
    const pl = plan.value
    if (!pl) return 0
    const ach = useAchievement()
    const key = toDateKey(ach.today.value)
    const saved = useWeeklySchedule().schedules.value.find((s) => s.planId === pl.planId && s.weekStart <= key && key <= s.weekEnd)
    let items
    if (saved) items = saved.items.filter((it) => it.date === key)
    else {
      const range = computeWeekRangeContaining(ach.today.value, pl.startDate, (pl.reviewDay || '월') as DayOfWeek)
      items = range ? generateItemsForWeek(pl, pl.timeline, range.weekStart, range.weekEnd).filter((it) => it.date === key) : []
    }
    const projectIds = new Set(pl.projects.map((p) => p.id))
    const routineIds = new Set(pl.routines.map((r) => r.id))
    return items.filter((it) => (it.itemType === 'project'
      ? projectIds.has(it.itemId) && !ach.isProjectDone(it.itemId)
      : routineIds.has(it.itemId) && !ach.isRoutineDone(it.itemId))).length
  })

  // ⚠️ 읽는 중에 또 불리면 **그 결과를 기다린다**(2026-10-29). 예전엔 바로 return 해서, 하단 탭이 먼저 읽기 시작한 뒤
  //    화면이 부르면 계획이 아직 없는 채로 넘어갔다 → 진로정보의 채용 소식이 새로고침 때 안 나오던 원인
  // ⚠️ 계정이 바뀌면(accountScope) 읽던 것을 버린다(2026-11-27) — 앞 계정의 응답이 늦게 와서 새 계정의 계획 자리를 채우거나
  //    loaded=true 로 막아 새 계정의 계획을 다시 읽지 않는 일이 없게. 세대(accountGeneration)가 다르면 결과를 쓰지 않는다
  let inflight: Promise<void> | null = null
  async function loadActivePlan(force = false): Promise<void> {
    if (inflight) return inflight
    if (loaded.value && !force) return
    const p: Promise<void> = loadActivePlanNow(accountGeneration()).finally(() => { if (inflight === p) inflight = null })
    inflight = p
    return p
  }
  async function loadActivePlanNow(gen: number): Promise<void> {
    const stale = () => gen !== accountGeneration()
    loading.value = true
    try {
      const listRes = await req.get('/api/career-plan')
      if (stale()) return
      const plans = listRes.data.plans ?? []
      const target = plans.find((p: any) => p.status === 'active')
      if (!target) {
        plan.value = null
        loadFailed.value = false
        clearRecordCaches() // 계획을 지웠으면 그 기록 캐시도(로그 탭에 남지 않게)
        return
      }
      const detailRes = await req.get(`/api/career-plan/${target.planId}`)
      if (stale()) return
      const p = detailRes.data.plan
      plan.value = {
        planId:    p.planId,
        name:      p.name      ?? '',
        targetJob: p.targetJob ?? '',
        startDate: p.startDate ?? '',
        // 종료일 = 예상 완료일(배치에서 계산, 2026-11-04~). 저장된 값은 배치가 없을 때만 쓴다 — 예전 계획도 바로 맞춰진다
        endDate:   projectedEndDate(p.startDate ?? '', p.timeline ?? [], p.projects ?? [], p.reviewDay ?? '') || (p.endDate ?? ''),
        reviewDay: p.reviewDay ?? '',
        paceKey:   p.paceKey   ?? '',
        paceHours: p.paceHours ?? null,
        status:    p.status    ?? 'draft',
        projects:  p.projects  ?? [],
        routines:  p.routines  ?? [],
        timeline:  p.timeline  ?? [],
      }
      // 달성 기록·커리큘럼 완료 상태를 서버에서 로드 (localStorage → DB 전환)
      await Promise.all([
        useAchievement().loadFromServer(p.planId),
        useAchievementEntries().loadFromServer(p.planId),
        useCurriculumCompletion().loadFromServer(p.planId),
      ])
      // 기록을 받는 사이 계정이 바뀌었다 — 앞 계정의 기록이 사본에 들어갔을 수 있어 비운다.
      // 새 계정이 이미 다 읽었으면 그 기록을 다시 받는다(읽는 중이면 그쪽 응답이 덮는다)
      if (stale()) {
        clearRecordCaches()
        if (loaded.value) void loadActivePlan(true)
        return
      }
      loadFailed.value = false
    } catch {
      if (stale()) return
      plan.value = null
      loadFailed.value = true
    } finally {
      if (!stale()) {
        loaded.value = true
        loading.value = false
      }
    }
  }

  function reset() {
    plan.value = null
    loaded.value = false
    loading.value = false
    loadFailed.value = false
    inflight = null
    clearRecordCaches() // 로그아웃 — 다음 사람이 같은 기기에서 이전 기록을 보지 않게
  }
  // 계정이 바뀌는 모든 길(로그인·가입·소셜 복귀·로그아웃·탈퇴·401·404 로 풀림)에서 비운다(2026-11-27).
  // 예전엔 App.vue 의 watch(user) 만 불러서, 앱을 열자마자 표가 거절되면(null → null) 기록 사본이 남았고
  // 계정이 바로 바뀌면 loaded=true 라 새 계정의 계획을 다시 읽지 않았다
  onAccountChange(reset)
  // 기기에 캐시한 실천 기록·완료 표시·커리큘럼 완료(localStorage) 비우기(2026-11-04)
  function clearRecordCaches() {
    useAchievement().clearCache()
    useAchievementEntries().clearCache()
    useCurriculumCompletion().clearCache()
    useFocusSessions().clear() // 멈춘 집중(2026-11-19) — 로그아웃·진행 중인 계획이 없어졌을 때
  }

  return {
    plan,
    loaded,
    loading,
    loadFailed,
    hasActivePlan,
    todayPendingCount,
    loadActivePlan,
    reset,
  }
})

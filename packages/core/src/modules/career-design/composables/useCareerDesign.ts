import { ref, reactive, watch } from 'vue'
import type { CareerPlan, Project, Routine, DraftPlan, TimelineSlot } from '../types/career-design'
import { req } from '@/shared/api'
import { DEFAULT_WEEKS } from './useProjectCurriculum'
import { projectedEndDate, toDateKey } from './usePlanTimeline'
import { getToday } from '@/shared/utils/dev-date'

// ── 작성 중 draft 자동저장/복원 (R3) ──
// 진로계획 작성(플랜/프로젝트/루틴/타임라인)은 메모리 전용이라 새로고침·앱종료 시 전부 유실됐다.
// 설문 useSurvey.persistProgress 패턴처럼 localStorage 에 스냅샷을 저장/복원한다.
const DRAFT_KEY = 'lh_cd_draft'
interface PersistedDraft {
  draftPlan?: Partial<DraftPlan>
  draftRoutine?: Partial<Routine>
  draftProject?: Partial<Project>
  draftTimeline?: TimelineSlot[]
  editingProjectId?: string | null
  editingRoutineId?: string | null
}
function loadDraft(): PersistedDraft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}
const savedDraft = loadDraft()

const draftPlan = reactive<DraftPlan>({
  planId: null,
  name: '',
  targetJob: '',
  projects: [],
  routines: [],
  startDate: '',
  endDate: '',
  reviewDay: '',
  timeline: [],
  ...savedDraft.draftPlan,
})

// 루틴 작성 중 값(2026-11-21 루틴 리뉴얼 — 알림 칸은 뺐다, 종류·함께 할 프로젝트·기록 재기 칸을 더했다)
const draftRoutine = reactive<Partial<Routine>>({
  name: '',
  days: ['월', '화', '수', '목', '금'],
  duration: 30,
  memo: '',
  kind: 'keep',
  projectId: '',
  measure: null,
  onCourseDays: false,
  ...savedDraft.draftRoutine,
})

const editingRoutineId = ref<string | null>(savedDraft.editingRoutineId ?? null)

const draftProject = reactive<Partial<Project>>({
  category: 'knowledge',
  name: '',
  goal: '',
  days: ['월', '화', '수', '목'],
  duration: 60,
  priority: 'normal',
  notification: false,
  missedNotification: true,
  notificationTime: '09:00',
  memo: '',
  weeks: DEFAULT_WEEKS,
  curriculum: [],
  ...savedDraft.draftProject,
})

const editingProjectId = ref<string | null>(savedDraft.editingProjectId ?? null)
const draftTimeline = ref<TimelineSlot[]>(savedDraft.draftTimeline ?? [])
const plans = ref<CareerPlan[]>([])

// 변경 시마다 draft 스냅샷 저장(deep). 신규 시작(startPlan→resetDraftPlan)이나 완료 시에도
// reset 이 draft 를 비우면 watch 가 빈 상태로 갱신하므로 이전 draft 가 되살아나지 않는다.
function persistDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      draftPlan,
      draftRoutine,
      draftProject,
      draftTimeline: draftTimeline.value,
      editingProjectId: editingProjectId.value,
      editingRoutineId: editingRoutineId.value,
    }))
  } catch { /* quota */ }
}
watch(
  [draftPlan, draftRoutine, draftProject, draftTimeline, editingProjectId, editingRoutineId],
  persistDraft,
  { deep: true },
)

// 종료일 = 예상 완료일(2026-11-04~, 사용자가 정하지 않는다). 프로젝트·배치·시작일·시작 요일이 바뀌면 다시 계산한다
watch(
  () => [draftTimeline.value, draftPlan.projects, draftPlan.startDate, draftPlan.reviewDay] as const,
  () => {
    const start = draftPlan.startDate || toDateKey(getToday())
    draftPlan.endDate = projectedEndDate(start, draftTimeline.value, draftPlan.projects, draftPlan.reviewDay)
  },
  { deep: true, immediate: true },
)

async function fetchPublicPlans(q?: string): Promise<void> {
  try {
    const params = q ? { q } : {}
    const res = await req.get('/api/career-plan/templates', { params })
    plans.value = (res.data.plans ?? []).map((p: any) => ({ ...p, id: p._id ?? p.id }))
  } catch {
    // API 실패 시 빈 목록 유지
  }
}

// 수정 중(draftPlan.editing)에는 단계마다 서버에 보내지 않고 들고 있다가 '저장하고 돌아가기'에서 한 번에 보낸다(commitEdit).
// 그래야 헤더의 '수정 취소'가 정말로 아무것도 바꾸지 않는다(2026-11-04). committing 동안만 실제로 보낸다
let committing = false
const holdSync = () => !draftPlan.planId || (!!draftPlan.editing && !committing)

export function useCareerDesign() {
  const targetJob = ref('')

  function getProjectById(projectId: string): Project | undefined {
    for (const plan of plans.value) {
      const found = plan.projects.find(p => p.id === projectId)
      if (found) return found
    }
    return undefined
  }

  function resetDraftPlan() {
    draftPlan.planId = null
    draftPlan.name = ''
    draftPlan.targetJob = ''
    draftPlan.projects = []
    draftPlan.routines = []
    draftPlan.startDate = ''
    draftPlan.endDate = ''
    draftPlan.reviewDay = ''
    draftPlan.weeklyHours = undefined
    draftPlan.timelineManual = undefined
    draftPlan.examLate = undefined
    draftPlan.paceKey = undefined
    draftPlan.dailyHours = undefined
    draftPlan.editing = undefined
    draftPlan.editBase = undefined
    draftPlan.targetJobCode = undefined
    draftPlan.templateTrack = undefined
    draftPlan.timeline = []
    draftTimeline.value = []
  }

  function resetDraftRoutine() {
    draftRoutine.name = ''
    draftRoutine.days = ['월', '화', '수', '목', '금']
    draftRoutine.duration = 30
    draftRoutine.memo = ''
    draftRoutine.kind = 'keep'
    draftRoutine.projectId = ''
    draftRoutine.measure = null
    draftRoutine.onCourseDays = false
    delete draftRoutine.minMinutes
    delete draftRoutine.safety
    delete draftRoutine.notification
    delete draftRoutine.notificationTime
    delete draftRoutine.id
    delete draftRoutine.records
    delete draftRoutine.pauseWeeks
    delete draftRoutine.endedAt
  }

  // ── API 연동 ────────────────────────────────────────────────

  // STEP1 완료 시: 계획 생성 or 수정
  async function syncPlanStep1(): Promise<boolean> {
    try {
      const payload = {
        name:      draftPlan.name,
        targetJob: draftPlan.targetJob,
        startDate: draftPlan.startDate,
        endDate:   draftPlan.endDate,
        // 진행 속도도 서버에(2026-10-30~) — 주간결산에서 '지금 속도'로 쓰고 바꿀 수 있다
        ...(draftPlan.paceKey ? { paceKey: draftPlan.paceKey } : {}),
        ...(draftPlan.weeklyHours ? { paceHours: draftPlan.weeklyHours } : {}),
      }
      if (draftPlan.planId) {
        await req.put(`/api/career-plan/${draftPlan.planId}`, payload)
      } else {
        const res = await req.post('/api/career-plan', payload)
        draftPlan.planId = res.data.plan.planId

        // 복사된 프로젝트가 있으면 일괄 동기화 (붙여넣기 플로우)
        if (draftPlan.projects.length > 0) {
          await req.post(`/api/career-plan/${draftPlan.planId}/projects/bulk`, {
            projects: draftPlan.projects
          })
        }
      }
      return true
    } catch {
      return false
    }
  }

  // 목표 설정이 맨 끝(2026-10-20)이라, 그 전 단계는 계획 ID 없이 로컬에만 쌓인다(각 sync* 는 ID 가 없으면 안 보냄).
  // 마지막에 한 번에 올린다: 계획 생성 + 프로젝트 일괄(syncPlanStep1) → 루틴 → 타임라인 → 리뷰 요일.
  // 이미 서버에 있는 계획(planId)이면 앞 단계가 그때그때 저장됐으므로 개요만 고친다.
  // 프로젝트 ID 는 앱이 만든 값을 서버가 그대로 쓴다(projects/bulk) → 타임라인 슬롯 연결이 유지된다.
  async function finalizePlan(): Promise<boolean> {
    if (draftPlan.editing) return true // 수정 중엔 commitEdit 이 한꺼번에
    const isNew = !draftPlan.planId
    if (!(await syncPlanStep1())) return false
    if (!isNew) return true
    let ok = true
    for (const r of draftPlan.routines) ok = (await syncAddRoutine(r)) && ok
    ok = (await syncTimeline()) && ok
    if (draftPlan.reviewDay) ok = (await syncPlanReviewDay()) && ok
    return ok
  }

  // 프로젝트 실행 설정 — ⚠️ 2026-10-29 전엔 보내지 않아(서버도 버렸다) 모든 프로젝트가 0분으로 저장됐다
  const projectSettingsPayload = (p: Project) => ({
    duration: p.duration, priority: p.priority, notification: p.notification,
    missedNotification: p.missedNotification, notificationTime: p.notificationTime, memo: p.memo,
    // 과정·과정 중 표시(2026-11-16) — 주간결산에서 속도를 바꿔 다시 배치할 때도 과정에 묶여 있게 서버에 남긴다
    ...(p.course ? { course: true } : {}), ...(p.during ? { during: true } : {}),
    // 프로젝트 종류 '과정'(2026-11-16) — 집중모드 없이 '완료' 한 번, 속도와 상관없이 기간 그대로. 그만둔 날은 주간결산이 적는다
    ...(p.period ? { period: true } : {}), ...(p.stoppedAt ? { stoppedAt: p.stoppedAt } : {}),
    // 고치기에서 과정 → 진도로 바꾸면 false 가 온다 — 서버는 false 를 받아야 끈다(projectSettings partial)
    ...(p.period === false ? { period: false } : {}),
    // 큰 시험 분량·나란히(2026-11-17) — 주간결산 속도 바꾸기가 남은 시험 기간을 다시 센다. 사용자가 기간을 직접 고쳐 끊으면 0 이 간다
    ...(p.studyHours !== undefined ? { studyHours: p.studyHours } : {}),
    ...(p.alongside !== undefined ? { alongside: p.alongside } : {}),
    // 날짜로 정한 프로젝트(2026-11-25) — 두 칸을 함께. 주 수로 바꾸면 '' 둘을 보내 서버가 지운다(서버는 둘이 함께일 때만 받는다)
    ...(p.dateStart !== undefined || p.dateEnd !== undefined ? { dateStart: p.dateStart ?? '', dateEnd: p.dateEnd ?? '' } : {}),
  })

  // STEP2: 프로젝트 추가
  async function syncAddProject(project: Project): Promise<boolean> {
    if (holdSync()) return true
    try {
      const res = await req.post(`/api/career-plan/${draftPlan.planId}/projects`, {
        name:       project.name,
        category:   project.category,
        goal:       project.goal,
        days:       project.days,
        startTime:  project.notificationTime,
        endTime:    '',
        curriculum: project.curriculum,
        method:       project.method ?? null,
        methodDetail: project.methodDetail ?? {},
        ...projectSettingsPayload(project),
      })
      // 서버에서 반환된 id로 local id 동기화
      project.id = res.data.project.id
      return true
    } catch {
      return false
    }
  }

  // STEP2: 프로젝트 수정
  async function syncUpdateProject(project: Project): Promise<boolean> {
    if (holdSync()) return true
    try {
      await req.put(`/api/career-plan/${draftPlan.planId}/projects/${project.id}`, {
        name:       project.name,
        category:   project.category,
        goal:       project.goal,
        days:       project.days,
        startTime:  project.notificationTime,
        curriculum: project.curriculum,
        method:       project.method ?? null,
        methodDetail: project.methodDetail ?? {},
        ...projectSettingsPayload(project),
      })
      return true
    } catch {
      return false
    }
  }

  // STEP2: 프로젝트 삭제
  async function syncDeleteProject(projectId: string): Promise<boolean> {
    if (holdSync()) return true
    try {
      await req.delete(`/api/career-plan/${draftPlan.planId}/projects/${projectId}`)
      return true
    } catch {
      return false
    }
  }

  // 루틴 칸(2026-11-21 루틴 리뉴얼) — 알림 칸은 보내지 않는다(정할 것 7). 새 칸은 옛 서버가 버린다(그래도 이름·요일·시간은 저장된다).
  // 비운 칸은 null·'' 로 보내 서버가 지운다(고칠 때 종류를 바꾸거나 프로젝트를 떼면)
  const routinePayload = (r: Routine) => ({
    name: r.name,
    days: r.days,
    duration: r.duration,
    memo: r.memo ?? '',
    kind: r.kind ?? null,
    projectId: r.projectId || '',
    measure: r.measure ?? null,
    minMinutes: r.minMinutes ?? null,
    safety: r.safety ?? null,
    ...(r.onCourseDays !== undefined ? { onCourseDays: r.onCourseDays } : {}),
  })

  // 루틴 추가
  async function syncAddRoutine(routine: Routine): Promise<boolean> {
    if (holdSync()) return true
    try {
      const res = await req.post(`/api/career-plan/${draftPlan.planId}/routines`, routinePayload(routine))
      routine.id = res.data.routine.id
      return true
    } catch {
      return false
    }
  }

  // 루틴 수정
  async function syncUpdateRoutine(routine: Routine): Promise<boolean> {
    if (holdSync()) return true
    try {
      await req.put(`/api/career-plan/${draftPlan.planId}/routines/${routine.id}`, routinePayload(routine))
      return true
    } catch {
      return false
    }
  }

  // 루틴 삭제
  async function syncDeleteRoutine(routineId: string): Promise<boolean> {
    if (holdSync()) return true
    try {
      await req.delete(`/api/career-plan/${draftPlan.planId}/routines/${routineId}`)
      return true
    } catch {
      return false
    }
  }

  // STEP3: 타임라인 저장
  async function syncTimeline(): Promise<boolean> {
    if (holdSync()) return true
    try {
      await req.put(`/api/career-plan/${draftPlan.planId}/timeline`, {
        timeline: draftTimeline.value,
      })
      return true
    } catch {
      return false
    }
  }

  // 주간리뷰 요일 저장 — 진로계획 마지막 단계에서 사용자가 선택
  async function syncPlanReviewDay(): Promise<boolean> {
    if (!draftPlan.planId) return false
    if (holdSync()) return true
    try {
      await req.put(`/api/career-plan/${draftPlan.planId}`, { reviewDay: draftPlan.reviewDay })
      return true
    } catch {
      return false
    }
  }

  // 마이페이지 등에서 저장된 계획 불러오기
  // 수정 마침 — 원본(editBase)과 비교해 바뀐 것만 보낸다: 지운 프로젝트·루틴 삭제 → 새로 만든 것 추가(서버가 준 ID 로
  // 타임라인 연결을 고친다) → 고친 것 수정 → 타임라인 → 개요(이름·목표·기간·속도) → 시작 요일. 하나라도 실패하면 false
  async function commitEdit(): Promise<boolean> {
    const base = draftPlan.editBase
    if (!draftPlan.planId || !draftPlan.editing || !base) return false
    committing = true
    try {
      let ok = true
      const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
      const baseProjects = new Map(base.projects.map((p) => [p.id, p]))
      const baseRoutines = new Map(base.routines.map((r) => [r.id, r]))
      const nowProjectIds = new Set(draftPlan.projects.map((p) => p.id))
      const nowRoutineIds = new Set(draftPlan.routines.map((r) => r.id))

      for (const p of base.projects) if (!nowProjectIds.has(p.id)) ok = (await syncDeleteProject(p.id)) && ok
      for (const r of base.routines) if (!nowRoutineIds.has(r.id)) ok = (await syncDeleteRoutine(r.id)) && ok

      for (const p of draftPlan.projects) {
        const was = baseProjects.get(p.id)
        if (!was) {
          const localId = p.id
          ok = (await syncAddProject(p)) && ok // p.id 가 서버 ID 로 바뀐다
          if (p.id !== localId) {
            for (const slot of draftTimeline.value) for (const sp of slot.projects) if (sp.id === localId) sp.id = p.id
            // 이 프로젝트에 붙은 루틴도 새 ID 로(2026-11-21 루틴 리뉴얼)
            for (const r of draftPlan.routines) if (r.projectId === localId) r.projectId = p.id
          }
        } else if (!same(p, was)) {
          ok = (await syncUpdateProject(p)) && ok
        }
      }
      for (const r of draftPlan.routines) {
        const was = baseRoutines.get(r.id)
        if (!was) ok = (await syncAddRoutine(r)) && ok
        else if (!same(r, was)) ok = (await syncUpdateRoutine(r)) && ok
      }
      if (!same(draftTimeline.value, base.timeline)) ok = (await syncTimeline()) && ok
      ok = (await syncPlanStep1()) && ok
      if (draftPlan.reviewDay !== base.reviewDay) ok = (await syncPlanReviewDay()) && ok
      return ok
    } finally {
      committing = false
    }
  }

  async function loadPlanFromApi(planId: string): Promise<boolean> {
    try {
      const res = await req.get(`/api/career-plan/${planId}`)
      const plan = res.data.plan
      draftPlan.planId    = plan.planId
      draftPlan.name      = plan.name      ?? ''
      draftPlan.targetJob = plan.targetJob ?? ''
      draftPlan.startDate = plan.startDate ?? ''
      draftPlan.endDate   = plan.endDate   ?? ''
      draftPlan.reviewDay = plan.reviewDay ?? ''
      draftPlan.paceKey   = plan.paceKey || undefined
      draftPlan.weeklyHours = plan.paceHours ?? undefined
      // 올인은 하루 시간을 저장된 주당 시간에서 되살린다(주 6일) — 없으면 수정 화면이 하루 4시간으로 돌아가 시험 기간이 바뀌었다(검토 11-17 L2와 같은 종류)
      draftPlan.dailyHours = plan.paceKey === 'allin' && plan.paceHours ? Math.round(plan.paceHours / 6) : undefined
      draftPlan.projects  = plan.projects  ?? []
      draftPlan.routines  = plan.routines  ?? []
      draftTimeline.value = plan.timeline  ?? []
      draftPlan.editing   = true // 계획 상세에서 '수정'으로 불렀다 — 단계 흐름이 수정 모드가 된다
      draftPlan.editBase  = JSON.parse(JSON.stringify({
        name: draftPlan.name, targetJob: draftPlan.targetJob, startDate: draftPlan.startDate, endDate: draftPlan.endDate,
        reviewDay: draftPlan.reviewDay, projects: draftPlan.projects, routines: draftPlan.routines, timeline: draftTimeline.value,
      }))
      return true
    } catch {
      return false
    }
  }

  // 마이페이지용: 내 계획 목록 조회
  async function fetchMyPlans(): Promise<any[]> {
    try {
      const res = await req.get('/api/career-plan')
      return res.data.plans ?? []
    } catch {
      return []
    }
  }

  function resetDraftProject() {
    draftProject.category = 'knowledge'
    draftProject.name = ''
    draftProject.goal = ''
    draftProject.days = ['월', '화', '수', '목']
    draftProject.duration = 60
    draftProject.priority = 'normal'
    draftProject.notification = false
    draftProject.missedNotification = true
    draftProject.notificationTime = '09:00'
    draftProject.memo = ''
    draftProject.weeks = DEFAULT_WEEKS
    draftProject.curriculum = []
    draftProject.method = null
    draftProject.methodDetail = {}
    // 템플릿·과정 표시(2026-11-16) — 고치던 프로젝트의 표시가 새 프로젝트에 따라붙지 않게
    delete draftProject.period
    delete draftProject.stoppedAt
    delete draftProject.course
    delete draftProject.during
    // 날짜로 정한 프로젝트(2026-11-25) — 고치던 프로젝트의 날짜가 새 프로젝트에 따라붙지 않게
    delete draftProject.dateStart
    delete draftProject.dateEnd
  }

  return {
    targetJob,
    plans,
    draftPlan,
    draftProject,
    draftRoutine,
    draftTimeline,
    editingProjectId,
    editingRoutineId,
    getProjectById,
    resetDraftPlan,
    resetDraftProject,
    resetDraftRoutine,
    syncPlanStep1,
    finalizePlan,
    syncAddProject,
    syncUpdateProject,
    syncDeleteProject,
    syncAddRoutine,
    syncUpdateRoutine,
    syncDeleteRoutine,
    syncTimeline,
    syncPlanReviewDay,
    loadPlanFromApi,
    commitEdit,
    fetchMyPlans,
    fetchPublicPlans,
  }
}

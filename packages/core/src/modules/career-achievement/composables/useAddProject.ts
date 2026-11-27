// 홈에서 새 프로젝트 시작하기(#99, 2026-11-26) — 고르기(AddProjectSheet) → 만들기(진로설계 '새로운 프로젝트 추가' add 모드) → 확인(AddConfirmPage) 사이의 상태와 저장.
// 계산은 lib/addProject.ts. 프로젝트 값은 진로설계의 draftProject 를 그대로 쓴다(만들기 화면을 다시 쓰려고 — 시안 '내가 정한 것' 3).
// ⚠️ 계획 전체 수정(commitEdit)은 쓰지 않는다 — 프로젝트 하나 더하기 + 타임라인 저장만(루틴·시작 요일·목표는 건드리지 않는다)
import { reactive, watch } from 'vue'
import { req } from '@/shared/api'
import { onAccountChange } from '@/shared/auth/accountScope'
import type { Project, TimelineSlot } from '@/modules/career-design/types/career-design'
import { useCareerDesign } from '@/modules/career-design/composables/useCareerDesign'
import { DEFAULT_WEEKS } from '@/modules/career-design/composables/useProjectCurriculum'
import { withSlot, type StartWhen } from '../lib/addProject'

export const ADD_PROJECT_KEY = 'lh_add_project_v1'
const KEY = ADD_PROJECT_KEY
export interface AddState { active: boolean; source: 'example' | 'manual'; when: StartWhen; planId: string; savedId: string }
const blank = (): AddState => ({ active: false, source: 'manual', when: 'today', planId: '', savedId: '' })
function read(): AddState {
  try { return { ...blank(), ...JSON.parse(sessionStorage.getItem(KEY) || '{}') } } catch { return blank() }
}
const state = reactive<AddState>(read())
watch(state, (v) => { try { sessionStorage.setItem(KEY, JSON.stringify(v)) } catch { /* 저장 못 해도 이번 화면은 된다 */ } }, { deep: true })
// 계정이 바뀌면 앞 계정의 '새 프로젝트 시작하기' 흐름(planId)을 버린다(2026-11-27). 만들던 프로젝트 값은 진로설계가 비운다
onAccountChange(() => { Object.assign(state, blank()) })

// 예시에서 고른 걸음 → 만들기 화면 값. 설계 중에만 쓰는 칸(출처·수준·설명·공식 안내 등)은 담지 않는다
const COPY_KEYS = ['category', 'name', 'goal', 'days', 'duration', 'priority', 'notification', 'missedNotification', 'notificationTime', 'memo', 'weeks', 'curriculum', 'method', 'methodDetail', 'studyHours'] as const

export function useAddProject() {
  const { draftProject, resetDraftProject, editingProjectId } = useCareerDesign()

  /** 고르기 → 만들기. 예시면 값을 채운다 */
  function begin(planId: string, example?: Project) {
    resetDraftProject()
    editingProjectId.value = null   // 계획 수정에서 고치던 프로젝트가 남아 있으면 그걸 고치는 화면이 된다
    if (example) {
      const src = JSON.parse(JSON.stringify(example)) as Project
      for (const k of COPY_KEYS) if (src[k] !== undefined) (draftProject as Record<string, unknown>)[k] = src[k]
      draftProject.weeks = src.curriculum?.length || src.weeks || DEFAULT_WEEKS
    }
    Object.assign(state, { ...blank(), active: true, source: example ? 'example' : 'manual', planId })
  }
  function end() {
    Object.assign(state, blank())
    resetDraftProject()
  }

  /**
   * 저장 — 프로젝트 하나 더하기(시작일만: startOn) → 타임라인에 한 자리 → 예상 완료일이 바뀌면 계획의 종료일.
   * 타임라인은 저장 직전에 서버에서 다시 읽어 더한다(다른 기기에서 바꾼 배치를 덮지 않게). 프로젝트를 더한 뒤 실패하면 번호를 들고 있다가 다시 눌렀을 때 더하지 않는다
   */
  async function save(o: { planId: string; project: Project; week: number; startOn?: string; endDate?: string; endBefore?: string }): Promise<string> {
    let id = state.savedId
    if (!id) {
      const p = o.project
      const res = await req.post(`/api/career-plan/${o.planId}/projects`, {
        name: p.name, category: p.category, goal: p.goal ?? '', days: p.days, startTime: p.notificationTime ?? '', endTime: '',
        curriculum: p.curriculum ?? [], method: p.method ?? null, methodDetail: p.methodDetail ?? {},
        duration: p.duration, priority: p.priority, notification: p.notification, missedNotification: p.missedNotification,
        notificationTime: p.notificationTime, memo: p.memo ?? '',
        ...(p.studyHours ? { studyHours: p.studyHours } : {}),
        ...(p.dateStart && p.dateEnd ? { dateStart: p.dateStart, dateEnd: p.dateEnd } : {}),
        ...(o.startOn ? { startOn: o.startOn } : {}),
      })
      id = String(res.data.project.id)
      state.savedId = id
    }
    const fresh = (await req.get(`/api/career-plan/${o.planId}`)).data.plan as { timeline?: TimelineSlot[] }
    const timeline = withSlot(fresh.timeline ?? [], { ...o.project, id }, o.week)
      .map((s) => ({ week: s.week, projects: s.projects.map((p) => ({ id: p.id })) }))
    await req.put(`/api/career-plan/${o.planId}/timeline`, { timeline })
    if (o.endDate && o.endDate !== o.endBefore) await req.put(`/api/career-plan/${o.planId}`, { endDate: o.endDate })
    return id
  }

  return { state, draftProject, begin, end, save }
}

// 진로계획 단계 흐름 — 새로 만들기와 수정하기의 순서를 한곳에서 정한다(2026-11-03).
//
//   새 계획: (템플릿) → ① 프로젝트 → ② 속도 → ③ 타임라인 → ④ 루틴 → ⑤ 시작 요일 → ⑥ 목표·기간 → 완성
//   수정:   (계획 상세) → ① 프로젝트 → ③ 타임라인 → ④ 루틴 → ⑤ 시작 요일 → ⑥ 목표·기간 → 수정 완료
//
// 수정에서 속도를 건너뛰는 이유: 속도를 고르면 타임라인을 통째로 다시 배치해서, 손으로 맞춘 배치가 사라진다.
// 속도를 바꾸고 싶으면 타임라인 화면의 '속도 다시 정하기'로 들어간다.
// 수정 여부는 draftPlan.editing(계획 상세에서 loadPlanFromApi 로 불렀을 때 true).
import { computed } from 'vue'
import { useCareerDesign } from './useCareerDesign'

export type DesignStepKey = 'projects' | 'pace' | 'timeline' | 'routines' | 'reviewDay' | 'overview'

const STEPS: { key: DesignStepKey; path: string; label: string; newOnly?: boolean }[] = [
  { key: 'projects',  path: '/career-design/plan/projects',   label: '프로젝트' },
  { key: 'pace',      path: '/career-design/plan/pace',       label: '속도', newOnly: true },
  { key: 'timeline',  path: '/career-design/complete',        label: '타임라인' },
  { key: 'routines',  path: '/career-design/plan/routines',   label: '루틴' },
  { key: 'reviewDay', path: '/career-design/plan/review-day', label: '시작 요일' },
  { key: 'overview',  path: '/career-design/plan/new',        label: '목표·기간' },
]
const RESULT_PATH = '/career-design/result'
const TEMPLATES_PATH = '/career-design/templates'

export const DESIGN_STEP_PATH = Object.fromEntries(STEPS.map((s) => [s.key, s.path])) as Record<DesignStepKey, string>

export function useDesignSteps() {
  const { draftPlan } = useCareerDesign()
  const editing = computed(() => !!draftPlan.editing && !!draftPlan.planId)
  const steps = computed(() => (editing.value ? STEPS.filter((s) => !s.newOnly) : STEPS))
  const detailPath = computed(() => `/career-design/plan/${draftPlan.planId}`)

  function indexOf(key: DesignStepKey) {
    return steps.value.findIndex((s) => s.key === key)
  }
  /** 이전 단계 주소 — 첫 단계의 이전은 새 계획이면 템플릿, 수정이면 계획 상세 */
  function prevPath(key: DesignStepKey): string {
    const i = indexOf(key)
    if (i > 0) return steps.value[i - 1]!.path
    if (i === 0) return editing.value ? detailPath.value : TEMPLATES_PATH
    // 수정 흐름에 없는 단계(속도)에 '속도 다시 정하기'로 들어왔으면 타임라인으로 돌아간다
    return DESIGN_STEP_PATH.timeline
  }
  /** 다음 단계 주소 — 마지막 다음은 완성(수정이면 수정 완료) */
  function nextPath(key: DesignStepKey): string {
    const i = indexOf(key)
    if (i >= 0 && i < steps.value.length - 1) return steps.value[i + 1]!.path
    if (i === -1) return DESIGN_STEP_PATH.timeline
    return RESULT_PATH
  }
  /** 단계 표시용 — 흐름에 없는 단계면 null */
  function stepInfo(key: DesignStepKey) {
    const i = indexOf(key)
    if (i < 0) return null
    return { no: i + 1, total: steps.value.length, label: steps.value[i]!.label, editing: editing.value }
  }

  return { editing, steps, detailPath, prevPath, nextPath, stepInfo, lastStepPath: computed(() => steps.value[steps.value.length - 1]!.path) }
}

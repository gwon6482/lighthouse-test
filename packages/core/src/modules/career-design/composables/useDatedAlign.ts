// 날짜로 정한 프로젝트를 작성 중인 계획(draft)에서 날짜에 다시 맞추기(2026-11-25, lib/projectDates.ts alignDated).
//   · 새 계획에서 시작 요일을 고를 때(⑤) — 주 경계가 바뀌어 걸친 주 수(6↔7)와 자리가 바뀐다. 손으로 옮긴 타임라인이어도 날짜 걸음만은 다시 맞춘다
//   · 새 계획의 시작일이 목표 설정 단계에서 오늘로 바뀔 때
//   · 수정 흐름에서 날짜를 바꾼 걸음 — 전체를 다시 놓지 않고 그 걸음만 옮긴다(수정 중엔 자동으로 다시 놓지 않는 규칙)
import { useCareerDesign } from './useCareerDesign'
import { toDateKey } from './usePlanTimeline'
import { buildTimeline, examAgeOptions } from './usePlanPace'
import { alignDated } from '../lib/projectDates'
import { budgetHours, stripLoad, withRoutineLoad } from '../lib/routine'
import { getToday } from '@/shared/utils/dev-date'
import { useAuthStore } from '@/shared/stores/auth'

export function useDatedAlign() {
  const { draftPlan, draftTimeline } = useCareerDesign()
  const auth = useAuthStore()
  const ctx = () => ({ startDate: draftPlan.startDate || toDateKey(getToday()), reviewDay: draftPlan.reviewDay })

  /**
   * 날짜 걸음을 날짜에 다시 맞춘다. 바뀐 것이 있으면 true.
   * rebuild = 새 계획이고 손으로 옮기지 않았으면 전체를 다시 놓는다(둘레 걸음도 새 자리에 맞게). 아니면 날짜 걸음만 옮긴다
   */
  function alignDraft({ rebuild }: { rebuild: boolean }): boolean {
    const c = ctx()
    const r = alignDated(draftPlan.projects, draftTimeline.value, c)
    if (!r.changed) return false
    draftPlan.projects.splice(0, draftPlan.projects.length, ...r.projects)
    if (!draftTimeline.value.length) return true          // 아직 배치 전(속도 단계 전) — 주 수만 맞춘다
    if (rebuild && !draftPlan.timelineManual && draftPlan.weeklyHours) {
      const L = withRoutineLoad(draftPlan.projects, draftPlan.routines)
      const opts = examAgeOptions(c.startDate, auth.user?.age, draftPlan.reviewDay)
      draftTimeline.value = stripLoad(buildTimeline(L.projects, budgetHours(draftPlan.weeklyHours, L.freeMin), opts, { ...c, late: new Set(draftPlan.examLate ?? []) }), draftPlan.projects)
    } else {
      draftTimeline.value = r.timeline
    }
    return true
  }
  return { alignDraft }
}

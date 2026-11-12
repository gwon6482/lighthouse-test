// 템플릿 없이 빈 계획으로 시작 — 진로계획 첫 화면(목표 직업에 템플릿이 없을 때)과 템플릿 화면의 '직접 설계하기'가 같이 쓴다.
// 예전 진로설계 화면의 [진로계획 시작하기]와 같다(빈 계획 + 목표 진로를 직업 칸에)
import type { Router } from 'vue-router'
import { useCareerDesign } from './useCareerDesign'
import { toDateKey } from './usePlanTimeline'
import { getToday } from '@/shared/utils/dev-date'

export function startManualPlan(router: Router, targetTitle?: string) {
  const { draftPlan, resetDraftPlan } = useCareerDesign()
  resetDraftPlan()
  if (targetTitle) draftPlan.targetJob = targetTitle
  draftPlan.startDate = toDateKey(getToday())
  router.push('/career-design/plan/projects')
}

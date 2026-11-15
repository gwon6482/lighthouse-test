// 템플릿 없이 빈 계획으로 시작 — 진로계획 첫 화면(목표 직업에 템플릿이 없을 때)과 템플릿 화면의 '직접 설계하기'가 같이 쓴다.
// 예전 진로설계 화면의 [진로계획 시작하기]와 같다(빈 계획 + 목표 진로를 직업 칸에)
import type { Router } from 'vue-router'
import { useCareerDesign } from './useCareerDesign'
import { toDateKey } from './usePlanTimeline'
import { getToday } from '@/shared/utils/dev-date'

// targetJobCode: 목표 직업에 예시 진로설계가 있을 때만 넘긴다(템플릿 화면의 '직접 설계하기') — 프로젝트 구성의 도우미 추천이 이 코드로 예시를 찾고,
//   첫 단계의 '이전'이 템플릿 화면으로 돌아간다. 직접 적은 목표처럼 계획이 없으면 비워 둔다
export function startManualPlan(router: Router, targetTitle?: string, targetJobCode?: string) {
  const { draftPlan, resetDraftPlan } = useCareerDesign()
  resetDraftPlan()
  if (targetTitle) draftPlan.targetJob = targetTitle
  if (targetJobCode) draftPlan.targetJobCode = targetJobCode
  draftPlan.startDate = toDateKey(getToday())
  router.push('/career-design/plan/projects')
}

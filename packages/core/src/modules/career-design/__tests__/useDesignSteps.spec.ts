import { describe, it, expect, beforeEach } from 'vitest'
import { useCareerDesign } from '../composables/useCareerDesign'
import { useDesignSteps } from '../composables/useDesignSteps'

// 2026-11-03: 수정이 완성 화면으로 바로 가서 앞 단계로 가려면 헤더 뒤로가기를 눌러야 했다 → 단계 흐름을 한곳에서
describe('useDesignSteps', () => {
  const { draftPlan, resetDraftPlan } = useCareerDesign()
  beforeEach(() => resetDraftPlan())

  it('새 계획: 템플릿 → 프로젝트 → 속도 → 타임라인 → 루틴 → 시작 요일 → 목표·기간 → 완성', () => {
    const { prevPath, nextPath, stepInfo } = useDesignSteps()
    expect(prevPath('projects')).toBe('/career-design/templates')
    expect(nextPath('projects')).toBe('/career-design/plan/pace')
    expect(nextPath('pace')).toBe('/career-design/complete')
    expect(prevPath('timeline')).toBe('/career-design/plan/pace')
    expect(nextPath('overview')).toBe('/career-design/result')
    expect(stepInfo('pace')).toEqual({ no: 2, total: 6, label: '속도', editing: false })
  })

  it('수정: 계획 상세 → 프로젝트 → 타임라인(속도 건너뜀) → … → 수정 완료', () => {
    draftPlan.planId = 'plan-1'
    draftPlan.editing = true
    const { prevPath, nextPath, stepInfo, editing } = useDesignSteps()
    expect(editing.value).toBe(true)
    expect(prevPath('projects')).toBe('/career-design/plan/plan-1')
    expect(nextPath('projects')).toBe('/career-design/complete')
    expect(prevPath('timeline')).toBe('/career-design/plan/projects')
    expect(nextPath('overview')).toBe('/career-design/result')
    expect(stepInfo('timeline')).toEqual({ no: 2, total: 5, label: '타임라인', editing: true })
    expect(stepInfo('pace')).toBeNull()
  })

  it("수정 중 '속도 다시 정하기'로 속도에 들어오면 앞뒤 모두 타임라인", () => {
    draftPlan.planId = 'plan-1'
    draftPlan.editing = true
    const { prevPath, nextPath } = useDesignSteps()
    expect(prevPath('pace')).toBe('/career-design/complete')
    expect(nextPath('pace')).toBe('/career-design/complete')
  })

  it('planId 없이 editing 만 남으면 새 계획으로 본다', () => {
    draftPlan.editing = true
    expect(useDesignSteps().editing.value).toBe(false)
  })
})

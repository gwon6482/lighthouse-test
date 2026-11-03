import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { useCareerDesign } from '../composables/useCareerDesign'

// 2026-11-04: 종료일은 사용자가 정하지 않는다 — 지금 배치대로 가면 끝나는 예상 완료일(사용자 결정)
const proj = (id: string, weeks: number) => ({ id, name: id, category: 'knowledge', goal: '', days: ['월'], duration: 60, priority: 'normal', notification: false, missedNotification: false, notificationTime: '', memo: '', weeks, curriculum: [] }) as any

describe('작성 중 종료일 = 예상 완료일', () => {
  const { draftPlan, draftTimeline, resetDraftPlan } = useCareerDesign()
  beforeEach(async () => { resetDraftPlan(); await nextTick() })

  it('배치가 없으면 비어 있다', () => {
    expect(draftPlan.endDate).toBe('')
  })

  it('가장 늦게 끝나는 프로젝트의 마지막 주 끝날을 따라간다', async () => {
    draftPlan.startDate = '2026-11-02' // 월
    draftPlan.reviewDay = '월'
    draftPlan.projects = [proj('a', 2), proj('b', 3)]
    draftTimeline.value = [{ week: 1, projects: [proj('a', 2)] }, { week: 4, projects: [proj('b', 3)] }]
    await nextTick()
    expect(draftPlan.endDate).toBe('2026-12-13') // 4~6주차 → 6주차(12.7~12.13)의 끝
    draftPlan.projects[1]!.weeks = 1           // 기간을 줄이면 앞당겨진다
    await nextTick()
    expect(draftPlan.endDate).toBe('2026-11-29') // 4주차(11.23~11.29)의 끝
  })
})

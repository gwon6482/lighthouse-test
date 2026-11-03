import { describe, it, expect, vi, beforeEach } from 'vitest'

// 2026-11-04: 수정 중 헤더 꺾쇠 = '모든 수정 취소'. 그러려면 수정 중엔 서버에 보내지 않고 마칠 때 바뀐 것만 보내야 한다
const calls: { m: string; url: string; body?: any }[] = []
let nextId = 1
vi.mock('@/shared/api', () => {
  const rec = (m: string) => async (url: string, body?: any) => {
    calls.push({ m, url, body })
    if (m === 'get') return { data: { plan: PLAN() } }
    if (m === 'post' && url.endsWith('/projects')) return { data: { project: { id: `srv-p${nextId++}` } } }
    if (m === 'post' && url.endsWith('/routines')) return { data: { routine: { id: `srv-r${nextId++}` } } }
    return { data: {} }
  }
  return { req: { get: rec('get'), post: rec('post'), put: rec('put'), delete: rec('delete') } }
})

const proj = (id: string, name: string) => ({ id, name, category: 'knowledge', goal: '', days: ['월'], duration: 60, priority: 'normal', notification: false, missedNotification: false, notificationTime: '', memo: '', weeks: 4, curriculum: [] })
const PLAN = () => ({
  planId: 'P1', name: '계획', targetJob: '기획자', startDate: '2026-11-02', endDate: '2027-02-01', reviewDay: '월',
  projects: [proj('a', 'A'), proj('b', 'B')],
  routines: [{ id: 'r1', name: '뉴스', days: ['월'], duration: 10, notificationTime: '', notification: false, memo: '' }],
  timeline: [{ week: 1, projects: [proj('a', 'A')] }, { week: 3, projects: [proj('b', 'B')] }],
})

const { useCareerDesign } = await import('../composables/useCareerDesign')

describe('수정 중 저장 미루기 + commitEdit', () => {
  const cd = useCareerDesign()
  beforeEach(async () => {
    cd.resetDraftPlan()
    await cd.loadPlanFromApi('P1')
    calls.length = 0
  })

  it('수정 중에는 단계 저장이 서버로 가지 않는다(취소하면 아무것도 바뀌지 않게)', async () => {
    await cd.syncDeleteProject('b')
    await cd.syncTimeline()
    await cd.syncPlanReviewDay()
    expect(await cd.finalizePlan()).toBe(true)
    expect(calls).toEqual([])
  })

  it('마칠 때 바뀐 것만 보내고, 새 프로젝트의 서버 ID 로 타임라인 연결을 고친다', async () => {
    const { draftPlan, draftTimeline } = cd
    draftPlan.projects = draftPlan.projects.filter((p) => p.id !== 'b')           // B 삭제
    draftTimeline.value = draftTimeline.value.filter((s) => s.week !== 3)
    const c = proj('local-c', 'C') as any
    draftPlan.projects.push(c)                                                    // C 추가
    draftTimeline.value.push({ week: 5, projects: [proj('local-c', 'C') as any] })
    draftPlan.routines[0]!.duration = 20                                          // 루틴 수정
    draftPlan.reviewDay = '수'

    expect(await cd.commitEdit()).toBe(true)
    const sig = calls.map((x) => `${x.m} ${x.url.replace('/api/career-plan/P1', '')}`)
    expect(sig).toContain('delete /projects/b')
    expect(sig).toContain('post /projects')
    expect(sig).toContain('put /routines/r1')
    expect(sig).toContain('put /timeline')
    expect(sig).toContain('put ')                        // 개요
    expect(sig.filter((s) => s.startsWith('put /projects')).length).toBe(0) // A 는 안 바뀌었다
    const tl = calls.find((x) => x.url.endsWith('/timeline'))!.body.timeline
    expect(JSON.stringify(tl)).toContain('srv-p')        // local-c → 서버 ID
    expect(JSON.stringify(tl)).not.toContain('local-c')
  })

  it('아무것도 안 바꿨으면 개요만 확인 저장하고 프로젝트·루틴·타임라인은 건드리지 않는다', async () => {
    expect(await cd.commitEdit()).toBe(true)
    const sig = calls.map((x) => `${x.m} ${x.url.replace('/api/career-plan/P1', '')}`)
    expect(sig.some((s) => /projects|routines|timeline/.test(s))).toBe(false)
  })
})

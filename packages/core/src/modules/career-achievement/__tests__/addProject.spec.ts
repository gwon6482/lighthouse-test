import { describe, expect, it } from 'vitest'
import { endChange, endLine, exampleCandidates, overLine, placementOf, startChoices, weekLoad, withSlot, type PlanCtx } from '../lib/addProject'
import type { Project } from '@/modules/career-design/types/career-design'
import type { JobPreparation } from '@/modules/encyclopedia/types/encyclopedia'

const cur = (n: number) => Array.from({ length: n }, (_, i) => ({ week: i + 1, title: `${i + 1}`, items: ['할 일'] }))
const proj = (id: string, days: Project['days'], duration: number, weeks: number, extra: Partial<Project> = {}): Project => ({
  id, name: id, category: 'skill', goal: '', days, duration, priority: 'normal', notification: false, missedNotification: false, notificationTime: '09:00', memo: '', curriculum: cur(weeks), ...extra,
})
// 시안 예시: 수요일 11/18 시작(한 주 수~화), 속도 주 8시간. 오늘 11/26(목) 2주차. 이번 주 UX 기본(주 3회 1시간) · 피그마(주 4회 1시간)
const basics = proj('basics', ['월', '수', '금'], 60, 3)
const figma = proj('figma', ['월', '화', '목', '금'], 60, 3)
const uiP = proj('ui', ['월', '수', '금'], 90, 4)
const plan: PlanCtx = { startDate: '2026-11-18', reviewDay: '수', paceHours: 8, projects: [basics, figma, uiP], timeline: [{ week: 1, projects: [basics] }, { week: 2, projects: [figma] }, { week: 5, projects: [uiP] }] }
const today = new Date(2026, 10, 26)
const research = proj('research', ['월', '수', '금'], 90, 4, { name: '사용자 리서치 실습' })

describe('홈에서 새 프로젝트 시작하기(#99)', () => {
  it('오늘부터 / 다음 주부터 — 오늘과 다음 주 첫날', () => {
    expect(startChoices(plan, today)).toEqual({ today: '2026-11-26', next: '2026-12-02', week: 2 })
  })
  it('놓을 자리 — 오늘부터는 이번 주 + startOn 오늘, 다음 주부터는 다음 주(startOn 없음), 날짜로 정하면 그 날짜의 주', () => {
    expect(placementOf(plan, research, today, 'today')).toEqual({ week: 2, startKey: '2026-11-26', endKey: '2026-12-22', startOn: '2026-11-26' })
    expect(placementOf(plan, research, today, 'next')).toEqual({ week: 3, startKey: '2026-12-02', endKey: '2026-12-29' })
    const dated = { ...research, dateStart: '2026-12-10', dateEnd: '2026-12-31' }
    expect(placementOf(plan, dated, today, 'today')).toEqual({ week: 4, startKey: '2026-12-10', endKey: '2026-12-31' })
  })
  it('주마다 쓰는 시간 — 타임라인 화면과 같은 셈, 속도를 넘는 주와 한 줄', () => {
    const rows = weekLoad(plan, research, 2)
    expect(rows.map((r) => [r.week, r.hours, r.over])).toEqual([[2, 11.5, true], [3, 11.5, true], [4, 8.5, true], [5, 9, true]])
    expect(rows[0]!.parts.map((p) => `${p.id}${p.added ? '+' : ''}`)).toEqual(['basics', 'figma', 'research+'])
    const label = (w: number) => (w === 2 ? '이번 주' : `${w}주차`)
    expect(overLine(rows, 8, label)).toBe('4주 모두 정한 속도보다 많아요. 이번 주는 3.5시간 더 써야 해요.')
    expect(overLine(rows, 10, label)).toBe('4주 중 2주가 정한 속도보다 많아요. 이번 주는 1.5시간 더 써야 해요.')
    expect(overLine(rows, null, label)).toBe('')
    expect(overLine(weekLoad(plan, proj('one', ['월'], 60, 1), 2), 8, label)).toBe('')
  })
  it('예상 완료일 — 그대로 / 늦어짐(해가 바뀌면 해까지)', () => {
    const c = endChange(plan, research, 2)
    expect(c).toEqual({ before: '2027-01-12', after: '2027-01-12' })
    expect(endLine(c)).toBe('예상 완료일 2027.1.12(화) 그대로')
    expect(endLine(endChange(plan, research, 6))).toBe('예상 완료일 1.12 → 1.19')
    expect(endLine({ before: '2026-12-22', after: '2027-01-12' })).toBe('예상 완료일 2026.12.22 → 2027.1.12')
    expect(endLine({ before: '2027-09-07', after: '2027-10-12' })).toBe('예상 완료일 9.7 → 10.12')
  })
  it('타임라인에 한 자리 — 원래 배열은 건드리지 않는다', () => {
    const tl = withSlot(plan.timeline, research, 2)
    expect(tl.find((s) => s.week === 2)!.projects.map((p) => p.id)).toEqual(['figma', 'research'])
    expect(plan.timeline.find((s) => s.week === 2)!.projects).toHaveLength(1)
  })
  it('예시 — 모든 갈래에서 내 계획에 없는 걸음만, 기본 갈래부터, 고르는 걸음·과정은 빼고', () => {
    const P = (name: string, extra: object = {}) => ({ id: name, name, category: 'skill', goal: '', level: '입문', daysPerWeek: 3, minutesPerSession: 90, weeks: 4, method: 'practice', phases: [{ title: name, weeks: 4, items: ['a'] }], ...extra })
    const prep = {
      jobCode: '415504', title: 'UX', displayName: 'UX', plan: { jobCode: '415504' }, defaultTrack: 'ui', tracks: [],
      paths: [
        { track: 'ux', items: [{ ref: 'r', step: 1 }, { ref: 'ia', step: 2 }, { ref: 'boot', step: 3 }] },
        { track: 'ui', items: [{ ref: 'b', step: 1 }, { ref: 'm', step: 2, optional: true }, { ref: 'g', step: 3 }] },
      ],
      projects: { r: P('사용자 리서치 실습'), ia: P('정보 구조'), boot: P('부트캠프', { period: true }), b: P('basics'), m: P('멘토링'), g: P('GA4') },
    } as unknown as JobPreparation
    const list = exampleCandidates(prep, plan)
    expect(list.map((p) => p.name)).toEqual(['GA4', '사용자 리서치 실습', '정보 구조'])
    expect(list[0]!.curriculum).toHaveLength(4)
  })
})

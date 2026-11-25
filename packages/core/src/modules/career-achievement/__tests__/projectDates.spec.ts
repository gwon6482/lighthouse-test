// 날짜로 정한 프로젝트(2026-11-25) — 오늘 할 일에서 날짜 밖 요일 빼기(정할 것 4) · 로드맵 '마감 지남'(정할 것 5)
import { describe, expect, it } from 'vitest'
import type { Project, TimelineSlot } from '@/modules/career-design/types/career-design'
import { expandPhases } from '@/modules/career-design/lib/examPace'
import { generateItemsForWeek } from '../composables/useWeeklySchedule'
import { roadmapStops } from '../lib/planBoard'
import { pullAheadCandidates } from '../lib/pullAhead'

const START = '2026-11-23'
const contest = (extra: Partial<Project> = {}): Project => ({
  id: 'contest', name: '공모전 도전', category: 'portfolio', method: 'contest', methodDetail: { title: '공모전' }, goal: '',
  days: ['월', '수', '금'], duration: 120, priority: 'normal', notification: false, missedNotification: false, notificationTime: '', memo: '',
  curriculum: expandPhases([{ title: '주제', weeks: 1, items: ['a', 'b'] }, { title: '만들기', weeks: 4, items: ['c', 'd', 'e'] }, { title: '내기', weeks: 1, items: ['f', 'g'] }]),
  weeks: 6, dateStart: '2027-03-02', dateEnd: '2027-04-09', ...extra,
})
const tl = (p: Project): TimelineSlot[] => [{ week: 15, projects: [p] }]

describe('오늘 할 일 — 날짜 밖 요일은 빠진다', () => {
  it('첫 주(3.1~3.7): 3.1 월요일은 빠지고 수·금만', () => {
    const p = contest()
    const items = generateItemsForWeek({ startDate: START, reviewDay: '월', projects: [p], routines: [] }, tl(p), '2027-03-01', '2027-03-07')
    expect(items.map((i) => i.date)).toEqual(['2027-03-03', '2027-03-05'])
  })
  it('마지막 주(4.5~4.11): 마감이 4.7(수)이면 4.9 금요일은 빠진다', () => {
    const p = contest({ dateEnd: '2027-04-07' })
    const items = generateItemsForWeek({ startDate: START, reviewDay: '월', projects: [p], routines: [] }, tl(p), '2027-04-05', '2027-04-11')
    expect(items.map((i) => i.date)).toEqual(['2027-04-05', '2027-04-07'])
  })
  it('타임라인 자리가 날짜와 어긋나면(옛 앱이 다시 놓음) 빼지 않고 타임라인대로', () => {
    const p = contest()
    const moved: TimelineSlot[] = [{ week: 18, projects: [p] }]   // 날짜는 15~20주차인데 18주차(3.22~)에 놓임
    const items = generateItemsForWeek({ startDate: START, reviewDay: '월', projects: [p], routines: [] }, moved, '2027-04-12', '2027-04-18')
    expect(items.map((i) => i.date)).toEqual(['2027-04-12', '2027-04-14', '2027-04-16'])
  })
  it('날짜가 없으면 예전처럼 걸친 주 전체', () => {
    const p = contest({ dateStart: undefined, dateEnd: undefined })
    const items = generateItemsForWeek({ startDate: START, reviewDay: '월', projects: [p], routines: [] }, tl(p), '2027-03-01', '2027-03-07')
    expect(items.map((i) => i.date)).toEqual(['2027-03-01', '2027-03-03', '2027-03-05'])
  })
})

describe('로드맵 — 마감 지남', () => {
  const done = (id: string, week: number, idx: number) => !(week === 6 && idx >= 0) && id === 'contest'
  it('마감일 다음 날부터 남은 할 일이 있으면 past(마지막 주 안이어도)', () => {
    const p = contest()
    // 4.10(토)은 20주차(4.5~4.11) 안 — 주로만 보면 아직 진행 중
    expect(roadmapStops([p], tl(p), 20, done)[0]!.status).toBe('now')
    expect(roadmapStops([p], tl(p), 20, done, '2027-04-10')[0]!.status).toBe('past')
    expect(roadmapStops([p], tl(p), 20, done, '2027-04-09')[0]!.status).toBe('now')
    // 다 했으면 완료
    expect(roadmapStops([p], tl(p), 21, () => true, '2027-04-14')[0]!.status).toBe('done')
  })
})

describe('미리 하기 — 날짜 걸음은 시작일 전에 당기지 않는다', () => {
  it('오늘이 시작일보다 앞이면 후보에서 빠진다', () => {
    const later = [{ date: '2027-03-03', items: [{ itemType: 'project' as const, itemId: 'contest' }] }]
    const base = { todayItems: [], laterDays: later, isDone: () => false, hasUndoneThisWeek: () => true }
    const p = contest()
    expect(pullAheadCandidates({ ...base, todayKey: '2027-03-01', projectOf: () => p })).toEqual([])
    expect(pullAheadCandidates({ ...base, todayKey: '2027-03-02', projectOf: () => p })).toEqual([{ projectId: 'contest', date: '2027-03-03' }])
    expect(pullAheadCandidates({ ...base, todayKey: '2027-03-01', projectOf: () => ({ ...p, dateStart: undefined, dateEnd: undefined }) }).length).toBe(1)
  })
})

import { describe, it, expect } from 'vitest'
import {
  objectJosa, planPhase, planDayNumber, dDayLabel, overallProgress,
  streakCount, reviewBadge, todayMessage, journeyHeadline,
} from '../lib/planBoard'

const d = (s: string) => { const [y, m, day] = s.split('-').map(Number); return new Date(y!, m! - 1, day!) }

describe('planBoard', () => {
  it('을/를', () => {
    expect(objectJosa('간호사')).toBe('를')
    expect(objectJosa('회계사무원')).toBe('을')
    expect(objectJosa('PM')).toBe('을(를)')
  })

  it('계획 단계와 일차', () => {
    expect(planPhase('2026-11-01', '2027-04-30', d('2026-10-28'))).toBe('before')
    expect(planPhase('2026-10-01', '2027-04-30', d('2026-10-28'))).toBe('running')
    expect(planPhase('2026-01-01', '2026-10-27', d('2026-10-28'))).toBe('finished')
    expect(planDayNumber('2026-10-06', d('2026-10-28'))).toBe(23)
    expect(planDayNumber('2026-11-01', d('2026-10-28'))).toBeNull()
  })

  it('완료까지 — 끝나면 계획 완료', () => {
    expect(dDayLabel('2026-11-07', d('2026-10-28'))).toBe('D-10')
    expect(dDayLabel('2026-10-28', d('2026-10-28'))).toBe('D-Day')
    expect(dDayLabel('2026-10-27', d('2026-10-28'))).toBe('계획 완료')
  })

  it('전체 진행 = 완료 항목 ÷ 전체 항목(설명만 있는 주차는 줄 단위)', () => {
    const projects = [
      { id: 'a', curriculum: [{ week: 1, items: ['x', 'y'] }, { week: 2, description: '하나\n둘' }] },
      { id: 'b', curriculum: [] },
    ] as any
    const done = new Set(['a-1-0', 'a-2-1'])
    expect(overallProgress(projects, (p, w, i) => done.has(`${p}-${w}-${i}`))).toEqual({ done: 2, total: 4, percent: 50 })
    expect(overallProgress([], () => false).percent).toBe(0)
  })

  it('연속 달성 — 할 일 없는 날은 건너뛰고, 오늘 미완료는 끊지 않는다', () => {
    // 10/28(오늘, 미완료) · 10/27(쉬는 날) · 10/26 완료 · 10/25 완료 · 10/24 미완료
    const plan: Record<string, [number, number]> = {
      '2026-10-28': [2, 0], '2026-10-27': [0, 0], '2026-10-26': [1, 1], '2026-10-25': [2, 2], '2026-10-24': [1, 0],
    }
    const key = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
    const n = streakCount(d('2026-10-28'), '2026-10-20', (x) => plan[key(x)]?.[0] ?? 0, (x) => plan[key(x)]?.[1] ?? 0)
    expect(n).toBe(2)
  })

  it('결산 배지', () => {
    // 2026-10-28 = 수요일
    expect(reviewBadge('수', d('2026-10-28'), 'running')).toEqual({ kind: 'today' })
    expect(reviewBadge('금', d('2026-10-28'), 'running')).toEqual({ kind: 'left', days: 2 })
    expect(reviewBadge('월', d('2026-10-28'), 'running')).toEqual({ kind: 'left', days: 5 })
    expect(reviewBadge('', d('2026-10-28'), 'running')).toBeNull()
    expect(reviewBadge('금', d('2026-10-28'), 'finished')).toBeNull()
  })

  it('오늘 문장과 큰 줄', () => {
    const base = { phase: 'running' as const, startDate: '2026-10-01' }
    expect(todayMessage({ ...base, total: 5, done: 0 })).toBe('오늘 할 일 5개, 시작해 볼까요?')
    expect(todayMessage({ ...base, total: 5, done: 2 })).toBe('3개만 더 하면 돼요!')
    expect(todayMessage({ ...base, total: 5, done: 5 })).toBe('오늘도 해냈어요!')
    expect(todayMessage({ ...base, total: 0, done: 0 })).toBe('오늘은 쉬어 가는 날이에요')
    expect(todayMessage({ phase: 'before', startDate: '2026-11-03', total: 0, done: 0 })).toBe('11월 3일에 출발해요')
    expect(journeyHeadline('간호사', 'running', 23)).toBe('간호사를 향해 23일차')
    expect(journeyHeadline('회계사무원', 'before', null)).toBe('회계사무원을 향해')
  })
})

describe('roadmapStops', () => {
  const P = (id: string, weeks: number, n = 2) => ({ id, name: id, weeks, curriculum: Array.from({ length: weeks }, (_, i) => ({ week: i + 1, items: Array.from({ length: n }, (_, j) => `${id}-${i + 1}-${j}`) })) }) as any
  const projects = [P('late', 2), P('a', 3), P('b', 2), P('c', 2), P('unplaced', 1)]
  const timeline = [{ week: 1, projects: [{ id: 'a' }] }, { week: 3, projects: [{ id: 'b' }] }, { week: 6, projects: [{ id: 'late' }] }, { week: 1, projects: [{ id: 'c' }] }]
  it('시작 주차 순, 배치 안 된 것은 빼고, 상태를 가른다', async () => {
    const { roadmapStops } = await import('../lib/planBoard')
    const doneAll = new Set(['c'])
    const stops = roadmapStops(projects, timeline, 4, (p) => doneAll.has(p))
    expect(stops.map((s) => s.project.id)).toEqual(['c', 'a', 'b', 'late'])
    expect(stops.map((s) => s.status)).toEqual(['done', 'past', 'now', 'next'])
    expect(stops[1]).toMatchObject({ startWeek: 1, endWeek: 3, done: 0, total: 6 })
  })
})

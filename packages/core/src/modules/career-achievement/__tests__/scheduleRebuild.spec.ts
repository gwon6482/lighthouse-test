import { describe, expect, it } from 'vitest'
import { rebuildWeekItems, type RebuildItem } from '../lib/scheduleRebuild'
import { generateItemsForWeek } from '../composables/useWeeklySchedule'
import type { Project } from '@/modules/career-design/types/career-design'

const P = (itemId: string, date: string, extra: Partial<RebuildItem> = {}): RebuildItem => ({ itemType: 'project', itemId, date, curriculumWeek: 1, ...extra })
const R = (itemId: string, date: string): RebuildItem => ({ itemType: 'routine', itemId, date })
const sum = (its: RebuildItem[]) => its.map((x) => `${x.date.slice(8)}${x.itemId}`).join(' ')

describe('이번 주를 오늘부터만 다시 만들기(#99)', () => {
  // 수(25)~화(1), 오늘 목(26). A 매일, B 토, 루틴 r 매일
  const kept = [
    P('A', '2026-11-25'), P('B', '2026-11-25', { note: 'ahead:2026-11-28' }), R('r', '2026-11-25'),
    P('A', '2026-11-26'), P('A', '2026-11-27'), P('A', '2026-11-29') /* 일정 조정: 월 → 일 */, P('A', '2026-12-01'),
  ]
  it('계획이 그 일에 대해 바뀌지 않았으면 — 지난 요일·옮긴 자리·당겨 간 칸 모두 그대로', () => {
    const generated = [
      P('A', '2026-11-25'), R('r', '2026-11-25'), P('A', '2026-11-26'), P('A', '2026-11-27'), P('B', '2026-11-28'), P('A', '2026-11-30'), P('A', '2026-12-01'),
    ]
    expect(sum(rebuildWeekItems(kept, generated, '2026-11-26'))).toBe('25A 25B 25r 26A 27A 29A 01A')
  })
  it('새 프로젝트 C(월·수·금)를 이번 주에 — 지난 수요일에는 생기지 않고, 오늘부터만 더해진다', () => {
    const generated = [
      P('A', '2026-11-25'), P('C', '2026-11-25'), R('r', '2026-11-25'), P('A', '2026-11-26'), P('A', '2026-11-27'), P('C', '2026-11-27'),
      P('B', '2026-11-28'), P('A', '2026-11-30'), P('C', '2026-11-30'), P('A', '2026-12-01'),
    ]
    expect(sum(rebuildWeekItems(kept, generated, '2026-11-26'))).toBe('25A 25B 25r 26A 27A 27C 29A 30C 01A')
  })
  it('그 일의 요일이 바뀌었으면 계획대로 — 미리 한 칸은 다시 나오지 않는다', () => {
    // B 를 토 → 금·토 로 바꿈: 남은 칸 2(금·토) ≠ 당겨 간 1 → 계획대로 금만(토는 이미 미리 함)
    const generated = [P('A', '2026-11-26'), P('B', '2026-11-27'), P('B', '2026-11-28'), P('A', '2026-11-27'), P('A', '2026-11-29'), P('A', '2026-12-01')]
    const out = sum(rebuildWeekItems(kept, generated, '2026-11-26'))
    expect(out).toContain('27B')
    expect(out).not.toContain('28B')
  })
  it('그 주 차례(curriculumWeek)가 바뀌면(시작 주를 옮김) 계획대로', () => {
    const generated = [P('A', '2026-11-26', { curriculumWeek: 2 }), P('A', '2026-11-27', { curriculumWeek: 2 }), P('A', '2026-11-30', { curriculumWeek: 2 }), P('A', '2026-12-01', { curriculumWeek: 2 })]
    const out = rebuildWeekItems(kept, generated, '2026-11-26').filter((x) => x.itemId === 'A' && x.date >= '2026-11-26')
    expect(out.map((x) => x.date.slice(8))).toEqual(['26', '27', '30', '01'])
  })
  it('계획에서 빠진 일 — 남은 칸이 사라지고, 지운 일의 지난 칸도 남기지 않는다', () => {
    const generated = [R('r', '2026-11-26')]
    const out = rebuildWeekItems(kept, generated, '2026-11-26', (it) => it.itemId !== 'B')
    expect(sum(out)).toBe('25A 25r 26r')
  })

  it('앱 배치와 맞물려 — 시작일만 정한 걸음은 놓인 첫 주의 시작일 전 요일에 칸이 없다(옛 서버처럼 통째로 다시 만들어도)', () => {
    const base = { goal: '', priority: 'normal' as const, notification: false, missedNotification: false, notificationTime: '09:00', memo: '', curriculum: [{ week: 1, title: '1', items: ['x'] }] }
    const A: Project = { ...base, id: 'A', name: 'A', category: 'skill', days: ['월', '화', '수', '목', '금'], duration: 60, curriculum: Array.from({ length: 4 }, (_, i) => ({ week: i + 1, title: `${i}`, items: ['x'] })) }
    const C: Project = { ...base, id: 'C', name: 'C', category: 'skill', days: ['월', '수', '금'], duration: 90, startOn: '2026-11-26' }
    const plan = { startDate: '2026-11-18', reviewDay: '수' as const, projects: [A, C], routines: [] }
    const tl = [{ week: 1, projects: [A] }, { week: 2, projects: [C] }]
    const items = generateItemsForWeek(plan, tl, '2026-11-25', '2026-12-01')
    expect(items.filter((x) => x.itemId === 'C').map((x) => x.date)).toEqual(['2026-11-27', '2026-11-30'])
    // 다음 주에 놓았으면(시작일의 주와 다른 자리) 빼지 않는다
    const tl3 = [{ week: 1, projects: [A] }, { week: 3, projects: [C] }]
    expect(generateItemsForWeek(plan, tl3, '2026-12-02', '2026-12-08').filter((x) => x.itemId === 'C').map((x) => x.date)).toEqual(['2026-12-02', '2026-12-04', '2026-12-07'])
  })
})

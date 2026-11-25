import { describe, expect, it } from 'vitest'
import { rebuildWeekItems, type RebuildItem } from '../lib/scheduleRebuild'

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

})

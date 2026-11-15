import { describe, expect, it } from 'vitest'
import { checkLevelLabel, formatMinutes, formatWeeks, hasMajorSkip, pathOf, stepsOf, sumWeeks } from '../lib/preparation'
import type { JobPreparation, PrepProject } from '../types/encyclopedia'

const project = (id: string, weeks: number): PrepProject => ({
  id, name: id, type: 'skill', typeName: '실무 스킬', subtype: null, subtypeName: null,
  category: 'skill', method: 'practice', level: '입문', daysPerWeek: 3, minutesPerSession: 60,
  goal: '', phases: [{ weeks, title: '', items: [] }], weeks, scope: 'job', basis: null,
})

const prep: JobPreparation = {
  jobCode: '000001', title: '직업', displayName: '직업', shared: false,
  plan: { jobCode: '000001', title: '직업', displayName: '직업', family: 'biz', familyName: '경영·사무', status: 'draft', updatedAt: null, summary: '', gate: null, caution: null, checked: null },
  tracks: [{ id: 'a', name: '가', desc: '' }, { id: 'b', name: '나', desc: '' }],
  defaultTrack: 'b',
  paths: [
    {
      track: 'a',
      items: [
        { ref: 'cp.one', step: 1, major: true, optional: false, fromTrack: false },
        { ref: 'p.gone', step: 4, major: true, optional: false, fromTrack: true },   // 프로젝트가 없는 참조
        { ref: 'p.two', step: 7, major: false, optional: false, fromTrack: true, skip: '전공에서 배운다' },
      ],
      totals: { nonMajor: { count: 2, weeks: 10 }, major: { count: 1, weeks: 4 }, optional: 0 },
    },
    {
      track: 'b',
      items: [{ ref: 'cp.one', step: 1, major: true, optional: false, fromTrack: false }],
      totals: { nonMajor: { count: 1, weeks: 4 }, major: { count: 1, weeks: 4 }, optional: 0 },
    },
  ],
  projects: { 'cp.one': project('cp.one', 4), 'p.two': project('p.two', 6) },
}

describe('준비과정 탭 계산', () => {
  it('고른 갈래의 길을 주고, 모르는 갈래면 첫 길을 준다', () => {
    expect(pathOf(prep, 'b')?.track).toBe('b')
    expect(pathOf(prep, 'zzz')?.track).toBe('a')
    expect(pathOf(prep, null)?.track).toBe('a')
  })

  it('걸음에 1부터 번호를 매기고 프로젝트가 없는 참조는 건너뛴다', () => {
    const steps = stepsOf(prep, pathOf(prep, 'a'))
    expect(steps.map((s) => [s.no, s.project.id])).toEqual([[1, 'cp.one'], [2, 'p.two']])
    expect(steps.map((s) => s.key)).toEqual(['cp.one@1', 'p.two@7'])
    expect(stepsOf(prep, null)).toEqual([])
  })

  it('전공자에게 줄어드는 것이 있는 길만 표시한다', () => {
    expect(hasMajorSkip(pathOf(prep, 'a'))).toBe(true)
    expect(hasMajorSkip(pathOf(prep, 'b'))).toBe(false)
    expect(hasMajorSkip(null)).toBe(false)
  })

  it('주 수를 주·달·해로 바꾼다', () => {
    expect(formatWeeks(1)).toBe('1주')
    expect(formatWeeks(12)).toBe('12주')
    expect(formatWeeks(13)).toBe('약 3개월')
    expect(formatWeeks(46)).toBe('약 11개월')
    expect(formatWeeks(104)).toBe('약 2년')
    expect(formatWeeks(108)).toBe('약 2년 1개월')
    expect(formatWeeks(432)).toBe('약 8년 3개월')
  })

  it('시간을 분·시간으로 바꾼다', () => {
    expect(formatMinutes(45)).toBe('45분')
    expect(formatMinutes(60)).toBe('1시간')
    expect(formatMinutes(90)).toBe('1시간 30분')
    expect(formatMinutes(300)).toBe('5시간')
  })

  it('대조한 출처의 종류를 말로 바꾼다', () => {
    expect(checkLevelLabel({ at: null, level: 'law', source: '법', note: null })).toBe('법령 원문과 대조')
    expect(checkLevelLabel({ at: null, level: null, source: '어딘가', note: null })).toBe('출처와 대조')
    expect(checkLevelLabel(null)).toBe('출처와 대조')
  })
})

// 2026-11-16: 학교·수련 과정(course)과 그 과정 중에 하는 걸음(during) — 서버 totals 와 같은 규칙
describe('차례로 할 때의 주 수', () => {
  const row = (weeks: number, over: { course?: boolean; during?: boolean; optional?: boolean; major?: boolean } = {}) => ({
    item: { optional: !!over.optional, during: over.during, major: over.major !== false },
    project: { weeks, course: over.course },
  })
  // 수능 52주(전공자 생략) → 대학 4년(과정, 전공자 생략) → 임상실습 25주(과정 중) → 국가시험 16주(과정 중) → 채용 준비 4주 → 토익 8주(선택)
  const rows = [row(52, { major: false }), row(208, { course: true, major: false }), row(25, { during: true }), row(16, { during: true }), row(4), row(8, { optional: true })]

  it('과정 중에 하는 걸음은 과정 기간에 들어 있어 겹쳐 세지 않는다 — 선택 항목도 세지 않는다', () => {
    expect(sumWeeks(rows)).toEqual({ count: 5, weeks: 52 + 208 + 4, courseWeeks: 208 })
  })

  it('과정을 건너뛰는 대상(전공자)에게는 과정 중 걸음을 그대로 센다', () => {
    expect(sumWeeks(rows, (r) => r.item.major)).toEqual({ count: 3, weeks: 25 + 16 + 4, courseWeeks: 0 })
  })

  it('선택 과정 걸음은 기간을 품지 않는다 · 과정이 없으면 표시가 있어도 그대로 센다', () => {
    expect(sumWeeks([row(104, { course: true, optional: true }), row(10, { during: true })])).toEqual({ count: 1, weeks: 10, courseWeeks: 0 })
    expect(sumWeeks([row(10, { during: true }), row(3)])).toEqual({ count: 2, weeks: 13, courseWeeks: 0 })
  })

  it('과정이 둘이면 걸음은 바로 앞의 과정에 딸린다', () => {
    // 학부 4년(생략 대상) → LEET(과정 중) → 로스쿨 3년 → 변호사시험(과정 중) → 면접
    const law = [row(208, { course: true, major: false }), row(12, { during: true }), row(156, { course: true }), row(24, { during: true }), row(3)]
    expect(sumWeeks(law).weeks).toBe(208 + 156 + 3)
    expect(sumWeeks(law, (r) => r.item.major).weeks).toBe(12 + 156 + 3)     // 학부를 건너뛰면 LEET 는 따로 센다, 변호사시험은 로스쿨 안
  })
})


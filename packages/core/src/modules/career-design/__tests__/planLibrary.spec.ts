import { describe, expect, it } from 'vitest'
import { libraryToHelperJob, phasesToCurriculum, projectToExample } from '../composables/useHelperExamples'
import { buildPlanTemplates } from '../composables/usePlanTemplates'
import type { JobPreparation, PrepItem, PrepProject } from '@/modules/encyclopedia/types/encyclopedia'

// 진로계획 라이브러리(진로백과 준비과정과 같은 자료)를 템플릿·도우미 추천이 쓰는 모양으로 바꾸는 계산(2026-11-15)
const project = (id: string, over: Partial<PrepProject> = {}): PrepProject => ({
  id, name: id, type: 'skill', typeName: '실무 스킬', subtype: null, subtypeName: null,
  category: 'skill', method: 'practice', level: '입문', daysPerWeek: 3, minutesPerSession: 60,
  goal: `${id} 목표`, phases: [{ weeks: 2, title: '기초', items: ['가', '나'] }, { weeks: 1, title: '마무리', items: ['다'] }],
  weeks: 3, scope: 'job', basis: null, ...over,
})
const item = (ref: string, step: number, over: Partial<PrepItem> = {}): PrepItem =>
  ({ ref, step, major: true, optional: false, fromTrack: false, ...over })

const prep = (over: Partial<JobPreparation> = {}): JobPreparation => ({
  jobCode: '026102', title: '광고·홍보·마케팅사무원', shared: true,
  plan: { jobCode: '024101', title: '광고·홍보·마케팅전문가', displayName: '마케터', family: 'biz', familyName: '경영·사무', status: 'draft', updatedAt: null, summary: '', gate: '꼭 거쳐야 하는 것', caution: null, checked: null },
  tracks: [{ id: 'a', name: '가 갈래', desc: '' }, { id: 'b', name: '나 갈래', desc: '' }],
  defaultTrack: 'b',
  paths: [
    {
      track: 'a',
      items: [
        item('cp.research', 1),
        item('p.basics', 2, { major: false, skip: '전공 과목에서 배운다' }),
        item('cp.toeic', 3, { optional: true, note: '대기업에 지원할 때' }),
        item('p.portfolio', 4, { fromTrack: true }),
      ],
      totals: { nonMajor: { count: 3, weeks: 9 }, major: { count: 2, weeks: 6 }, optional: 1 },
    },
    {
      track: 'b',
      items: [item('cp.research', 1), item('p.portfolio', 2, { fromTrack: true }), item('p.portfolio', 5, { fromTrack: true, note: '한 번 더' })],
      totals: { nonMajor: { count: 3, weeks: 9 }, major: { count: 3, weeks: 9 }, optional: 0 },
    },
  ],
  projects: {
    'cp.research': project('cp.research', { category: 'knowledge', method: 'book', scope: 'all' }),
    'p.basics': project('p.basics', { category: 'knowledge', method: 'book' }),
    'cp.toeic': project('cp.toeic', { category: 'qualification', method: 'book', scope: 'all', caution: '기준 점수는 곳마다 다르다' }),
    'p.portfolio': project('p.portfolio', { category: 'portfolio', method: 'personal_project' }),
  },
  ...over,
})

describe('단계 → 주차별 커리큘럼', () => {
  it('단계의 주 수만큼 같은 할 일을 되풀이하고, 여러 주면 (몇 번째/전체)를 붙인다', () => {
    const cur = phasesToCurriculum([{ weeks: 2, title: '기초', items: ['가', '나'] }, { weeks: 1, title: '마무리', items: ['다'] }])
    expect(cur.map((w) => [w.week, w.title, w.items.length])).toEqual([[1, '기초 (1/2)', 2], [2, '기초 (2/2)', 2], [3, '마무리', 1]])
  })

  it('1년이 넘는 과정도 자르지 않는다 — 단계의 주 수 그대로 편다', () => {
    const cur = phasesToCurriculum([{ weeks: 2, title: '준비', items: ['가'] }, { weeks: 104, title: '과정', items: ['나'] }, { weeks: 2, title: '시험', items: ['다'] }])
    expect(cur).toHaveLength(108)
    expect(cur[2]!.title).toBe('과정 (1/104)')
    expect(cur.map((w) => w.week)).toEqual(Array.from({ length: 108 }, (_, i) => i + 1))
  })
})

describe('도우미 예시', () => {
  it('긴 프로젝트도 원래 길이대로 예시가 된다', () => {
    const long = project('p.school', { phases: [{ weeks: 108, title: '과정', items: ['가'] }], weeks: 108 })
    const ex = projectToExample(prep(), item('p.school', 1), long)
    expect(ex.curriculum).toHaveLength(108)
    expect(ex.basis).toBe('마케터 준비과정 예시에 들어 있는 프로젝트예요.')
  })

  it('고른 갈래의 길을 영역별로 묶는다 — 선택 항목도 들어가고, 같은 프로젝트는 한 번만', () => {
    const a = libraryToHelperJob(prep(), 'a')
    expect(a.jobCode).toBe('026102')
    expect(a.title).toBe('마케터')
    expect(a.examples.knowledge?.map((e) => e.name)).toEqual(['cp.research', 'p.basics'])
    expect(a.examples.qualification?.map((e) => e.name)).toEqual(['cp.toeic'])
    expect(a.examples.qualification?.[0]?.basis).toContain('지원하는 곳에 따라')
    // 갈래를 고르지 않았으면 그 직업의 기본 갈래(b) — p.portfolio 가 두 번 나오지만 하나만
    const b = libraryToHelperJob(prep(), undefined)
    expect(b.examples.portfolio).toHaveLength(1)
    expect(b.examples.qualification).toBeUndefined()
  })
})

describe('템플릿', () => {
  it('전공자에게 줄어드는 길은 비전공·전공 두 플랜 — 선택 항목은 빼고 따로 보여 준다', () => {
    const [nonmajor, major] = buildPlanTemplates(prep(), 'a')
    expect([nonmajor!.stage, major!.stage]).toEqual(['nonmajor', 'major'])
    expect(nonmajor!.projects.map((p) => p.name)).toEqual(['cp.research', 'p.basics', 'p.portfolio'])
    expect(major!.projects.map((p) => p.name)).toEqual(['cp.research', 'p.portfolio'])
    expect(major!.dropped).toEqual([{ name: 'p.basics', category: 'knowledge', reason: '전공 과목에서 배운다' }])
    expect(nonmajor!.dropped).toEqual([])
    expect(nonmajor!.optional).toEqual([{ name: 'cp.toeic', category: 'qualification', reason: '대기업에 지원할 때' }])
    // 목표 직업은 사용자가 정한 직업(대표 직업이 아니다), 이름에는 통칭과 갈래
    expect(nonmajor!.jobCode).toBe('026102')
    expect(nonmajor!.jobTitle).toBe('광고·홍보·마케팅사무원')
    expect(nonmajor!.track).toBe('a')
    expect(nonmajor!.name).toBe('마케터 비전공 플랜 · 가 갈래')
    expect(nonmajor!.note).toBe('꼭 거쳐야 하는 것')
    // 담기는 프로젝트는 주차별 커리큘럼과 진행 방식까지 채워져 있다
    expect(nonmajor!.projects[0]!.curriculum).toHaveLength(3)
    expect(nonmajor!.projects[0]!.method).toBe('book')
  })

  it('전공자에게 줄어드는 것이 없는 길은 플랜 하나(기본)', () => {
    const list = buildPlanTemplates(prep(), 'b')
    expect(list.map((t) => t.stage)).toEqual(['basic'])
    expect(list[0]!.name).toBe('마케터 플랜 · 나 갈래')
    expect(list[0]!.projects).toHaveLength(3)
  })

  it('1년이 넘는 과정도 그대로 담는다 · 통칭과 같은 갈래 이름은 붙이지 않는다', () => {
    const p = prep({
      tracks: [{ id: 'self', name: '마케터', desc: '' }],
      defaultTrack: 'self',
      paths: [{ track: 'self', items: [item('cp.research', 1), item('p.school', 2)], totals: { nonMajor: { count: 2, weeks: 111 }, major: { count: 2, weeks: 111 }, optional: 0 } }],
    })
    p.projects['p.school'] = project('p.school', { phases: [{ weeks: 108, title: '과정', items: ['가'] }], weeks: 108 })
    const [t] = buildPlanTemplates(p, 'self')
    expect(t!.name).toBe('마케터 플랜')
    expect(t!.projects[1]!.weeks).toBe(108)
    expect(t!.projects[1]!.curriculum).toHaveLength(108)
  })

  it('갈래가 없는 계획 · 걸음이 없는 계획', () => {
    const noTrack = prep({ tracks: [], defaultTrack: null, paths: [{ track: null, items: [item('cp.research', 1)], totals: { nonMajor: { count: 1, weeks: 3 }, major: { count: 1, weeks: 3 }, optional: 0 } }] })
    expect(buildPlanTemplates(noTrack, null).map((t) => t.name)).toEqual(['마케터 플랜'])
    expect(buildPlanTemplates(prep({ paths: [] }), null)).toEqual([])
  })
})

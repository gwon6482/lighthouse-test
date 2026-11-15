import { describe, expect, it } from 'vitest'
import { libraryToHelperJob, phasesToCurriculum, pickDays, projectToExample } from '../composables/useHelperExamples'
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
  jobCode: '026102', title: '광고·홍보·마케팅사무원', displayName: '광고·홍보·마케팅사무원', shared: true,
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
    expect(ex.basis).toBe('광고·홍보·마케팅사무원 준비과정 예시에 들어 있는 프로젝트예요.')
  })

  it('고른 갈래의 길을 영역별로 묶는다 — 선택 항목도 들어가고, 같은 프로젝트는 한 번만', () => {
    const a = libraryToHelperJob(prep(), 'a')
    expect(a.jobCode).toBe('026102')
    expect(a.title).toBe('광고·홍보·마케팅사무원')
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
    // 목표 직업은 사용자가 정한 직업(대표 직업이 아니다), 이름에는 그 직업을 부르는 이름과 갈래
    expect(nonmajor!.jobCode).toBe('026102')
    expect(nonmajor!.jobTitle).toBe('광고·홍보·마케팅사무원')
    expect(nonmajor!.track).toBe('a')
    expect(nonmajor!.name).toBe('광고·홍보·마케팅사무원 비전공 플랜 · 가 갈래')
    expect(nonmajor!.note).toBe('꼭 거쳐야 하는 것')
    // 담기는 프로젝트는 주차별 커리큘럼과 진행 방식까지 채워져 있다
    expect(nonmajor!.projects[0]!.curriculum).toHaveLength(3)
    expect(nonmajor!.projects[0]!.method).toBe('book')
  })

  it('전공자에게 줄어드는 것이 없는 길은 플랜 하나(기본)', () => {
    const list = buildPlanTemplates(prep(), 'b')
    expect(list.map((t) => t.stage)).toEqual(['basic'])
    expect(list[0]!.name).toBe('광고·홍보·마케팅사무원 플랜 · 나 갈래')
    expect(list[0]!.projects).toHaveLength(3)
  })

  it('1년이 넘는 과정도 그대로 담는다 · 보여 줄 갈래가 하나뿐이면 이름에 갈래를 붙이지 않는다', () => {
    // 판사처럼 제 갈래만 받는 직업 — 서버가 갈래 하나만 준다
    const p = prep({
      displayName: '판사', shared: false,
      tracks: [{ id: 'judge', name: '판사', desc: '' }],
      defaultTrack: 'judge',
      paths: [{ track: 'judge', items: [item('cp.research', 1), item('p.school', 2)], totals: { nonMajor: { count: 2, weeks: 111 }, major: { count: 2, weeks: 111 }, optional: 0 } }],
    })
    p.projects['p.school'] = project('p.school', { phases: [{ weeks: 108, title: '과정', items: ['가'] }], weeks: 108 })
    const [t] = buildPlanTemplates(p, 'judge')
    expect(t!.name).toBe('판사 플랜')
    expect(t!.track).toBe('judge')
    expect(t!.projects[1]!.weeks).toBe(108)
    expect(t!.projects[1]!.curriculum).toHaveLength(108)
  })

  it('갈래가 없는 계획 · 걸음이 없는 계획', () => {
    const noTrack = prep({ tracks: [], defaultTrack: null, paths: [{ track: null, items: [item('cp.research', 1)], totals: { nonMajor: { count: 1, weeks: 3 }, major: { count: 1, weeks: 3 }, optional: 0 } }] })
    expect(buildPlanTemplates(noTrack, null).map((t) => t.name)).toEqual(['광고·홍보·마케팅사무원 플랜'])
    expect(buildPlanTemplates(prep({ paths: [] }), null)).toEqual([])
  })
})

// 2026-11-16: 기간은 준비과정 탭과 같은 계산 · 이미 가진 것 빼기 · 과정 표시 · 요일 나눠 넣기
describe('템플릿 — 기간·이미 있는 것·과정', () => {
  const school = (): JobPreparation => {
    const p = prep({
      displayName: '간호사', shared: false,
      tracks: [], defaultTrack: null,
      paths: [{
        track: null,
        items: [
          item('cp.csat', 1, { major: false, skip: '이미 다니고 있다' }),
          item('cp.degree', 1.5, { major: false, skip: '이미 다니고 있다' }),
          item('p.practice', 2, { during: true }),
          item('cp.license', 3, { mayHave: undefined } as Partial<PrepItem>),
          item('cp.apply', 4),
        ],
        totals: { nonMajor: { count: 5, weeks: 0 }, major: { count: 3, weeks: 0 }, optional: 0 },
      }],
    })
    p.projects = {
      'cp.csat': project('cp.csat', { weeks: 52, phases: [{ weeks: 52, title: '수능', items: ['가'] }] }),
      'cp.degree': project('cp.degree', { weeks: 208, course: true, phases: [{ weeks: 208, title: '과정', items: ['가'] }] }),
      'p.practice': project('p.practice', { weeks: 25, phases: [{ weeks: 25, title: '실습', items: ['가'] }] }),
      'cp.license': project('cp.license', { weeks: 3, mayHave: true }),
      'cp.apply': project('cp.apply', { weeks: 3 }),
    }
    return p
  }

  it('기간은 차례로 더한 값 — 과정 중에 하는 프로젝트는 겹쳐 세지 않고, 학교·수련 과정이 얼마인지 따로 준다', () => {
    const [nonmajor, major] = buildPlanTemplates(school(), null)
    expect([nonmajor!.weeks, nonmajor!.courseWeeks]).toEqual([52 + 208 + 3 + 3, 208])
    // 전공자는 과정을 건너뛰므로 실습을 그대로 센다
    expect([major!.weeks, major!.courseWeeks]).toEqual([25 + 3 + 3, 0])
    // 자동 배치가 쓰는 표시가 프로젝트에 실린다
    expect(nonmajor!.projects.map((p) => [p.name, !!p.course, !!p.during])).toEqual([
      ['cp.csat', false, false], ['cp.degree', true, false], ['p.practice', false, true], ['cp.license', false, false], ['cp.apply', false, false],
    ])
  })

  it('이미 가지고 있는 것(운전면허·어학 성적 등)은 빼고 다시 센다 — 뺄 수 있는 것만 표시한다', () => {
    const [t] = buildPlanTemplates(school(), null)
    expect(Object.values(t!.skipRefs).map((r) => r.key)).toEqual(['cp.license'])
    const [had] = buildPlanTemplates(school(), null, [{ ref: 'cp.license', name: 'cp.license' }, { ref: 'cp.apply', name: 'cp.apply' }])   // cp.apply 는 뺄 수 없는 프로젝트라 무시된다
    expect(had!.projects.map((p) => p.name)).toEqual(['cp.csat', 'cp.degree', 'p.practice', 'cp.apply'])
    expect(had!.skipped).toEqual([{ key: 'cp.license', label: 'cp.license', byNote: false, name: 'cp.license', category: 'skill' }])
    expect(had!.weeks).toBe(t!.weeks - 3)
  })

  it('요일은 앞의 프로젝트와 겹치지 않게 나눠 넣는다', () => {
    const [t] = buildPlanTemplates(prep(), 'b')       // 주 3회 프로젝트 셋
    expect(t!.projects.map((p) => p.days.join(''))).toEqual(['월수금', '화목토', '월수금'])
  })
})

describe('요일 고르기', () => {
  it('앞에 아무것도 없으면 기본 요일 그대로', () => {
    expect(pickDays(1)).toEqual(['토'])
    expect(pickDays(2)).toEqual(['화', '목'])
    expect(pickDays(3)).toEqual(['월', '수', '금'])
    expect(pickDays(5)).toEqual(['월', '화', '수', '목', '금'])
    expect(pickDays(6)).toEqual(['월', '화', '수', '목', '금', '토'])
    expect(pickDays(7)).toHaveLength(7)
  })

  it('바로 앞 프로젝트와 겹치는 날을 피하고, 고르게 띄운다', () => {
    expect(pickDays(3, [['월', '수', '금']])).toEqual(['화', '목', '토'])
    expect(pickDays(2, [['화', '목']])).toEqual(['월', '금'])
    // 가까운 것(맨 뒤)을 더 피한다 — 화·목·토 다음의 주 2회는 월·금
    expect(pickDays(2, [['월', '수', '금'], ['화', '목', '토']])).toEqual(['월', '금'])
    // 일요일은 비워 둔다
    for (const n of [1, 2, 3, 4, 5]) expect(pickDays(n, [['월', '수', '금'], ['화', '목', '토']])).not.toContain('일')
  })

  it('주 5회 이상은 기본 요일 그대로 — 앞에 있어도 피할 대상으로 보지 않는다', () => {
    expect(pickDays(5, [['월', '수', '금']])).toEqual(['월', '화', '수', '목', '금'])
    // 수능(주 6회) 다음의 주 3회는 기본 요일. 그 앞의 가벼운 프로젝트만 본다
    expect(pickDays(3, [['월', '화', '수', '목', '금', '토']])).toEqual(['월', '수', '금'])
    expect(pickDays(3, [['월', '수', '금'], ['월', '화', '수', '목', '금', '토']])).toEqual(['화', '목', '토'])
  })
})


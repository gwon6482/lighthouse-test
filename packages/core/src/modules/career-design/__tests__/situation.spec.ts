import { describe, expect, it } from 'vitest'
import { applySituation, asksRelated, haveCandidates, isHad, haveRefOf, situationSentence, toHaeyo, trimFront } from '../lib/situation'
import { buildSituationTemplate } from '../composables/usePlanTemplates'
import type { JobPreparation, PrepItem, PrepProject } from '@/modules/encyclopedia/types/encyclopedia'
import type { CareerProfile } from '../types/career-design'

// 내 진로상황으로 예시 진로설계를 맞추는 규칙(2026-11-16) — 시안의 '답에 따라 계획이 바뀌는 규칙'
const project = (id: string, weeks: number, over: Partial<PrepProject> = {}): PrepProject => ({
  id, name: id, type: 'skill', typeName: null, subtype: null, subtypeName: null,
  category: 'skill', method: 'practice', level: '입문', daysPerWeek: 3, minutesPerSession: 60,
  goal: '', phases: [{ weeks, title: id, items: ['가'] }], weeks, scope: 'job', basis: null, ...over,
})
const item = (ref: string, step: number, over: Partial<PrepItem> = {}): PrepItem => ({ ref, step, major: true, optional: false, fromTrack: false, ...over })
const profile = (over: Partial<CareerProfile> = {}): CareerProfile => ({ relatedJobs: [], has: [], records: [], ...over })

// 간호사와 같은 모양 — 수능 세트(전공자 생략) → 대학 4년(과정) → 과정 중 걸음 → 졸업 뒤 걸음
const nurse = (): JobPreparation => {
  const admission = (id: string, w: number) => project(id, w, { type: 'edu', subtype: 'admission', category: 'qualification' })
  const projects: Record<string, PrepProject> = {
    'cp.csat-a': admission('cp.csat-a', 20), 'cp.csat-b': admission('cp.csat-b', 16), 'cp.csat-c': admission('cp.csat-c', 12), 'cp.apply': admission('cp.apply', 4),
    'cp.degree-4y': project('cp.degree-4y', 208, { type: 'edu', subtype: 'major', category: 'knowledge', course: true, phases: [{ weeks: 52, title: '1학년', items: ['가'] }, { weeks: 104, title: '2~3학년', items: ['나'] }, { weeks: 52, title: '4학년', items: ['다'] }] }),
    'cp.bls': project('cp.bls', 1, { type: 'cert', subtype: 'basic', category: 'qualification', haveLabel: 'BLS(기본소생술) 수료' }),
    'p.clinical': project('p.clinical', 25, { type: 'edu', subtype: 'required-course', category: 'experience' }),
    'p.skills': project('p.skills', 3, { type: 'skill', subtype: 'field' }),
    'cp.license': project('cp.license', 16, { type: 'cert', subtype: 'national-license', category: 'qualification', haveLabel: '보건의료 면허', haveByNote: true }),
    'cp.hospital': project('cp.hospital', 4, { type: 'hiring', subtype: 'interview', category: 'qualification' }),
    'cp.resume': project('cp.resume', 3, { type: 'hiring', subtype: 'interview', category: 'qualification' }),
    'cp.toeic': project('cp.toeic', 8, { type: 'cert', subtype: 'language', category: 'qualification', mayHave: true, haveLabel: '토익 점수' }),
  }
  const skip = '이미 간호학과에 다니고 있다'
  return {
    jobCode: '304004', title: '간호사', displayName: '간호사', shared: false,
    plan: { jobCode: '304004', title: '간호사', displayName: '간호사', family: 'health', familyName: null, status: 'draft', updatedAt: null, summary: '', gate: null, caution: null, checked: null, relatedMajor: '간호학과' },
    tracks: [], defaultTrack: null,
    paths: [{
      track: null,
      items: [
        item('cp.csat-a', 1, { major: false, skip }), item('cp.csat-b', 1.1, { major: false, skip }), item('cp.csat-c', 1.2, { major: false, skip }), item('cp.apply', 1.3, { major: false, skip }),
        item('cp.degree-4y', 1.35, { major: false, skip }),
        item('cp.bls', 4, { during: true }), item('p.clinical', 5, { during: true }), item('p.skills', 7, { during: true }),
        item('cp.toeic', 8, { optional: true }),
        item('cp.license', 9, { during: true, note: '간호사 국가시험' }),
        item('cp.hospital', 10), item('cp.resume', 11),
      ],
      totals: { nonMajor: { count: 0, weeks: 0 }, major: { count: 0, weeks: 0 }, optional: 1 },
    }],
    projects,
  }
}
const run = (p: CareerProfile) => { const prep = nurse(); return applySituation(prep, prep.paths[0]!, p) }
const names = (r: ReturnType<typeof run>) => r.rows.map((x) => x.project.id)
const related = { relatedJobs: [{ jobCode: '304004', name: '간호사' }] }

describe('내 진로상황 — 학교와 관련 학과', () => {
  it('고등학생이면 바뀌는 것이 없다 — 수능부터 전체, 과정 중 걸음은 겹쳐 센다', () => {
    const r = run(profile({ school: 'high' }))
    expect(r.changes).toEqual([])
    expect(r.weeks).toBe(52 + 208 + 4 + 3)
    expect(r.optional.map((x) => x.project.id)).toEqual(['cp.toeic'])
  })

  it('관련 학과 2학년 — 입시를 빼고, 대학 과정을 남은 3년으로 줄이고, 이미 해 둔 BLS 를 뺀다', () => {
    const r = run(profile({ school: 'college', year: 2, ...related, has: [{ ref: 'cp.bls', name: 'BLS(기본소생술) 수료' }] }))
    expect(names(r)).toEqual(['cp.degree-4y', 'p.clinical', 'p.skills', 'cp.license', 'cp.hospital', 'cp.resume'])
    expect(r.rows[0]!.project.weeks).toBe(156)
    expect(r.rows[0]!.project.name).toBe('cp.degree-4y(남은 3년)')
    expect(r.rows[0]!.project.phases.map((ph) => ph.weeks)).toEqual([104, 52])     // 1학년을 앞에서 뺐다
    expect(r.weeks).toBe(156 + 4 + 3)                                               // 과정 중 걸음은 남은 3년 안에
    expect(r.courseWeeks).toBe(156)
    expect(r.changes.filter((c) => c.kind === 'cut').map((c) => c.reason)).toEqual(['간호학과에 다니고 있어요', '간호학과에 다니고 있어요', '간호학과에 다니고 있어요', '간호학과에 다니고 있어요', '이미 해 뒀어요'])
    expect(r.changes.find((c) => c.kind === 'shorten')).toMatchObject({ reason: '2학년이에요(이번 학년 포함)', fromWeeks: 208, toWeeks: 156 })
  })

  it('4학년 이상은 마지막 1년만', () => {
    expect(run(profile({ school: 'college', year: 4, ...related })).rows[0]!.project.weeks).toBe(52)
  })

  it('관련 학과 졸업 — 대학 과정과 학교에서 하던 실습을 빼고, 시험·지원 준비와 실무 연습은 남긴다', () => {
    const r = run(profile({ school: 'college_grad', ...related }))
    expect(names(r)).toEqual(['cp.bls', 'p.skills', 'cp.license', 'cp.hospital', 'cp.resume'])
    expect(r.weeks).toBe(1 + 3 + 16 + 4 + 3)        // 과정이 없으니 그대로 센다
    expect(r.courseWeeks).toBe(0)
    expect(r.changes.map((c) => c.reason)).toContain('학교 과정에서 마쳤어요')
    expect(r.changes.find((c) => c.ref === 'cp.apply')!.reason).toBe('간호학과를 졸업했어요')
  })

  it('다른 학과에 다니거나 졸업했으면 바뀌는 것이 없다', () => {
    expect(run(profile({ school: 'college', year: 3 })).changes).toEqual([])
    expect(run(profile({ school: 'college_grad' })).changes).toEqual([])
  })

  it('메모가 자격 이름인 것은 이름까지 같아야 해 둔 것으로 본다', () => {
    const prep = nurse()
    const lic = prep.paths[0]!.items.find((i) => i.ref === 'cp.license')!
    const ref = haveRefOf(prep, lic, prep.projects['cp.license']!)
    expect(ref).toEqual({ key: 'cp.license', label: '간호사 국가시험' })
    expect(isHad([{ ref: 'cp.license', name: '물리치료사 국가시험' }], ref, true)).toBe(false)
    expect(isHad([{ ref: 'cp.license', name: '간호사 국가시험' }], ref, true)).toBe(true)
    expect(names(run(profile({ has: [{ ref: 'cp.license', name: '간호사 국가시험' }] })))).not.toContain('cp.license')
  })

  it('체크리스트는 필수 걸음 가운데 자격·면허·어학·근무 경험만 — 선택 걸음과 학교 과정은 빠진다', () => {
    expect(haveCandidates(nurse()).map((c) => c.label)).toEqual(['BLS(기본소생술) 수료', '간호사 국가시험'])
  })

  it('한 줄 설명', () => {
    const prep = nurse()
    expect(situationSentence(prep, profile({ school: 'college', year: 2, ...related }))).toBe('간호학과 2학년이에요')
    expect(situationSentence(prep, profile({ school: 'college', year: 4, ...related }))).toBe('간호학과 4학년 이상이에요')
    expect(situationSentence(prep, profile({ school: 'college_grad', ...related }))).toBe('간호학과를 졸업했어요')
    expect(situationSentence(prep, profile({ school: 'college', year: 1 }))).toBe('대학생 1학년이에요')
    expect(situationSentence(prep, profile({ school: 'hs_grad' }))).toBe('고등학교를 졸업했어요')
  })

  it('템플릿 카드 — 이유와 함께 하나의 플랜, 과정 중 표시는 남은 과정에 붙는다', () => {
    const t = buildSituationTemplate(nurse(), null, profile({ school: 'college', year: 2, ...related }))!
    expect(t.stage).toBe('mine')
    expect(t.who).toBe('간호학과 2학년이에요')
    expect(t.weeks).toBe(156 + 4 + 3)
    expect(t.projects.map((p) => [p.name, !!p.course, !!p.during, p.curriculum?.length])).toEqual([
      ['cp.degree-4y(남은 3년)', true, false, 156], ['cp.bls', false, true, 1], ['p.clinical', false, true, 25], ['p.skills', false, true, 3],
      ['cp.license', false, true, 16], ['cp.hospital', false, false, 4], ['cp.resume', false, false, 3],
    ])
    expect(t.optional.map((o) => o.name)).toEqual(['cp.toeic'])
  })
})

describe('내 진로상황 — 법조·전공 과목·대학원', () => {
  it('법조(skipFor any) — 학과와 상관없이 대학생이면 입시를 빼고 학부는 남은 학년만, 졸업이면 학부까지', () => {
    const prep = nurse()
    for (const i of prep.paths[0]!.items) if (!i.major) i.skipFor = 'any'
    prep.plan.relatedMajor = null
    expect(asksRelated(prep)).toBe(false)
    const enrolled = applySituation(prep, prep.paths[0]!, profile({ school: 'college', year: 3 }))
    expect(enrolled.changes.filter((c) => c.kind === 'cut').map((c) => c.reason)).toEqual(Array(4).fill('대학에 다니고 있어요'))
    expect(enrolled.rows[0]!.project.weeks).toBe(104)
    const graduated = applySituation(prep, prep.paths[0]!, profile({ school: 'college_grad' }))
    expect(graduated.rows.map((r) => r.project.id)).not.toContain('cp.degree-4y')
    expect(graduated.changes.find((c) => c.ref === 'cp.apply')!.reason).toBe('대학을 졸업했어요')
  })

  it('전공 과목에서 배우는 걸음 — 관련 학과면 빼고 이유를 해요체로', () => {
    const prep = nurse()
    prep.paths[0]!.items = [item('p.basics', 1, { major: false, skip: '경영학 마케팅 과목에서 배운다' }), item('cp.hospital', 2)]
    prep.projects['p.basics'] = project('p.basics', 4, { type: 'edu', subtype: 'major', category: 'knowledge' })
    expect(asksRelated(prep)).toBe(true)
    const r = applySituation(prep, prep.paths[0]!, profile({ school: 'college', year: 1, ...related }))
    expect(r.changes).toEqual([{ kind: 'cut', ref: 'p.basics', name: 'p.basics', reason: '경영학 마케팅 과목에서 배워요' }])
    expect(applySituation(prep, prep.paths[0]!, profile({ school: 'college', year: 1 })).changes).toEqual([])
  })

  it('석사 — 대학원생이면 남은 1년, 대학원 졸업이면 과정과 학위 논문을 뺀다', () => {
    const prep = nurse()
    prep.paths[0]!.items = [item('cp.master-2y', 1), item('p.thesis', 2, { during: true }), item('cp.resume', 3)]
    prep.projects['cp.master-2y'] = project('cp.master-2y', 104, { type: 'edu', subtype: 'graduate', category: 'knowledge', course: true })
    prep.projects['p.thesis'] = project('p.thesis', 28, { type: 'output', subtype: 'research', category: 'portfolio' })
    const inGrad = applySituation(prep, prep.paths[0]!, profile({ school: 'grad_school', ...related }))
    expect(inGrad.rows.map((r) => [r.project.id, r.project.weeks])).toEqual([['cp.master-2y', 52], ['p.thesis', 28], ['cp.resume', 3]])
    expect(inGrad.weeks).toBe(52 + 3)
    const done = applySituation(prep, prep.paths[0]!, profile({ school: 'grad_done', ...related }))
    expect(done.rows.map((r) => r.project.id)).toEqual(['cp.resume'])
  })
})

describe('도움 함수', () => {
  it('학교 과정을 앞에서부터 줄인다', () => {
    expect(trimFront([{ weeks: 52, title: 'a', items: [] }, { weeks: 104, title: 'b', items: [] }, { weeks: 52, title: 'c', items: [] }], 104).map((p) => [p.title, p.weeks])).toEqual([['b', 52], ['c', 52]])
  })
  it('자료의 -다 꼴 이유를 해요체로', () => {
    expect(toHaeyo('사회복지학과 교육과정에 포함돼 있다')).toBe('사회복지학과 교육과정에 포함돼 있어요')
    expect(toHaeyo('상경 계열 전공 과목으로 채워진다')).toBe('상경 계열 전공 과목으로 채워져요')
    expect(toHaeyo('전공 교육과정이 대신한다')).toBe('전공 교육과정이 대신해요')
  })
})

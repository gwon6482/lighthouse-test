import { describe, expect, it } from 'vitest'
import {
  applySituation, asksRelated, haveCandidates, isHad, haveRefOf, situationSentence, toHaeyo, trimFront,
  pairedHaveLabel, haveTargetOf, isOwned, pairedCertIds, sameHave, withoutHave,
} from '../lib/situation'
import { buildPlanTemplates, buildSituationTemplate } from '../composables/usePlanTemplates'
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

// ── 필기·실기(1·2차) 짝 걸음과 옛 열쇠(2026-11-17) ──
// 자료(data/written-practical): 자격을 따는 뒤 걸음이 예전 id 그대로, 앞 걸음은 '<id>-written'·'<id>-first'. 짝 두 걸음은 메모가 같다
const cert = (id: string, over: Partial<PrepProject> = {}) => project(id, 8, { type: 'cert', subtype: 'national-tech', category: 'qualification', ...over })
const planOf = (items: PrepItem[], projects: Record<string, PrepProject>, jobCode = '135001'): JobPreparation => {
  const prep = nurse()
  return {
    ...prep, jobCode, plan: { ...prep.plan, jobCode, relatedMajor: null },
    paths: [{ ...prep.paths[0]!, items }],
    projects: { 'cp.resume': prep.projects['cp.resume']!, ...projects },
  }
}
const cutRefs = (prep: JobPreparation, has: CareerProfile['has']) =>
  applySituation(prep, prep.paths[0]!, profile({ has })).changes.filter((c) => c.kind === 'cut').map((c) => `${c.ref} ${c.reason}`)
// 기사 두 개(메모가 자격 이름) — 한 계획에 같은 앞 걸음 번호가 둘 나온다(140207 건축시공 qs 갈래와 같은 모양)
const twoEngineers = () => planOf(
  [item('cp.engineer-cert-written', 1, { note: '전기기사' }), item('cp.engineer-cert', 1.5, { note: '전기기사' }),
    item('cp.engineer-cert-written', 2, { note: '정보통신기사 — 선임 자격' }), item('cp.engineer-cert', 2.5, { note: '정보통신기사 — 선임 자격' }), item('cp.resume', 3)],
  { 'cp.engineer-cert-written': cert('cp.engineer-cert-written', { haveLabel: '기사 필기 합격' }), 'cp.engineer-cert': cert('cp.engineer-cert', { haveLabel: '기사 자격', haveByNote: true }) },
)
const infoEng = () => planOf(
  [item('cp.info-eng-written', 1), item('cp.info-eng', 1.5), item('cp.resume', 2)],
  { 'cp.info-eng-written': cert('cp.info-eng-written', { haveLabel: '정보처리기사 필기 합격' }), 'cp.info-eng': cert('cp.info-eng', { haveLabel: '정보처리기사' }) },
)

describe('짝 걸음 — 자격을 해 뒀으면 필기·1차·연수도 뺀다', () => {
  it('꼬리 규칙: -written → 예전 id, -first → 예전 id 또는 -second, p.first → p.second', () => {
    expect(pairedCertIds('cp.info-eng-written')).toEqual(['cp.info-eng'])
    expect(pairedCertIds('cp.security-manager-first')).toEqual(['cp.security-manager', 'cp.security-manager-second'])
    expect(pairedCertIds('p.cpa-first')).toEqual(['p.cpa', 'p.cpa-second'])
    expect(pairedCertIds('p.first')).toEqual(['p.second'])
    for (const id of ['cp.info-eng', 'cp.license-practical', 'p.cpa-second', 'p.second']) expect(pairedCertIds(id)).toEqual([])
    // 보건 필기는 꼬리 규칙상 'cp.license' 를 찾지만 그런 걸음이 없어 짝이 생기지 않는다(아래 보건 시험)
    expect(pairedCertIds('cp.license-written')).toEqual(['cp.license'])
  })

  it('자격을 해 뒀으면 필기도 함께 빠진다(이름이 정해진 자격 — 번호로 비교)', () => {
    expect(cutRefs(infoEng(), [{ ref: 'cp.info-eng', name: '정보처리기사' }])).toEqual(['cp.info-eng-written 이미 해 뒀어요', 'cp.info-eng 이미 해 뒀어요'])
  })

  it('필기만 붙었으면 필기만 빠지고 실기는 남는다', () => {
    expect(cutRefs(infoEng(), [{ ref: 'cp.info-eng-written', name: '정보처리기사 필기 합격' }])).toEqual(['cp.info-eng-written 이미 해 뒀어요'])
  })

  it('기사가 둘이면 해 둔 기사의 필기만 빠진다(메모가 자격 이름)', () => {
    const prep = twoEngineers()
    const r = applySituation(prep, prep.paths[0]!, profile({ has: [{ ref: 'cp.engineer-cert', name: '정보통신기사 — 선임 자격' }] }))
    expect(r.rows.map((x) => `${x.item.ref} ${x.item.note ?? ''}`)).toEqual(['cp.engineer-cert-written 전기기사', 'cp.engineer-cert 전기기사', 'cp.resume '])
  })

  it('앞 걸음 체크리스트 이름에 자격 이름을 붙이고, 이름으로 비교한다(다른 기사의 필기는 안 빠진다)', () => {
    const prep = twoEngineers()
    expect(haveCandidates(prep).map((c) => `${c.label}${c.byNote ? '' : ' (번호만)'}`)).toEqual([
      '전기기사 필기 합격', '전기기사', '정보통신기사 필기 합격 — 선임 자격', '정보통신기사 — 선임 자격',
    ])
    const r = applySituation(prep, prep.paths[0]!, profile({ has: [{ ref: 'cp.engineer-cert-written', name: '전기기사 필기 합격' }] }))
    expect(r.rows.map((x) => `${x.item.ref} ${x.item.note ?? ''}`)).toEqual([
      'cp.engineer-cert 전기기사', 'cp.engineer-cert-written 정보통신기사 — 선임 자격', 'cp.engineer-cert 정보통신기사 — 선임 자격', 'cp.resume ',
    ])
  })

  it('앞 걸음 이름 — 끝의 \' — 설명\'은 뒤로, 괄호는 자격 이름이라 그대로, 1차는 \'1차 합격\'', () => {
    expect(pairedHaveLabel('정보보안기사', 'cp.engineer-cert-written')).toBe('정보보안기사 필기 합격')
    expect(pairedHaveLabel('가스기능사 — 가스 점검원 우대', 'cp.craftsman-cert-written')).toBe('가스기능사 필기 합격 — 가스 점검원 우대')
    expect(pairedHaveLabel('미용사(일반)', 'cp.craftsman-cert-written')).toBe('미용사(일반) 필기 합격')
    expect(pairedHaveLabel('경영지도사', 'p.co-cert-first')).toBe('경영지도사 1차 합격')
  })

  it('예전부터 나눈 전문자격 1·2차도 같은 원리(직업 전용 열쇠 \'계획 코드:p.번호\')', () => {
    const cpa = planOf([item('p.cpa-first', 1), item('p.cpa-second', 2)], { 'p.cpa-first': cert('p.cpa-first'), 'p.cpa-second': cert('p.cpa-second') }, '023101')
    expect(cutRefs(cpa, [{ ref: '023101:p.cpa-second', name: 'p.cpa-second' }])).toEqual(['p.cpa-first 이미 해 뒀어요', 'p.cpa-second 이미 해 뒀어요'])
    const customs = planOf([item('p.first', 1), item('p.second', 2)], { 'p.first': cert('p.first'), 'p.second': cert('p.second') }, '023301')
    expect(cutRefs(customs, [{ ref: '023301:p.second', name: 'p.second' }])).toEqual(['p.first 이미 해 뒀어요', 'p.second 이미 해 뒀어요'])
    // 다른 직업의 같은 번호(p.second)는 다른 열쇠다
    expect(cutRefs(customs, [{ ref: '023401:p.second', name: 'p.second' }])).toEqual([])
  })

  it('보건의료 국가시험 필기·실기는 짝이 아니다 — 직종마다 먼저 보는 시험이 달라 한쪽이 다른 쪽을 품지 않는다', () => {
    const lic = planOf(
      [item('cp.license-practical', 1, { note: '치과기공사 국가시험 실기' }), item('cp.license-written', 2, { note: '치과기공사 국가시험 필기' })],
      { 'cp.license-written': cert('cp.license-written', { subtype: 'national-license', haveByNote: true }), 'cp.license-practical': cert('cp.license-practical', { subtype: 'national-license', haveByNote: true }) },
    )
    expect(cutRefs(lic, [{ ref: 'cp.license-written', name: '치과기공사 국가시험 필기' }])).toEqual(['cp.license-written 이미 해 뒀어요'])
  })

  it('템플릿(비전공·기본 플랜)도 같은 규칙 — 앞 걸음 \'다시 넣기\'는 짝인 자격도 함께 뺀다', () => {
    const prep = infoEng()
    const has = [{ ref: 'cp.info-eng', name: '정보처리기사' }]
    const t = buildPlanTemplates(prep, null, has)[0]!
    expect(t.projects.map((p) => p.name)).toEqual(['cp.resume'])
    expect(t.skipped.map((s) => s.label)).toEqual(['정보처리기사 필기 합격', '정보처리기사'])
    const front = t.skipped[0]!
    expect(front.pair).toMatchObject({ key: 'cp.info-eng', label: '정보처리기사' })
    expect(withoutHave(has, front)).toEqual([])
    // 뒤 걸음만 다시 넣어도 둘 다 돌아온다(필기는 자격 때문에 빠졌던 것)
    expect(buildPlanTemplates(prep, null, withoutHave(has, t.skipped[1]!))[0]!.projects).toHaveLength(3)
  })

  it('isOwned 는 자격·면허·어학·근무 경험만(채용 필기 같은 걸음은 짝이어도 보지 않는다)', () => {
    const prep = planOf([item('cp.major-written', 1)], { 'cp.major-written': project('cp.major-written', 8, { type: 'hiring', subtype: 'ncs', category: 'qualification' }), 'cp.major': cert('cp.major') })
    expect(isOwned(prep, [{ ref: 'cp.major', name: 'cp.major' }], prep.paths[0]!.items[0]!, prep.projects['cp.major-written']!)).toBe(false)
  })
})

describe('옛 열쇠 — 나누기 전에 저장한 \'이미 해 둔 것\'도 새 걸음으로 읽는다', () => {
  const doctor = () => planOf(
    [item('cp.license-practical', 1, { note: '의사 국가시험 실기', during: true }), item('cp.license-written', 2, { note: '의사 국가시험 필기', during: true }), item('cp.resume', 3)],
    { 'cp.license-written': cert('cp.license-written', { subtype: 'national-license', haveLabel: '보건의료 국가시험 필기 합격', haveByNote: true }),
      'cp.license-practical': cert('cp.license-practical', { subtype: 'national-license', haveLabel: '보건의료 국가시험 실기 합격', haveByNote: true }) },
    '301201',
  )
  const old = { ref: 'cp.license-exam', name: '의사 국가시험(필기·실기)' }

  it('보건의료: \'○ 국가시험(필기·실기)\' 하나가 필기·실기 두 걸음을 뺀다', () => {
    expect(cutRefs(doctor(), [old])).toEqual(['cp.license-practical 이미 해 뒀어요', 'cp.license-written 이미 해 뒀어요'])
  })

  it('다른 직업의 국가시험 저장값은 건드리지 않는다(간호사는 여전히 cp.license-exam 하나)', () => {
    expect(cutRefs(doctor(), [{ ref: 'cp.license-exam', name: '간호사 국가시험' }])).toEqual([])
    expect(names(run(profile({ has: [{ ref: 'cp.license', name: '간호사 국가시험' }] })))).not.toContain('cp.license')
  })

  it('체크리스트에 체크된 것으로 보이고, \'다른 계획에서 고른 것\'으로 따로 남지 않는다', () => {
    const cands = haveCandidates(doctor())
    expect(cands.map((c) => [c.label, isHad([old], c, c.byNote)])).toEqual([['의사 국가시험 실기', true], ['의사 국가시험 필기', true]])
    expect(cands.some((c) => sameHave(old, c))).toBe(true)
  })

  it('하나만 체크를 풀면 남은 걸음은 새 열쇠로 풀어 남긴다', () => {
    const written = haveCandidates(doctor()).find((c) => c.key === 'cp.license-written')!
    expect(withoutHave([old, { ref: 'cp.toeic', name: '토익 점수' }], written)).toEqual([
      { ref: 'cp.license-practical', name: '의사 국가시험 실기' }, { ref: 'cp.toeic', name: '토익 점수' },
    ])
  })

  it('미용사: 메모에서 \'필기·실기\'를 뗀 기능사 — 옛 이름으로 저장한 것도 자격과 필기를 함께 뺀다', () => {
    const beauty = planOf(
      [item('cp.craftsman-cert-written', 1, { note: '미용사(네일)' }), item('cp.craftsman-cert', 1.5, { note: '미용사(네일)' })],
      { 'cp.craftsman-cert-written': cert('cp.craftsman-cert-written', { haveLabel: '기능사 필기 합격' }), 'cp.craftsman-cert': cert('cp.craftsman-cert', { haveLabel: '기능사 자격', haveByNote: true }) },
      '511201',
    )
    expect(cutRefs(beauty, [{ ref: 'cp.craftsman-cert', name: '미용사(네일) 필기·실기' }])).toEqual(['cp.craftsman-cert-written 이미 해 뒀어요', 'cp.craftsman-cert 이미 해 뒀어요'])
    expect(cutRefs(beauty, [{ ref: 'cp.craftsman-cert', name: '미용사(일반) 필기·실기' }])).toEqual([])
    expect(haveTargetOf(beauty, beauty.paths[0]!.items[0]!, beauty.projects['cp.craftsman-cert-written']!)).toMatchObject({ label: '미용사(네일) 필기 합격', byNote: true })
  })
})

// ── 법정 연수(2026-11-17 자료 '법정 교육은 과정 걸음') — 자격을 해 뒀으면 짝인 연수도 뺀다 ──
// 자료: 연수 걸음은 '<자격 걸음 id>-training'(청소년상담사 p.pc-youth-training · 생활스포츠지도사 cp.sports-instructor-cert-training)
describe('짝 걸음 — 연수', () => {
  const training = (id: string, label: string) => project(id, 2, { type: 'edu', subtype: 'required-course', category: 'qualification', mayHave: true, period: true, haveLabel: label })
  const sports = () => planOf(
    [item('cp.sports-instructor-cert-written', 1), item('cp.sports-instructor-cert', 1.5), item('cp.sports-instructor-cert-training', 1.7), item('cp.resume', 2)],
    {
      'cp.sports-instructor-cert-written': cert('cp.sports-instructor-cert-written', { subtype: 'national-license', haveLabel: '생활스포츠지도사 2급 필기 합격' }),
      'cp.sports-instructor-cert': cert('cp.sports-instructor-cert', { subtype: 'national-license', haveLabel: '생활스포츠지도사 2급' }),
      'cp.sports-instructor-cert-training': training('cp.sports-instructor-cert-training', '생활스포츠지도사 2급 연수 수료'),
    },
    '420402',
  )
  const youth = () => planOf(
    [item('p.pc-youth-written', 1), item('p.pc-youth', 1.5), item('p.pc-youth-training', 1.7), item('cp.resume', 2)],
    {
      'p.pc-youth-written': cert('p.pc-youth-written', { subtype: 'national-license', haveLabel: '청소년상담사 필기 합격' }),
      'p.pc-youth': cert('p.pc-youth', { subtype: 'national-license', haveLabel: '청소년상담사' }),
      'p.pc-youth-training': training('p.pc-youth-training', '청소년상담사 자격연수 수료'),
    },
    '231201',
  )

  it('꼬리 규칙: \'<id>-training\' → \'<id>\' · 실무 수습(-train)은 짝이 아니다', () => {
    expect(pairedCertIds('p.pc-youth-training')).toEqual(['p.pc-youth'])
    expect(pairedCertIds('cp.sports-instructor-cert-training')).toEqual(['cp.sports-instructor-cert'])
    expect(pairedCertIds('p.cpla-train')).toEqual([])
    expect(pairedHaveLabel('공조냉동기계기능사', 'cp.x-training')).toBe('공조냉동기계기능사 연수 수료')
  })

  it('자격을 해 뒀으면 필기와 연수까지 함께 빠진다(생활스포츠지도사)', () => {
    expect(cutRefs(sports(), [{ ref: 'cp.sports-instructor-cert', name: '생활스포츠지도사 2급' }])).toEqual([
      'cp.sports-instructor-cert-written 이미 해 뒀어요', 'cp.sports-instructor-cert 이미 해 뒀어요', 'cp.sports-instructor-cert-training 이미 해 뒀어요',
    ])
  })

  it('직업 전용 자격도 같다(청소년상담사 — 열쇠는 \'계획 코드:p.번호\')', () => {
    expect(cutRefs(youth(), [{ ref: '231201:p.pc-youth', name: '청소년상담사' }])).toEqual([
      'p.pc-youth-written 이미 해 뒀어요', 'p.pc-youth 이미 해 뒀어요', 'p.pc-youth-training 이미 해 뒀어요',
    ])
  })

  it('연수만 마쳤다고 고르면 연수만 빠진다 · 필기만 붙었으면 필기만', () => {
    expect(cutRefs(youth(), [{ ref: '231201:p.pc-youth-training', name: '청소년상담사 자격연수 수료' }])).toEqual(['p.pc-youth-training 이미 해 뒀어요'])
    expect(cutRefs(youth(), [{ ref: '231201:p.pc-youth-written', name: '청소년상담사 필기 합격' }])).toEqual(['p.pc-youth-written 이미 해 뒀어요'])
  })

  it('체크리스트 이름은 자료 이름 그대로 — 자격·필기·연수 세 줄', () => {
    expect(haveCandidates(sports()).map((c) => c.label)).toEqual(['생활스포츠지도사 2급 필기 합격', '생활스포츠지도사 2급', '생활스포츠지도사 2급 연수 수료'])
  })

  it('연수의 \'다시 넣기\'는 짝인 자격도 함께 뺀다(연수를 안 마쳤으면 자격도 없다)', () => {
    const has = [{ ref: 'cp.sports-instructor-cert', name: '생활스포츠지도사 2급' }]
    const t = buildPlanTemplates(sports(), null, has)[0]!
    expect(t.skipped.map((s) => s.label)).toEqual(['생활스포츠지도사 2급 필기 합격', '생활스포츠지도사 2급', '생활스포츠지도사 2급 연수 수료'])
    const tr = t.skipped[2]!
    expect(tr.pair).toMatchObject({ key: 'cp.sports-instructor-cert' })
    expect(withoutHave(has, tr)).toEqual([])
  })

  it("'-training' 이 붙었어도 짝인 자격이 없으면 짝이 아니다(발성 훈련·공정 실습)", () => {
    const prep = planOf(
      [item('cp.voice-training', 1), item('p.semi-training', 2)],
      { 'cp.voice-training': project('cp.voice-training', 4, { type: 'skill', subtype: 'field' }), 'p.semi-training': training('p.semi-training', '공정 실습 교육 수료') },
    )
    expect(isOwned(prep, [{ ref: 'cp.voice', name: 'x' }], prep.paths[0]!.items[0]!, prep.projects['cp.voice-training']!)).toBe(false)
    expect(haveTargetOf(prep, prep.paths[0]!.items[1]!, prep.projects['p.semi-training']!).pair).toBeUndefined()
  })
})

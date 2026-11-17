import { describe, it, expect } from 'vitest'
import { applyExamPace, curriculumPhases, examDurationAt, examMinAge, examPaceSummary, examStatOf, examUnits, expandPhases, meanHeadline, resizeExam, scalePhases } from '../lib/examPace'
import { autoSchedule, projectWeeks } from '../composables/usePlanTimeline'
import { examAgeDelayed, examAgeOptions, rescheduleFrom } from '../composables/usePlanPace'
import type { Project, TimelineSlot } from '../types/career-design'
import type { PrepPassStat } from '@/modules/encyclopedia/types/encyclopedia'

// 정할 것 2·3(2026-11-17) — 큰 시험은 '분량 ÷ 주당 시간', 나란히 짝은 합쳐서 기간·나눠서 시간
const P = (id: string, extra: Partial<Project> = {}): Project => ({
  id, category: 'qualification', name: id, goal: '', days: ['월', '수', '금'], duration: 60, priority: 'normal',
  notification: false, missedNotification: false, notificationTime: '09:00', memo: '', weeks: 4,
  curriculum: expandPhases([{ title: 'A', weeks: 4, items: ['x'] }]), ...extra,
})
// 9급 필기 — 자료는 전업(주 48시간) 52주: 기본 이론 20 · 기출 20 · 실전 12
const exam9 = (id = 'g9', h = 2496) => P(id, {
  name: '9급 필기(국어·영어·행정법총론·행정학개론)', studyHours: h, days: ['월', '화', '수', '목', '금', '토'], duration: 480, weeks: 52,
  curriculum: expandPhases([{ title: '기본 이론', weeks: 20, items: ['a'] }, { title: '기출 회독', weeks: 20, items: ['b'] }, { title: '실전 모의', weeks: 12, items: ['c'] }]),
})
const civil79: PrepPassStat = {
  id: 'civil79-2016', headline: '2016년 조사에서 7·9급 공채 합격자 10명 중 약 4명은 1년 안, 7명은 2년 안에 붙었어요',
  detail: null, measure: null, beyondWeeks: 104, mean: { months: 20, label: '1년 8개월' },
  dist: [{ weeks: 52, label: '1년 안', pct: 37.2 }, { weeks: 104, label: '2년 안', pct: 73.3 }, { weeks: 156, label: '3년 안', pct: 92 }, { weeks: 208, label: '4년 안', pct: 97.3 }],
  source: { title: null, level: 'news', via: null, url: null, checkedAt: null, checkAgainAt: null },
}

describe('단계 되묶기·비율 맞추기', () => {
  it('커리큘럼 → 단계 → 커리큘럼이 그대로다', () => {
    const cur = exam9().curriculum!
    const ph = curriculumPhases(cur)
    expect(ph.map((p) => [p.title, p.weeks])).toEqual([['기본 이론', 20], ['기출 회독', 20], ['실전 모의', 12]])
    expect(expandPhases(ph)).toEqual(cur)
  })
  it('비율대로 맞추고 합이 정확하며 각 단계는 1주 이상', () => {
    const s = scalePhases(curriculumPhases(exam9().curriculum!), 156)
    expect(s.reduce((n, p) => n + p.weeks, 0)).toBe(156)
    expect(s.map((p) => p.weeks)).toEqual([60, 60, 36])
    expect(scalePhases([{ title: 'a', weeks: 50, items: [] }, { title: 'b', weeks: 1, items: [] }], 10).map((p) => p.weeks)).toEqual([9, 1])
  })
})

describe('시험 기간 = 분량 ÷ 주당 시간', () => {
  it('9급 2,496시간을 주 16시간이면 156주 · 주 6일 · 1회 160분', () => {
    const r = resizeExam(exam9(), 16, 156)
    expect([r.weeks, r.curriculum!.length, r.days.length, r.duration]).toEqual([156, 156, 6, 160])
  })
  it('속도마다 — 틈틈이 5시간 500주, 올인 하루 8시간 52주', () => {
    expect(applyExamPace([exam9()], 5)[0]!.weeks).toBe(500)
    expect(applyExamPace([exam9()], 48)[0]!.weeks).toBe(52)
  })
  it('시험이 아니면 그대로, 사용자가 끊었으면(0) 그대로', () => {
    const plain = P('x')
    const cut = { ...exam9(), studyHours: 0 }
    const out = applyExamPace([plain, cut], 12)
    expect(out[0]).toBe(plain)
    expect(out[1]).toBe(cut)
  })
  it('나란히 짝(PSAT 1,248 + 전문 2,496) — 합쳐서 312주, 주당 시간은 1:2로 나눠 예산을 넘지 않는다', () => {
    const psat = { ...exam9('psat', 1248), name: 'PSAT', alongside: 'g7' }
    const major = { ...exam9('g7', 2496), name: '7급 전문' }
    const [a, b] = applyExamPace([psat, major], 12)
    expect([a!.weeks, b!.weeks]).toEqual([312, 312])
    expect([a!.duration, b!.duration]).toEqual([40, 80])
    expect((a!.duration * 6 + b!.duration * 6) / 60).toBeLessThanOrEqual(12)
  })
})

describe('합격자 줄', () => {
  it('근거 밖 = 누적 70%를 처음 넘는 구간의 비율 · 끝 = 분포의 마지막', () => {
    const st = examStatOf(civil79)!
    expect(st.beyondLine).toBe('합격한 사람 10명 중 7명은 2년 안에 붙었어요')
    expect(st.allLine).toBe('합격한 사람 100명 중 97명은 4년 안에 붙었어요')
    expect([st.beyondWeeks, st.allWeeks]).toEqual([104, 208])
  })
  it('7급(나란히 대상)은 평균 요약(headlineMean)만 — 근거 밖 줄 없음(오너 결정 8)', () => {
    const mean = '2016년 조사에서 7·9급 공채 합격자는 평균 1년 8개월 만에 붙었어요'
    expect(examStatOf({ ...civil79, headlineMean: mean }, true)).toEqual({ headline: mean, beyondWeeks: null, beyondLine: null, allWeeks: null, allLine: null })
    // 자료에 headlineMean 이 없으면 평균으로 짓는다
    expect(meanHeadline(civil79)).toBe('합격한 사람은 평균 1년 8개월 만에 붙었어요')
    expect(examStatOf({ ...civil79, dist: null, beyondWeeks: null })).toMatchObject({ headline: civil79.headline, beyondLine: null, allLine: null })
  })
  it('카드 줄 순서 — 시험 → 근거 밖(2년 넘음) → 97%(4년 넘음) → 속도 올리기(근거 밖일 때만)', () => {
    const e = { ...exam9(), examStat: examStatOf(civil79) }
    expect(examPaceSummary([e], 8)!.lines).toEqual([   // 312주 = 6년
      '그중 시험 공부가 약 6년이에요. 전업(하루 8시간) 1년 분량을 이 속도로 마치는 데 걸려요. 시험은 해마다 있어요.',
      '합격한 사람 10명 중 7명은 2년 안에 붙었어요.',
      '합격한 사람 100명 중 97명은 4년 안에 붙었어요.',
      '시간이 더 날 때(방학·졸업 뒤 등) 주간결산에서 속도를 올리면 날짜가 당겨져요.',
    ])
    expect(examPaceSummary([e], 16)!.lines.slice(1)).toEqual([   // 156주 = 3년 — 2년 넘음, 4년 안
      '합격한 사람 10명 중 7명은 2년 안에 붙었어요.',
      '시간이 더 날 때(방학·졸업 뒤 등) 주간결산에서 속도를 올리면 날짜가 당겨져요.',
    ])
    const full = examPaceSummary([e], 48)!                     // 52주 — 전업이면 '첫 시험까지', 줄 없음
    expect([full.slow, full.lines]).toEqual([false, ['그중 첫 시험까지 공부가 약 12개월이에요.']])
  })
  it('시험이 둘이면 한 줄로 합치고, 나란히 짝은 한 덩어리로 센다(검토 C1)', () => {
    const cpa = { ...exam9('cpa', 3120), name: '공인회계사 2차' }   // 9급 2,496 + 3,120 = 전업 117주 = 2년 3개월
    const sum = examPaceSummary([exam9(), cpa], 12)!               // 208 + 260 = 468주 = 9년
    expect(sum.count).toBe(2)
    expect(sum.lines[0]).toBe('그중 시험 공부(2개)가 약 9년이에요. 전업(하루 8시간) 2년 3개월 분량을 이 속도로 마치는 데 걸려요. 시험은 해마다 있어요.')
    const psat = { ...exam9('psat', 1248), name: 'PSAT', alongside: 'g7' }
    const major = { ...exam9('g7', 2496), name: '7급 전문' }
    expect(examUnits([psat, major]).map((u) => u.hours)).toEqual([3744])
    expect(examPaceSummary([psat, major], 12)!.lines[0]).toBe('그중 시험 공부가 약 6년이에요. 전업(하루 8시간) 1년 6개월 분량을 이 속도로 마치는 데 걸려요. 시험은 해마다 있어요.')
  })
  it('응시 나이 — 자료의 minAge 먼저, 없으면 이름 규칙(9급·PSAT 18, 교정·보호 20, 그 밖 0)', () => {
    expect(examMinAge({ name: '경위 공채 필기', studyHours: 2496, minAge: 21 })).toBe(21)
    expect(examMinAge({ ...exam9(), minAge: 20 })).toBe(20)
    expect(examMinAge(exam9())).toBe(18)
    expect(examMinAge({ name: 'PSAT', studyHours: 1248 })).toBe(18)
    expect(examMinAge({ name: '9급 필기(국어·영어·교정학개론·형사소송법개론)', studyHours: 2496 })).toBe(20)
    expect(examMinAge({ name: '공인회계사 1차', studyHours: 2496 })).toBe(0)
    expect(examMinAge({ name: '9급 필기', studyHours: 0, minAge: 18 })).toBe(0)   // 사용자가 기간을 고쳐 끊은 것은 시험이 아니다
  })
})

describe('배치', () => {
  it('나란히 짝은 같은 주에 함께 시작한다(앞 걸음이 예산을 조금 남겨도)', () => {
    const before = P('first', { days: ['월'], duration: 60, weeks: 2, curriculum: expandPhases([{ title: 'a', weeks: 2, items: [] }]) })
    const [psat, major] = applyExamPace([{ ...exam9('psat', 1248), alongside: 'g7' }, exam9('g7', 2496)], 12)
    const out = autoSchedule([before, psat!, major!], 12)
    const wk = (id: string) => out.find((o) => o.project.id === id)!.week
    expect(wk('psat')).toBe(wk('g7'))
    expect(wk('psat')).toBe(3)                 // 앞 걸음(1시간)과 짝(12시간)은 예산을 넘어 그 뒤
  })
  it('주 15시간이 안 되는 과정은 문이 아니다 — 뒤 걸음이 기다리지 않는다', () => {
    const light = P('volunteer', { period: true, days: ['토'], duration: 180, weeks: 10, curriculum: expandPhases([{ title: 'v', weeks: 10, items: [] }]) })
    const heavy = P('school', { period: true, days: ['월', '화', '수', '목', '금'], duration: 360, weeks: 10, curriculum: expandPhases([{ title: 's', weeks: 10, items: [] }]) })
    const next = P('next', { weeks: 2, curriculum: expandPhases([{ title: 'n', weeks: 2, items: [] }]) })
    expect(autoSchedule([light, next], 8).find((o) => o.project.id === 'next')!.week).toBe(1)
    expect(autoSchedule([heavy, next], 8).find((o) => o.project.id === 'next')!.week).toBe(11)
  })
  it('가벼운 과정의 시간은 예산에 센다(검토 11-17 권장) — 주 3시간 과정 + 3시간 걸음은 주 5시간에 함께 못 한다', () => {
    const light = P('volunteer', { period: true, days: ['토'], duration: 180, weeks: 10, curriculum: expandPhases([{ title: 'v', weeks: 10, items: [] }]) })
    const next = P('next', { weeks: 2, curriculum: expandPhases([{ title: 'n', weeks: 2, items: [] }]) })   // 주 3일 × 60분
    expect(autoSchedule([light, next], 5).find((o) => o.project.id === 'next')!.week).toBe(11)
    expect(autoSchedule([light, next], 8).find((o) => o.project.id === 'next')!.week).toBe(1)
  })
  it('minStart — 응시 나이로 미룬 자리보다 먼저 시작하지 않는다', () => {
    const e = applyExamPace([exam9()], 48)[0]!
    const out = autoSchedule([e], 48, { minStart: (p) => (p.studyHours ? 30 : 0) })
    expect(out[0]!.week).toBe(31)
  })
})

describe('가벼운 과정 뒤의 무거운 과정 — 앞 과정이 끝나기 전에 놓이지 않는다(11-17 lead 재확인)', () => {
  const placedAt = (out: { week: number; project: Project }[], id: string) => out.find((o) => o.project.id === id)!
  const startOf = (out: { week: number; project: Project }[], id: string) => placedAt(out, id).week
  const endOf = (out: { week: number; project: Project }[], id: string) => { const o = placedAt(out, id); return o.week + projectWeeks(o.project) - 1 }
  const period = (id: string, days: Project['days'], duration: number, weeks: number) => P(id, { period: true, days, duration, weeks, curriculum: expandPhases([{ title: id, weeks, items: [] }]) })
  const step = (id: string, weeks: number) => P(id, { weeks, curriculum: expandPhases([{ title: id, weeks, items: [] }]) })
  const FIVE: Project['days'] = ['월', '화', '수', '목', '금']
  it('사회복지사 꼴(과목 이수 주 6시간 73주 → 봉사 주 3시간 → 현장실습 주 40시간 → 1급·지원) — 실습·1급·지원은 과목 이수가 끝난 뒤', () => {
    const plan = [period('sw2', ['월', '화', '수', '목'], 90, 73), period('vol', ['토'], 180, 12), period('prac', FIVE, 480, 4),
      step('docs', 4), step('proposal', 4), step('sw1', 12), step('resume', 2), step('interview', 2)]
    const out = autoSchedule(plan, 16)
    expect(startOf(out, 'prac')).toBeGreaterThan(endOf(out, 'sw2'))
    expect(startOf(out, 'prac')).toBeGreaterThan(endOf(out, 'vol'))
    for (const id of ['sw1', 'resume', 'interview']) expect(startOf(out, id)).toBeGreaterThan(endOf(out, 'prac'))
    // 가벼운 과정은 문이 아니다 — 바로 뒤의 봉사는 과목 이수와 나란히 간다
    expect(startOf(out, 'vol')).toBeLessThan(endOf(out, 'sw2'))
  })
  it('보육교사 학점은행 꼴(과목 이수 73주 → 누리과정 → 보육실습 주 40시간 → 지원·면접) — 지원·면접이 과목 이수 중에 놓이지 않는다', () => {
    const plan = [period('cc', ['월', '화', '수', '목'], 90, 73), step('nuri', 3), period('prac', FIVE, 480, 6),
      step('ccplan', 3), step('safety', 2), step('resume', 2), step('interview', 1)]
    for (const h of [12, 16, 24]) {
      const out = autoSchedule(plan, h)
      expect(startOf(out, 'prac')).toBeGreaterThan(endOf(out, 'cc'))
      for (const id of ['resume', 'interview']) expect(startOf(out, id)).toBeGreaterThan(endOf(out, 'cc'))
    }
  })
  it('주간결산 다시 배치도 같다 — 진행 중인 가벼운 과정이 끝난 다음 주에 실습', () => {
    const plan = [period('cc', ['월', '화', '수', '목'], 90, 73), period('prac', FIVE, 480, 6), step('resume', 2)]
    const r = rescheduleFrom(plan, [{ week: 1, projects: [plan[0]!] }, { week: 74, projects: [plan[1]!] }, { week: 80, projects: [plan[2]!] }], 10, 12)
    const wk = (id: string) => r.timeline.find((s) => s.projects.some((p) => p.id === id))!.week
    expect([wk('prac'), wk('resume')]).toEqual([74, 80])
  })
})

describe('응시 나이 줄 — 나이 규칙 때문에 시험 시작이 실제로 밀렸을 때만(총괄 11-17)', () => {
  // 2026-11-17(화) 시작 · 앞 걸음 4주(주 3시간) 뒤에 9급 필기. 16세면 2028년에 18세 — 시험 걸음이 2028년 첫 주보다 먼저 끝나면 민다
  const pre = P('pre', { weeks: 4, curriculum: expandPhases([{ title: 'p', weeks: 4, items: [] }]) })
  const age16 = examAgeOptions('2026-11-17', 16, '화')
  it('16세 집중해서(주 12시간) — 시험이 2030년에 끝나 미룰 것이 없다 → 줄 없음', () => {
    expect(examAgeDelayed([pre, exam9()], 12, age16)).toBe(false)
  })
  it('16세 올인 하루 8시간(주 48시간) — 52주 시험이 2027년에 끝나 2028년 첫 주까지 민다 → 줄 있음', () => {
    expect(examAgeDelayed([pre, exam9()], 48, age16)).toBe(true)
    const start = (o: Parameters<typeof autoSchedule>[2]) => autoSchedule(applyExamPace([pre, exam9()], 48), 48, o).find((x) => x.project.id === 'g9')!.week
    expect([start(undefined), start(age16)]).toEqual([5, 8])
  })
  it('21세 · 나이를 모르면 어느 속도든 줄 없음', () => {
    const age21 = examAgeOptions('2026-11-17', 21, '화')
    expect([5, 12, 48].map((h) => examAgeDelayed([pre, exam9()], h, age21))).toEqual([false, false, false])
    expect(examAgeDelayed([pre, exam9()], 48, examAgeOptions('2026-11-17', null, '화'))).toBe(false)
  })
})

describe('주간결산 속도 바꾸기 — 남은 시험 기간을 다시 센다', () => {
  const slots = (pairs: [number, Project][]): TimelineSlot[] => pairs.map(([week, p]) => ({ week, projects: [p] }))
  it('아직 시작 안 한 시험은 새 속도로', () => {
    const e = applyExamPace([exam9()], 8)[0]!     // 312주
    const pre = P('pre', { weeks: 4 })
    const r = rescheduleFrom([pre, e], slots([[1, pre], [5, e]]), 2, 16)
    const ne = r.projects.find((p) => p.id === 'g9')!
    expect(ne.weeks).toBe(156)
    expect(r.changed.map((p) => p.id)).toEqual(['g9'])
  })
  it('이미 시작한 시험은 남은 주 × 지금 주당 시간만큼 남았다고 보고 새 속도로 — 지난 주 커리큘럼은 그대로', () => {
    const e = applyExamPace([exam9()], 8)[0]!     // 312주, 1주차 시작
    const r = rescheduleFrom([e], slots([[1, e]]), 105, 16)   // 104주 지남 → 남은 208주 × 8시간 = 1,664시간 ÷ 16 = 104주
    const ne = r.projects[0]!
    expect(ne.weeks).toBe(104 + 104)
    expect(ne.curriculum!.slice(0, 104)).toEqual(e.curriculum!.slice(0, 104))
    expect(ne.curriculum!.length).toBe(208)
    expect(ne.duration).toBe(160)
  })
  it('같은 속도면 바뀌지 않는다', () => {
    const e = applyExamPace([exam9()], 16)[0]!
    const r = rescheduleFrom([e], slots([[1, e]]), 50, 16)
    expect(r.changed).toEqual([])
    expect(r.projects[0]).toBe(e)
  })
  // 서버를 거친 모양 — weeks 는 저장되지 않고 커리큘럼 길이가 기간이다
  const roundTrip = (p: Project): Project => { const { weeks, examStat, ...rest } = p; return { ...rest, weeks: 0 } as Project }
  it('속도를 한 번 바꾼 시험도 같은 속도로 다시 세면 그대로다(검토 L1 — 5시간 그대로인데 328→449주로 늘던 것)', () => {
    const e = roundTrip(applyExamPace([exam9()], 16)[0]!)          // 156주, 1주차 시작
    const r1 = rescheduleFrom([e], slots([[1, e]]), 79, 5)          // 78주 지남 → 남은 78주 × 16 = 1,248시간 ÷ 5 = 250주
    const e2 = roundTrip(r1.projects[0]!)
    expect(projectWeeks(e2)).toBe(78 + 250)
    expect(e2.duration).toBe(examDurationAt(5))
    const r2 = rescheduleFrom([e2], slots([[1, e2]]), 99, 5)        // 20주 뒤 같은 5시간
    expect(r2.changed).toEqual([])
    expect(projectWeeks(r2.projects[0]!)).toBe(328)
    // 다시 16시간으로 — 남은 230주 × 5 = 1,150시간 ÷ 16 = 72주. 공부한 시간 합이 분량과 맞는다(78×16 + 20×5 + 72×16 ≈ 2,496)
    const r3 = rescheduleFrom([e2], slots([[1, e2]]), 99, 16)
    expect(projectWeeks(r3.projects[0]!)).toBe(98 + 72)
    expect(r3.projects[0]!.curriculum!.slice(0, 98)).toEqual(e2.curriculum!.slice(0, 98))
  })
  it('나란히 짝도 같은 속도면 그대로(1회 시간이 분 단위로 내려가도)', () => {
    const [psat, major] = applyExamPace([{ ...exam9('psat', 1248), alongside: 'g7' }, exam9('g7', 2496)], 5).map(roundTrip)
    const r = rescheduleFrom([psat!, major!], [{ week: 1, projects: [psat!, major!] }], 40, 5)
    expect(r.changed).toEqual([])
  })
})

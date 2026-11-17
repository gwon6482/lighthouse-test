import { describe, it, expect } from 'vitest'
import { applyExamPace, curriculumPhases, examMinAge, examPaceLines, examStatOf, expandPhases, resizeExam, scalePhases } from '../lib/examPace'
import { autoSchedule } from '../composables/usePlanTimeline'
import { rescheduleFrom } from '../composables/usePlanPace'
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
  it('7급(나란히 대상)·평균만 있는 수치는 근거 밖 줄이 없다', () => {
    expect(examStatOf(civil79, true)).toMatchObject({ beyondLine: null, allLine: null })
    expect(examStatOf({ ...civil79, dist: null, beyondWeeks: null })).toMatchObject({ beyondLine: null, allLine: null })
  })
  it('카드 줄 — 느리면 "전업 ○ 분량을 마치는 때", 2년을 넘으면 근거 밖, 4년을 넘으면 97%', () => {
    const e = { ...exam9(), examStat: examStatOf(civil79) }
    const [slow] = examPaceLines([e], 8)       // 312주 = 6년
    expect(slow!.examLine).toContain('전업 약 12개월 분량을 마치는 때')
    expect(slow!.beyondLine).not.toBeNull()
    expect(slow!.allLine).not.toBeNull()
    const [mid] = examPaceLines([e], 16)       // 156주 = 3년 — 2년 넘음, 4년 안
    expect([!!mid!.beyondLine, !!mid!.allLine]).toEqual([true, false])
    const [full] = examPaceLines([e], 48)      // 52주 — 줄 없음
    expect([full!.slow, full!.beyondLine, full!.allLine]).toEqual([false, null, null])
  })
  it('응시 나이 — 9급 18세, 교정 20세, 그 밖 0', () => {
    expect(examMinAge(exam9())).toBe(18)
    expect(examMinAge({ name: '9급 필기(국어·영어·교정학개론·형사소송법개론)', studyHours: 2496 })).toBe(20)
    expect(examMinAge({ name: '공인회계사 1차', studyHours: 2496 })).toBe(0)
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
  it('minStart — 응시 나이로 미룬 자리보다 먼저 시작하지 않는다', () => {
    const e = applyExamPace([exam9()], 48)[0]!
    const out = autoSchedule([e], 48, { minStart: (p) => (p.studyHours ? 30 : 0) })
    expect(out[0]!.week).toBe(31)
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
  it('이미 시작한 시험은 지난 주 비율만큼 했다고 보고 남은 분량만 새 속도로 — 지난 주 커리큘럼은 그대로', () => {
    const e = applyExamPace([exam9()], 8)[0]!     // 312주, 1주차 시작
    const r = rescheduleFrom([e], slots([[1, e]]), 105, 16)   // 104주 지남 → 남은 2/3 = 1,664시간 ÷ 16 = 104주
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
})

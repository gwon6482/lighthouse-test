// 시험일 역산(2026-11-22) — 시안 reviews/2026-11-22-exam-date-backplan.html 의 재현 숫자를 고정한다.
// 표본: 9급 일반행정(025401 g9) · 소프트웨어 개발자 백엔드(133201 be) + 정보처리기사 필기·실기. 시작 2026-11-23(월)·시작 요일 월
import { describe, expect, it } from 'vitest'
import type { DayOfWeek, Project, TimelineSlot } from '../types/career-design'
import { autoSchedule } from '../composables/usePlanTimeline'
import { buildTimeline, pacedProjects, rescheduleFrom, schedulePreview } from '../composables/usePlanPace'
import { expandPhases } from '../lib/examPace'
import {
  doneChoicesOf, examDateOf, examDateWarnings, examPairs, examVerdict, examWeekOf, hoursLabel, scheduleWithExams,
  skipDonePhases, startsOf, takesExamDate, withoutApplyItem, examAfterChange, allItemsDone, syncApplyItem,
} from '../lib/examDate'
import { COPY } from '../lib/examDateRules'

const D: Record<number, DayOfWeek[]> = { 1: ['토'], 2: ['화', '목'], 3: ['월', '수', '금'], 4: ['월', '화', '목', '금'], 5: ['월', '화', '수', '목', '금'], 6: ['월', '화', '수', '목', '금', '토'] }
const START = '2026-11-23'
const CTX = { startDate: START, reviewDay: '월' as DayOfWeek }

function mk(id: string, name: string, n: number, min: number, phases: [number, string][], extra: Partial<Project> = {}): Project {
  const curriculum = expandPhases(phases.map(([weeks, title]) => ({ title, weeks, items: [] })))
  return {
    id, name, category: 'qualification', method: 'lecture', methodDetail: {}, goal: '', days: D[n]!, duration: min,
    priority: 'normal', notification: false, missedNotification: false, notificationTime: '', memo: '',
    weeks: curriculum.length, curriculum, ...extra,
  }
}
const dated = (p: Project, date: string): Project => ({ ...p, methodDetail: { ...p.methodDetail, deadline: date } })
const know = (p: Project): Project => ({ ...p, category: 'knowledge', method: 'book' })

const g9Plan = () => [
  know(mk('pick', '직렬·분야 정하기와 시험 제도 파악', 2, 90, [[1, '조사'], [1, '계획']])),
  mk('kh', '한국사능력검정 심화', 5, 60, [[3, '시대별 흐름 정리'], [1, '기출 회독']]),
  mk('g9', '9급 필기(국어·영어·행정법총론·행정학개론)', 6, 480, [[20, '기본 이론'], [20, '기출 회독'], [12, '실전 모의']], { studyHours: 2496 }),
  know(mk('re', '결과 보고 다시 정하기', 4, 60, [[1, '결과 보고 다시 정하기']])),
  { ...mk('iv', '공무원 면접', 4, 120, [[1, '제도 이해'], [2, '답변 준비']]), method: 'etc' as const },
]
const devRows: [string, string, number, number, number][] = [
  ['a', '직무·기업 조사', 2, 2, 60], ['b', '프로그래밍 언어', 6, 5, 90], ['c', '컴퓨터공학 기초', 8, 4, 90], ['d', 'Git', 2, 3, 60],
  ['e', 'SQL', 3, 4, 60], ['f', '웹 기초', 4, 4, 90], ['g', 'API 서버', 8, 5, 120], ['h', 'DB 설계', 4, 4, 90], ['i', '배포', 4, 4, 90],
  ['j', '백엔드 프로젝트', 8, 4, 150], ['k', '팀 프로젝트', 8, 4, 150], ['l', '코딩테스트', 12, 5, 90], ['m', '자기소개서', 3, 3, 90],
  ['n', '면접', 3, 3, 90], ['o', '포트폴리오', 4, 3, 120],
]
const devPlan = () => devRows.map(([id, name, w, n, min]) => know(mk(id, name, n, min, [[w, name]])))
const infoEng = () => [
  { ...mk('w', '정보처리기사 필기', 5, 90, [[4, '필기']]), method: 'book' as const },
  { ...mk('p', '정보처리기사 실기', 5, 90, [[6, '실기']]), method: 'book' as const },
]
const order = (placed: { week: number; project: Project }[]) => placed.map((x) => [x.project.id, x.week])
const startMap = (t: TimelineSlot[]) => startsOf(t.flatMap((s) => s.projects.map((project) => ({ week: s.week, project }))))

describe('시험 주·칸', () => {
  it('9급 필기 2027-03-27(토)는 18주차(3.22~3.28) — 시험 전날이 든 주', () => {
    expect(examWeekOf(START, '2027-03-27', '월')).toBe(18)
    expect(examWeekOf(START, '2027-02-13', '월')).toBe(12)
    expect(examWeekOf(START, '2027-05-15', '월')).toBe(25)
    expect(examWeekOf(START, '2027-07-24', '월')).toBe(35)
  })
  it('시작 요일이 토요일이고 시험이 토요일이면 그 앞 주가 시험 주다', () => {
    // 2026-11-28(토) 시작 · 토요일 주 → 1주차 11.28~12.4, 2주차 12.5~12.11, 3주차 12.12~12.18. 12.19(토) 시험(4주차 첫날) → 전날 12.18 = 3주차
    expect(examWeekOf('2026-11-28', '2026-12-19', '토')).toBe(3)
  })
  it('계획 시작일보다 앞이거나 같은 날 시험은 0(배치에 쓰지 않는다)', () => {
    expect(examWeekOf(START, '2026-11-23', '월')).toBe(0)
    expect(examWeekOf(START, '2026-10-01', '월')).toBe(0)
  })
  it('시험일 칸은 합격하면 완료인 걸음에만(필수 교육·기타 빼고)', () => {
    expect(takesExamDate({ category: 'qualification', method: 'book' })).toBe(true)
    expect(takesExamDate({ category: 'qualification', method: null })).toBe(false)   // 방식이 없으면 서버가 날짜를 버린다(코드 검토 11-22)
    expect(takesExamDate({ category: 'qualification', method: 'etc' })).toBe(false)
    expect(takesExamDate({ category: 'qualification', method: 'required_course' })).toBe(false)
    expect(takesExamDate({ category: 'knowledge', method: 'book' })).toBe(false)
    // 기타에 예전에 넣은 값은 지우지 않고 쓰지도 않는다
    expect(examDateOf({ category: 'qualification', method: 'etc', methodDetail: { deadline: '2027-03-27' } })).toBe('')
    expect(examDateOf({ category: 'qualification', method: 'book', methodDetail: { deadline: '2027-3-27' } })).toBe('')
  })
  it('짝은 이름으로 — 필기 → 실기, 1차 → 2차(앞 걸음이 먼저 나올 때만)', () => {
    const ps = [{ id: '1', name: '정보처리기사 필기' }, { id: '2', name: '정보처리기사 실기' }, { id: '3', name: '공인회계사 1차' }, { id: '4', name: '공인회계사 2차' }]
    expect([...examPairs(ps)]).toEqual([['2', '1'], ['4', '3']])
    expect(examPairs([{ id: 'x', name: '의사 국가시험 실기' }, { id: 'y', name: '의사 국가시험 필기' }]).size).toBe(0)
  })
})

describe('시험일이 없으면 배치는 예전과 똑같다(회귀 — origin 1eff8cc 코드로 낸 값)', () => {
  const DEV: Record<number, [string, number][]> = {
    5: [['a', 1], ['b', 3], ['c', 9], ['d', 17], ['e', 19], ['f', 22], ['g', 26], ['h', 34], ['i', 38], ['j', 42], ['k', 50], ['l', 58], ['m', 70], ['n', 73], ['o', 76]],
    8: [['a', 1], ['b', 3], ['c', 9], ['d', 17], ['e', 17], ['f', 20], ['g', 24], ['h', 32], ['i', 36], ['j', 40], ['k', 48], ['l', 56], ['m', 68], ['n', 71], ['o', 74]],
    12: [['a', 1], ['b', 1], ['c', 7], ['d', 7], ['e', 9], ['f', 12], ['g', 16], ['h', 24], ['i', 24], ['j', 28], ['k', 36], ['l', 44], ['m', 44], ['n', 47], ['o', 56]],
    16: [['a', 1], ['b', 1], ['c', 1], ['d', 7], ['e', 7], ['f', 9], ['g', 10], ['h', 13], ['i', 17], ['j', 18], ['k', 26], ['l', 34], ['m', 34], ['n', 37], ['o', 40]],
    24: [['a', 1], ['b', 1], ['c', 1], ['d', 1], ['e', 1], ['f', 3], ['g', 7], ['h', 7], ['i', 9], ['j', 13], ['k', 15], ['l', 21], ['m', 21], ['n', 23], ['o', 23]],
  }
  const G9: Record<number, [string, number][]> = {
    5: [['pick', 1], ['kh', 3], ['g9', 7], ['re', 507], ['iv', 508]],
    8: [['pick', 1], ['kh', 1], ['g9', 5], ['re', 317], ['iv', 318]],
    16: [['pick', 1], ['kh', 1], ['g9', 5], ['re', 161], ['iv', 161]],
    48: [['pick', 1], ['kh', 1], ['g9', 5], ['re', 57], ['iv', 57]],
  }
  for (const [h, want] of Object.entries(DEV)) {
    it(`소프트웨어 개발자 · 주 ${h}시간`, () => {
      expect(order(scheduleWithExams(devPlan(), +h, CTX))).toEqual(want)
      expect([...startMap(buildTimeline(devPlan(), +h, {}, CTX))]).toEqual(want)
    })
  }
  for (const [h, want] of Object.entries(G9)) {
    it(`9급 일반행정 · 주 ${h}시간`, () => {
      const paced = pacedProjects(g9Plan(), +h)
      expect(order(scheduleWithExams(paced, +h, CTX))).toEqual(want)
      expect(order(autoSchedule(paced, +h))).toEqual(want)
    })
  }
})

describe('9급 일반행정 · 9급 필기 2027-03-27', () => {
  const plan = () => g9Plan().map((p) => (p.id === 'g9' ? dated(p, '2027-03-27') : p))
  it('어느 속도로도 시험 주(18) 안에 못 끝난다 — 지금 자리(5주차)에 두고 모자라요', () => {
    // 틈틈이(주 5)는 한국사가 3~6주차라 7주차 시작
    const ends: Record<number, [number, number]> = { 5: [7, 506], 8: [5, 316], 12: [5, 212], 16: [5, 160], 24: [5, 108], 48: [5, 56], 60: [5, 46] }
    for (const [h, [start, end]] of Object.entries(ends)) {
      const r = schedulePreview(plan(), +h, {}, CTX)
      const x = r.exams[0]!
      expect([x.start, x.end, x.verdict]).toEqual([start, end, 'short'])
      expect(x.usableWeeks).toBe(18 - start + 1)     // 18주가 아니라 한국사 뒤 14주(데이터 평가 11-22)
      expect(x.available).toBe((18 - start + 1) * +h)
    }
  })
  it('계획 끝은 지금처럼 배치가 정한다(전력으로 163주차)', () => {
    expect(schedulePreview(plan(), 16, {}, CTX).endWeek).toBe(163)
  })
  it("'기출을 한 바퀴 이상 풀었어요' — 남은 576시간, 하루 8시간이면 5~16주차(시험 2주 전, 여유)", () => {
    const g = plan().find((p) => p.id === 'g9')!
    const choices = doneChoicesOf(g)
    expect(choices.map((c) => [c.label, c.hours])).toEqual([
      ['아직 시작 전이에요', 2496], ['기본 강의를 한 번 다 들었어요', 1536], ['기출을 한 바퀴 이상 풀었어요', 576],
    ])
    expect(hoursLabel(1536)).toBe('약 1,500시간')
    expect(hoursLabel(576)).toBe('약 600시간')
    expect(hoursLabel(2496)).toBe('약 2,500시간')
    const skipped = plan().map((p) => (p.id === 'g9' ? skipDonePhases(p, 2) : p))
    const at = (h: number) => schedulePreview(skipped, h, {}, CTX).exams[0]!
    expect([at(48).start, at(48).end, at(48).spare, at(48).verdict]).toEqual([5, 16, 2, 'ahead'])
    expect([at(60).end, at(60).verdict]).toEqual([14, 'ahead'])
    expect([at(24).end, at(24).spare, at(24).verdict]).toEqual([28, -10, 'short'])
    // 하루 6시간(주 36) 16주 — 앞당겨 3~18주차(시험 주에 끝남 · 빠듯). 한국사(날짜 없음)는 순서상 앞이라 1~4주차 그대로 겹친다
    const r36 = schedulePreview(skipped, 36, {}, CTX)
    expect([r36.exams[0]!.start, r36.exams[0]!.end, r36.exams[0]!.verdict]).toEqual([3, 18, 'tight'])
    // '아직 시작 전'으로 되돌리기
    const back = skipDonePhases(skipped.find((p) => p.id === 'g9')!, 0)
    expect([back.studyHours, back.curriculum?.length, back.examBackup]).toEqual([2496, 52, undefined])
  })
})

describe('한국사 2027-02-13(예시) — 여유가 있으면 늦추지 않는다', () => {
  it('전력으로: 1~4주차 그대로, 시험까지 8주', () => {
    const plan = g9Plan().map((p) => (p.id === 'kh' ? dated(p, '2027-02-13') : p))
    const r = schedulePreview(plan, 16, {}, CTX)
    expect([r.exams[0]!.start, r.exams[0]!.end, r.exams[0]!.spare, r.exams[0]!.verdict]).toEqual([1, 4, 8, 'ahead'])
    expect(r.starts.get('g9')).toBe(5)
    expect(r.endWeek).toBe(163)
  })
})

describe('소프트웨어 개발자 + 정보처리기사(예시 날짜 필기 2027-05-15 · 실기 2027-07-24) — 순서보다 날짜가 먼저', () => {
  const plan = () => [...devPlan(), ...infoEng().map((p) => dated(p, p.id === 'w' ? '2027-05-15' : '2027-07-24'))]
  it('꾸준히(주 8): 필기 78→22~25주차, 실기 82→30~35주차, 계획 끝 87→89주차', () => {
    const before = schedulePreview([...devPlan(), ...infoEng()], 8, {}, CTX)
    expect([before.starts.get('w'), before.starts.get('p'), before.endWeek]).toEqual([78, 82, 87])
    const r = schedulePreview(plan(), 8, {}, CTX)
    expect([r.starts.get('w'), r.starts.get('p'), r.endWeek]).toEqual([22, 30, 89])
    expect(r.exams.map((x) => [x.end, x.verdict])).toEqual([[25, 'tight'], [35, 'tight']])
    expect(r.starts.get('f')).toBe(26)               // 웹 기초 — 4월 1·2주차(20·21)가 빈다
  })
  it('집중해서(주 12): 계획 끝 69→79주차, API 서버 16→36주차', () => {
    expect(schedulePreview([...devPlan(), ...infoEng()], 12, {}, CTX).endWeek).toBe(69)
    const r = schedulePreview(plan(), 12, {}, CTX)
    expect([r.endWeek, r.starts.get('g')]).toEqual([79, 36])
  })
  it('필기에만 날짜 — 실기(날짜 없음)는 필기가 끝난 다음 주부터', () => {
    const p2 = [...devPlan(), ...infoEng().map((p) => (p.id === 'w' ? dated(p, '2027-05-15') : p))]
    const r = schedulePreview(p2, 8, {}, CTX)
    expect(r.starts.get('w')).toBe(22)
    expect(r.starts.get('p')!).toBeGreaterThanOrEqual(26)
  })
  it('실기에만 날짜 — 앞당기면 날짜 없는 필기도 그 앞으로', () => {
    const p2 = [...devPlan(), ...infoEng().map((p) => (p.id === 'p' ? dated(p, '2027-07-24') : p))]
    const r = schedulePreview(p2, 8, {}, CTX)
    expect([r.starts.get('p'), r.starts.get('w')]).toEqual([30, 26])
  })
})

describe('짝은 같은 주에 함께 시작하지 않는다(정할 것 6 — 예전엔 주 16시간 이상에서 겹쳤다)', () => {
  for (const h of [8, 12, 16, 24]) {
    it(`주 ${h}시간`, () => {
      expect(order(scheduleWithExams(infoEng(), h))).toEqual([['w', 1], ['p', 5]])
    })
  }
})

describe('배치 두 벌이 같은 답을 낸다(autoSchedule ↔ rescheduleFrom, 아무것도 시작 안 한 계획)', () => {
  const cases: [string, () => Project[]][] = [
    ['9급 날짜', () => g9Plan().map((p) => (p.id === 'g9' ? dated(p, '2027-03-27') : p.id === 'kh' ? dated(p, '2027-02-13') : p))],
    ['9급 기출 끝', () => g9Plan().map((p) => (p.id === 'g9' ? dated(skipDonePhases(p, 2), '2027-03-27') : p))],
    ['개발자 + 정보처리기사', () => [...devPlan(), ...infoEng().map((p) => dated(p, p.id === 'w' ? '2027-05-15' : '2027-07-24'))]],
    ['개발자 + 실기 날짜만', () => [...devPlan(), ...infoEng().map((p) => (p.id === 'p' ? dated(p, '2027-07-24') : p))]],
    ['날짜 없음', () => [...devPlan(), ...infoEng()]],
  ]
  for (const [name, make] of cases) {
    for (const h of [5, 8, 12, 16, 24, 36, 48]) {
      it(`${name} · 주 ${h}시간`, () => {
        const paced = pacedProjects(make(), h)
        const a = startsOf(scheduleWithExams(paced, h, CTX))
        const b = startMap(rescheduleFrom(paced, [], 1, h, 60, CTX).timeline)
        expect([...b].sort()).toEqual([...a].sort())
      })
    }
  }
})

describe('주간결산에서 속도 바꾸기(9급 기출 끝 · 올인 하루 8시간 · 9주차부터)', () => {
  const plan = () => g9Plan().map((p) => (p.id === 'g9' ? dated(skipDonePhases(p, 2), '2027-03-27') : p))
  const paced = pacedProjects(plan(), 48)
  const timeline = buildTimeline(paced, 48, {}, CTX)
  it('그대로면 16주차에 끝(시험 2주 전)', () => {
    const r = rescheduleFrom(paced, timeline, 9, 48, 60, CTX)
    expect(r.exams[0]!.end).toBe(16)
    expect(r.endWeek).toBe(19)
  })
  it('전력으로(주 16): 32주차 = 14주 늦음, 계획 끝 35주차', () => {
    const r = rescheduleFrom(paced, timeline, 9, 16, 60, CTX)
    expect([r.exams[0]!.end, r.exams[0]!.spare, r.exams[0]!.verdict, r.endWeek]).toEqual([32, -14, 'short', 35])
  })
  it('하루 6시간(주 36): 19주차 = 1주 늦음', () => {
    expect(rescheduleFrom(paced, timeline, 9, 36, 60, CTX).exams[0]!.spare).toBe(-1)
  })
  it('시작 안 한 짧은 시험은 속도를 바꿔도 그 자리(시험 주 안이면)', () => {
    const p2 = [...devPlan(), ...infoEng().map((p) => dated(p, p.id === 'w' ? '2027-05-15' : '2027-07-24'))]
    const pc = pacedProjects(p2, 8)
    const t = buildTimeline(pc, 8, {}, CTX)
    const r = rescheduleFrom(pc, t, 10, 5, 60, CTX)
    const s = startMap(r.timeline)
    expect([s.get('w'), s.get('p')]).toEqual([22, 30])
  })
})

describe('판정 세 칸(데이터 평가 11-22)', () => {
  it('2주 이상 전 = 여유 · 시험 주 안 = 빠듯 · 늦어도 낼 시간이 분량의 80% 이상이면 빠듯 · 아니면 모자람', () => {
    expect(examVerdict(2, 0)).toBe('ahead')
    expect(examVerdict(1, 0)).toBe('tight')
    expect(examVerdict(0, 0)).toBe('tight')
    expect(examVerdict(-1, 480, 576)).toBe('tight')       // 83%
    expect(examVerdict(-1, 400, 576)).toBe('short')       // 69%
    expect(examVerdict(-1, 0)).toBe('short')
  })
})

describe('날짜 사이 확인(정할 것 6)', () => {
  it('실기 날짜가 필기보다 이르거나 같으면 한 줄', () => {
    const ps = infoEng().map((p) => dated(p, p.id === 'w' ? '2027-05-15' : '2027-05-01'))
    expect(examDateWarnings(ps).map((w) => w.kind)).toEqual(['pair'])
    const ok = infoEng().map((p) => dated(p, p.id === 'w' ? '2027-05-15' : '2027-07-24'))
    expect(examDateWarnings(ok)).toEqual([])
  })
  it('한국사 시험이 9급 필기에 너무 가까우면 등급 발표 한 줄', () => {
    const near = g9Plan().map((p) => (p.id === 'g9' ? dated(p, '2027-03-27') : p.id === 'kh' ? dated(p, '2027-03-13') : p))
    expect(examDateWarnings(near).map((w) => w.kind)).toEqual(['grade'])
    const far = g9Plan().map((p) => (p.id === 'g9' ? dated(p, '2027-03-27') : p.id === 'kh' ? dated(p, '2027-02-13') : p))
    expect(examDateWarnings(far)).toEqual([])
  })
})

describe('시험 직전으로 옮기기 · 응시 할 일', () => {
  it('한국사(여유 8주)를 옮기면 9~12주차, 9급 필기는 13주차로 밀리고 계획 끝 +8주(전력으로)', () => {
    const plan = g9Plan().map((p) => (p.id === 'kh' ? dated(p, '2027-02-13') : p))
    const paced = pacedProjects(plan, 16)
    const s = startsOf(scheduleWithExams(paced, 16, CTX, { late: new Set(['kh']) }))
    expect([s.get('kh'), s.get('g9')]).toEqual([9, 13])
    expect(schedulePreview(plan, 16, {}, { ...CTX, late: new Set(['kh']) }).endWeek).toBe(171)
  })
  it("마지막 주 '응시'만 뺀다(다른 할 일이 있을 때)", () => {
    const p = mk('x', '한국사능력검정 심화', 5, 60, [[1, '기출 회독']])
    const withItems = { ...p, curriculum: [{ week: 1, title: '기출 회독', items: ['기출 5회', '응시'] }] }
    expect(withoutApplyItem(withItems).curriculum![0]!.items).toEqual(['기출 5회'])
    const only = { ...p, curriculum: [{ week: 1, title: '응시', items: ['응시'] }] }
    expect(withoutApplyItem(only)).toBe(only)
  })
})

// ── 코드 검토(2026-11-22) 반영 ──
describe('짝은 고정할 때도 겹치지 않는다(검토 ① 입력 1·2)', () => {
  const researchFirst = () => [
    know(mk('r', '분야 조사', 2, 60, [[6, '조사']])),
    { ...mk('w', '정보처리기사 필기', 5, 90, [[4, '필기']]), method: 'book' as const },
    { ...mk('p', '정보처리기사 실기', 5, 90, [[6, '실기']]), method: 'book' as const },
  ]
  it('입력 1: 실기만 날짜(2027-01-23 = 9주차) — 필기 1~4주, 실기 5~10주(1주 늦음), 겹치지 않음', () => {
    const plan = researchFirst().map((p) => (p.id === 'p' ? dated(p, '2027-01-23') : p))
    expect(examWeekOf(START, '2027-01-23', '월')).toBe(9)
    const r = schedulePreview(plan, 8, {}, CTX)
    expect([r.starts.get('w'), r.starts.get('p')]).toEqual([1, 5])
    expect([r.exams[0]!.end, r.exams[0]!.spare]).toEqual([10, -1])
    expect(r.exams[0]!.verdict).toBe('short')
  })
  it('입력 2: 필기 2027-05-15 · 실기 2027-06-05 — 겹치지 않게 놓고 간격 경고', () => {
    const plan = [...devPlan(), ...infoEng().map((p) => dated(p, p.id === 'w' ? '2027-05-15' : '2027-06-05'))]
    const r = schedulePreview(plan, 8, {}, CTX)
    expect([r.starts.get('w'), r.starts.get('p')]).toEqual([22, 26])
    expect(r.starts.get('p')!).toBeGreaterThan(r.starts.get('w')! + 3)
    expect(examDateWarnings(plan, r.starts, CTX).map((w) => [w.kind, w.text.weeks])).toEqual([['gap', 6]])
    // 날짜가 뒤집힌 것은 'pair'로 따로
    const rev = [...devPlan(), ...infoEng().map((p) => dated(p, p.id === 'w' ? '2027-06-05' : '2027-05-15'))]
    expect(examDateWarnings(rev, undefined, CTX).map((w) => w.kind)).toEqual(['pair'])
  })
  it('두 벌이 같은 답(입력 1·2)', () => {
    for (const plan of [researchFirst().map((p) => (p.id === 'p' ? dated(p, '2027-01-23') : p)), [...devPlan(), ...infoEng().map((p) => dated(p, p.id === 'w' ? '2027-05-15' : '2027-06-05'))]]) {
      const a = startsOf(scheduleWithExams(plan, 8, CTX))
      const b = startMap(rescheduleFrom(plan, [], 1, 8, 60, CTX).timeline)
      expect([...b].sort()).toEqual([...a].sort())
    }
  })
})

describe('짝이 있는 계획 — 시험일이 없으면 옛 코드(830ff33)와 같고, 짝 순서만 의도대로 바뀐다', () => {
  const plan = () => [...devPlan(), ...infoEng()]
  // 옛 코드 값(정보처리기사 필기 w · 실기 p 포함)
  const OLD: Record<number, [string, number][]> = {
    5: [['a', 1], ['b', 3], ['c', 9], ['d', 17], ['e', 19], ['f', 22], ['g', 26], ['h', 34], ['i', 38], ['j', 42], ['k', 50], ['l', 58], ['m', 70], ['n', 73], ['o', 76], ['w', 80], ['p', 84]],
    8: [['a', 1], ['b', 3], ['c', 9], ['d', 17], ['e', 17], ['f', 20], ['g', 24], ['h', 32], ['i', 36], ['j', 40], ['k', 48], ['l', 56], ['m', 68], ['n', 71], ['o', 74], ['w', 78], ['p', 82]],
    12: [['a', 1], ['b', 1], ['c', 7], ['d', 7], ['e', 9], ['f', 12], ['g', 16], ['h', 24], ['i', 24], ['j', 28], ['k', 36], ['l', 44], ['m', 44], ['n', 47], ['o', 56], ['w', 60], ['p', 64]],
    16: [['a', 1], ['b', 1], ['c', 1], ['d', 7], ['e', 7], ['f', 9], ['g', 10], ['h', 13], ['i', 17], ['j', 18], ['k', 26], ['l', 34], ['m', 34], ['n', 37], ['o', 40], ['w', 44], ['p', 46]],
    24: [['a', 1], ['b', 1], ['c', 1], ['d', 1], ['e', 1], ['f', 3], ['g', 7], ['h', 7], ['i', 9], ['j', 13], ['k', 15], ['l', 21], ['m', 21], ['n', 23], ['o', 23], ['w', 26], ['p', 27]],
  }
  // 의도된 변화: 실기는 필기가 끝난 다음 주부터(옛 코드는 필기와 겹쳤다)
  const INTENDED: Record<number, Record<string, number>> = { 16: { p: 48 }, 24: { p: 30 } }
  for (const [h, old] of Object.entries(OLD)) {
    it(`주 ${h}시간`, () => {
      const want = old.map(([id, w]) => [id, INTENDED[+h]?.[id] ?? w])
      expect(order(scheduleWithExams(plan(), +h, CTX))).toEqual(want)
    })
  }
  it('공인중개사 1차(괄호) → 2차도 짝 — 주 24시간에서 옛 코드는 1주차에 함께, 지금은 1차가 끝난 21주차', () => {
    const re = [mk('r1', '공인중개사 1차(부동산학개론·민법)', 5, 120, [[20, '1차']]), mk('r2', '공인중개사 2차(공법·세법·중개사법)', 5, 120, [[24, '2차']])]
    expect([...examPairs(re)]).toEqual([['r2', 'r1']])
    expect(order(scheduleWithExams(re, 24))).toEqual([['r1', 1], ['r2', 21]])
    expect(order(scheduleWithExams(re, 8))).toEqual([['r1', 1], ['r2', 21]])   // 옛 코드와 같음
  })
  it('짝 이름 규칙 — 학과시험 → 실기시험, 이론시험 → 실기, 필기 → 실기·구술·면접, 1차 시험 → 2차 시험', () => {
    const names: [string, string][] = [
      ['항공정비사 학과시험', '항공정비사 실기시험'], ['무대예술전문인 이론시험', '무대예술전문인 실기'],
      ['생활스포츠지도사 2급 필기', '생활스포츠지도사 2급 실기·구술'], ['청소년상담사 필기', '청소년상담사 면접'],
      ['감정평가사 1차 시험', '감정평가사 2차 시험'], ['철도차량 운전면허 필기', '철도차량 운전면허 기능시험'],
      ['학회 상담심리사 필기', '학회 상담심리사 심사·면접'],
    ]
    for (const [a, b] of names) expect(examPairs([{ id: 'a', name: a }, { id: 'b', name: b }]).get('b')).toBe('a')
    expect(examPairs([{ id: 'a', name: '기사 필기' }, { id: 'b', name: '산업기사 실기' }]).size).toBe(0)
  })
})

describe('주간결산 — 진행 중 걸음·고정 걸음·응시 나이가 섞일 때', () => {
  const plan = () => [...devPlan(), ...infoEng().map((p) => dated(p, p.id === 'w' ? '2027-05-15' : '2027-07-24'))]
  it('이미 시작한 걸음은 그대로, 시험 걸음은 그 자리, 짝은 겹치지 않는다(주 8 → 주 16, 12주차부터)', () => {
    const pc = pacedProjects(plan(), 8)
    const t = buildTimeline(pc, 8, {}, CTX)
    const before = startMap(t)
    const r = rescheduleFrom(pc, t, 12, 16, 60, CTX)
    const s = startMap(r.timeline)
    for (const [id, w] of before) if (w < 12) expect(s.get(id)).toBe(w)
    expect([s.get('w'), s.get('p')]).toEqual([22, 30])
    expect(s.get('p')!).toBeGreaterThanOrEqual(s.get('w')! + 4)
  })
  it('응시 나이(minStart)를 주간결산에서도 지킨다 — 시작 안 한 9급은 그 자리보다 앞으로 가지 않는다', () => {
    const pc = pacedProjects(g9Plan(), 16)
    const t = buildTimeline(pc, 16, {}, CTX)
    const minStart = (p: Project) => (p.id === 'g9' ? 40 : 0)   // 9급은 41주차부터
    const r = rescheduleFrom(pc, t.filter((sl) => sl.week < 2), 2, 24, 60, { ...CTX, minStart })
    expect(startMap(r.timeline).get('g9')!).toBeGreaterThanOrEqual(41)
    const r0 = rescheduleFrom(pc, t.filter((sl) => sl.week < 2), 2, 24, 60, CTX)
    expect(startMap(r0.timeline).get('g9')!).toBeLessThan(41)
  })
  it('시작 요일이 수요일이어도 두 벌이 같은 답', () => {
    const ctx = { startDate: '2026-11-25', reviewDay: '수' as DayOfWeek }
    for (const h of [8, 16]) {
      const pc = pacedProjects(plan(), h)
      expect([...startMap(rescheduleFrom(pc, [], 1, h, 60, ctx).timeline)].sort()).toEqual([...startsOf(scheduleWithExams(pc, h, ctx))].sort())
    }
  })
  it("'시험 직전으로 옮기기'한 계획을 결산에서 다시 놓아도 그 자리", () => {
    const p2 = g9Plan().map((p) => (p.id === 'kh' ? dated(p, '2027-02-13') : p))
    const pc = pacedProjects(p2, 16)
    const t = buildTimeline(pc, 16, {}, { ...CTX, late: new Set(['kh']) })
    expect(startMap(t).get('kh')).toBe(9)
    const r = rescheduleFrom(pc, t, 2, 24, 60, CTX)
    expect(startMap(r.timeline).get('kh')).toBe(9)
  })
})

describe('시험 뒤 첫 결산(정할 것 9)', () => {
  const at = { startDate: START, reviewDay: '월' as DayOfWeek }
  const g = () => dated(skipDonePhases(g9Plan().find((p) => p.id === 'g9')!, 2), '2027-03-27')   // 12주(실전 모의)
  it("'끝났어요'는 시험일만 지운다(걸음 그대로)", () => {
    const p = g()
    const r = examAfterChange(p, 'done', '', { ...at, startWeek: 5, fromWeek: 19 })!
    expect(r.methodDetail?.deadline).toBeUndefined()
    expect(r.curriculum).toBe(p.curriculum)
  })
  it("'결과를 기다려요'·빈 것은 바뀌는 게 없다", () => {
    expect(examAfterChange(g(), 'wait', '', { ...at, startWeek: 5, fromWeek: 19 })).toBeNull()
    expect(examAfterChange(g(), '', '', { ...at, startWeek: 5, fromWeek: 19 })).toBeNull()
    expect(examAfterChange(g(), 'next', '', { ...at, startWeek: 5, fromWeek: 19 })).toBeNull()
  })
  it("'다음 시험 날짜'(2027-06-19 = 30주차) — 끝난 걸음을 19~30주차로 다시 편다(마지막 단계 반복), 지난 12주는 그대로", () => {
    const p = g()
    expect(examWeekOf(START, '2027-06-19', '월')).toBe(30)
    const r = examAfterChange(p, 'next', '2027-06-19', { ...at, startWeek: 5, fromWeek: 19 })!
    expect(r.methodDetail?.deadline).toBe('2027-06-19')
    expect(r.curriculum!.length).toBe(30 - 5 + 1)                              // 5~30주차
    expect(r.curriculum!.slice(0, 12)).toEqual(p.curriculum!.slice(0, 12))     // 지난 할 일 그대로
    expect(r.curriculum!.slice(12, 14).map((w) => [w.title, w.items.length])).toEqual([['다음 시험 기다림', 0], ['다음 시험 기다림', 0]])   // 17·18주차(지난 주) 빈 주
    expect(r.curriculum!.slice(14).every((w) => w.title.startsWith('실전 모의'))).toBe(true)
    expect(r.curriculum!.map((w) => w.week)).toEqual(Array.from({ length: 26 }, (_, i) => i + 1))
    // 시작 안 한 걸음은 날짜만(다시 놓을 때 닻이 맞춘다)
    const n = examAfterChange(p, 'next', '2027-06-19', { ...at, startWeek: 25, fromWeek: 19 })!
    expect(n.curriculum).toBe(p.curriculum)
  })
  it('할 일을 다 끝낸 걸음은 묻지 않는다', () => {
    const p = mk('x', '한국사능력검정 심화', 5, 60, [[1, '기출']])
    const withItems = { ...p, curriculum: [{ week: 1, title: '기출', items: ['기출 5회', '응시'] }] }
    const entries = (w: { items: string[] }) => w.items
    expect(allItemsDone(withItems, () => true, entries)).toBe(true)
    expect(allItemsDone(withItems, (_id, _w, i) => i === 0, entries)).toBe(false)
    expect(allItemsDone({ ...p, curriculum: [] }, () => true, entries)).toBe(false)
  })
})

describe('그 밖', () => {
  it('시험이 바로 내일이면 공부할 주가 없다고 말한다', () => {
    const plan = g9Plan().map((p) => (p.id === 'kh' ? dated(p, '2026-11-24') : p))
    const x = schedulePreview(plan, 16, {}, CTX).exams[0]!
    expect([x.examWeek, x.usableWeeks, x.verdict]).toEqual([1, 1, 'short'])
    expect(COPY.headWeeks('한국사능력검정 심화', '11월 24일(화)', 0)).toBe('한국사능력검정 심화 11월 24일(화) 시험까지 공부할 주가 없어요.')
    expect(hoursLabel(0)).toBe('0시간')
  })
  it("짧은 시험(분량 없음)에는 '예시 분량'이라는 말을 쓰지 않는다", () => {
    expect(COPY.verdict({ verdict: 'ahead', spare: 8, need: null })).toBe('시험 8주 전에 마쳐요')
    expect(COPY.verdict({ verdict: 'short', spare: -2, need: null })).toBe('시험보다 2주 늦게 끝나요')
    expect(COPY.verdict({ verdict: 'short', spare: -2, need: 576 })).toBe('예시 분량을 마치기엔 시험까지 시간이 모자라요')
  })
  it('시험 날 표시 앞말은 필기·실기를 가른다', () => {
    expect(COPY.pin('5.15(토)', COPY.pinHead('정보처리기사 필기'))).toBe('정보처리기사 필기 시험 5.15(토)')
    expect(COPY.pinHead('9급 필기(국어·영어·행정법총론·행정학개론)')).toBe('9급 필기')
  })
  it("'응시'는 날짜를 지우면 돌아온다", () => {
    const p = { ...mk('x', '한국사능력검정 심화', 5, 60, [[1, '기출']]), curriculum: [{ week: 1, title: '기출', items: ['기출 5회', '응시'] }] }
    const d = dated(p, '2027-02-13')
    const cut = syncApplyItem(d)
    expect(cut.curriculum![0]!.items).toEqual(['기출 5회'])
    expect(p.curriculum[0]!.items).toEqual(['기출 5회', '응시'])                  // 원본은 그대로
    const back = syncApplyItem({ ...cut, methodDetail: {} })
    expect([back.curriculum![0]!.items, back.applyItemBackup]).toEqual([['기출 5회', '응시'], undefined])
  })
  it('시작 요일을 바꾸면 시험 주가 바뀔 수 있다(시작 요일 단계에서 다시 맞추는 까닭)', () => {
    // 2026-11-23(월) 시작, 2027-01-03(일) 시험 → 전날 1.2(토): 월요일 주면 6주차(12.28~1.3), 일요일 주면 5주차(12.27~1.2)
    expect(examWeekOf(START, '2027-01-03', '월')).toBe(6)
    expect(examWeekOf(START, '2027-01-03', '일')).toBe(5)
  })
})

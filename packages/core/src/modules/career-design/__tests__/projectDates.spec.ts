// 날짜로 정한 프로젝트(2026-11-25) — 시안 reviews/2026-11-24-project-dates.html 정할 것 1~6 권장의 규칙을 고정한다.
// 예시 날짜: 공모전 도전 2027-03-02(화) ~ 04-09(금), 계획 시작 2026-11-23(월)
import { describe, expect, it } from 'vitest'
import type { DayOfWeek, Project, TimelineSlot } from '../types/career-design'
import { autoSchedule, projectWeeks, weekDateRange } from '../composables/usePlanTimeline'
import { buildTimeline, rescheduleFrom } from '../composables/usePlanPace'
import { expandPhases } from '../lib/examPace'
import { startsOf } from '../lib/examDate'
import { applyPeriodChange, periodCurriculum } from '../lib/period'
import {
  alignDated, canUseDates, datedFixed, datedFlips, datedRange, datedRangeSlash, fitCurriculumToWeeks, flipGroups, iga, eunNeun, isDateKey,
  isDated, newFlips, outsideDates, projectDatesOf, runsInDates, spanOfDates,
} from '../lib/projectDates'

const START = '2026-11-23'
const CTX = { startDate: START, reviewDay: '월' as DayOfWeek }
const DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일']

function mk(id: string, n: number, perWeekHours: number, extra: Partial<Project> = {}): Project {
  const days: DayOfWeek[] = perWeekHours >= 6 ? ['월', '수', '금'] : ['화']
  const curriculum = expandPhases([{ title: `${id} 할 일`, weeks: n, items: ['한 줄'] }])
  return {
    id, name: id, category: 'knowledge', method: 'book', methodDetail: {}, goal: '', days,
    duration: Math.round((perWeekHours * 60) / days.length), priority: 'normal', notification: false, missedNotification: false,
    notificationTime: '', memo: '', weeks: n, curriculum, ...extra,
  }
}
const contestPhases = () => expandPhases([
  { title: '주제 정하기', weeks: 1, items: ['a', 'b', 'c'] }, { title: '만들기', weeks: 4, items: ['d', 'e', 'f'] }, { title: '내기', weeks: 1, items: ['g', 'h', 'i'] },
])
const contest = (extra: Partial<Project> = {}): Project => ({
  ...mk('contest', 6, 6), name: '공모전 도전', category: 'portfolio', method: 'contest', methodDetail: { title: '공모전' },
  days: ['월', '수', '금'], duration: 120, curriculum: contestPhases(), weeks: 6,
  dateStart: '2027-03-02', dateEnd: '2027-04-09', ...extra,
})

describe('날짜 꼴·열 수 있는 걸음', () => {
  it('달력에 있는 날짜만', () => {
    expect(isDateKey('2027-03-02')).toBe(true)
    expect(isDateKey('2027-02-30')).toBe(false)
    expect(isDateKey('2027-3-2')).toBe(false)
    expect(isDateKey('')).toBe(false)
  })
  it('시험일 칸이 있는 자격 시험 걸음만 뺀다(정할 것 2)', () => {
    expect(canUseDates({ category: 'qualification', method: 'lecture' })).toBe(false)
    expect(canUseDates({ category: 'qualification', method: 'required_course' })).toBe(true)
    expect(canUseDates({ category: 'portfolio', method: 'contest' })).toBe(true)
    expect(isDated({ ...contest(), category: 'qualification', method: 'lecture' })).toBe(false)
    expect(isDated(contest())).toBe(true)
    // 마감이 앞이거나 하나만 있으면 날짜 걸음이 아니다
    expect(projectDatesOf(contest({ dateEnd: '2027-03-01' }))).toBeNull()
    expect(projectDatesOf(contest({ dateEnd: '' }))).toBeNull()
  })
})

describe('날짜 → 걸친 계획 주', () => {
  it('3.2(화)~4.9(금) — 시작 요일 월·화·토·일이면 6주, 수·목·금이면 7주(시안 계산)', () => {
    const got = Object.fromEntries(DAYS.map((d) => [d, spanOfDates('2027-03-02', '2027-04-09', { startDate: START, reviewDay: d })!.weeks]))
    expect(got).toEqual({ 월: 6, 화: 6, 수: 7, 목: 7, 금: 7, 토: 6, 일: 6 })
  })
  it('3.4(목)~3.9(화) 엿새 — 수·목 시작이면 1주, 그 밖은 2주', () => {
    const got = Object.fromEntries(DAYS.map((d) => [d, spanOfDates('2027-03-04', '2027-03-09', { startDate: START, reviewDay: d })!.weeks]))
    expect(got).toEqual({ 월: 2, 화: 2, 수: 1, 목: 1, 금: 2, 토: 2, 일: 2 })
  })
  it('시작 주는 그 날짜가 든 계획 주 — 월요일 시작이면 3.2 는 15주차(3.1~3.7), 4.9 는 20주차', () => {
    const s = spanOfDates('2027-03-02', '2027-04-09', CTX)!
    expect([s.startWeek, s.endWeek, s.clipped]).toEqual([15, 20, false])
    expect(weekDateRange(START, 15, '월')).toEqual({ start: '2027-03-01', end: '2027-03-07' })
  })
  it('계획 시작보다 이른 시작일은 1주차로(clipped), 마감도 계획 시작 전이면 고정하지 않는다', () => {
    const s = spanOfDates('2026-11-20', '2026-12-10', CTX)!
    expect([s.startWeek, s.clipped]).toEqual([1, true])
    // 1주차 11.23~11.29, 2주차 11.30~12.6, 12.10 은 3주차
    expect(s.weeks).toBe(3)
    expect(spanOfDates('2026-11-01', '2026-11-20', CTX)).toBeNull()
  })
  it('하루짜리 기간은 1주', () => {
    expect(spanOfDates('2027-03-03', '2027-03-03', CTX)!.weeks).toBe(1)
  })
})

describe('날짜 안 실행 횟수·날짜 밖 요일', () => {
  it('3.2~4.9 월·수·금 = 17번, 첫 주(3.2 화부터)는 수·금 2번', () => {
    expect(runsInDates(['월', '수', '금'], '2027-03-02', '2027-04-09')).toBe(17)
    expect(runsInDates(['월', '수', '금'], '2027-03-02', '2027-03-07')).toBe(2)
  })
  it('날짜 안에 실행 요일이 없으면 0 — 입력 화면이 막는다', () => {
    expect(runsInDates(['토'], '2027-03-02', '2027-03-05')).toBe(0)
  })
  it('날짜 밖 요일(정할 것 4) — 3.1(월)·4.10(토)은 밖', () => {
    expect(outsideDates(contest(), '2027-03-01')).toBe(true)
    expect(outsideDates(contest(), '2027-03-02')).toBe(false)
    expect(outsideDates(contest(), '2027-04-09')).toBe(false)
    expect(outsideDates(contest(), '2027-04-10')).toBe(true)
    expect(outsideDates(mk('plain', 4, 6), '2027-04-10')).toBe(false)
  })
})

describe('주 수 맞추기(단계 비율)', () => {
  const phaseWeeks = (p: Project) => {
    const out: number[] = []
    let prev = ''
    for (const w of p.curriculum ?? []) { const t = w.title.replace(/ \(\d+\/\d+\)$/, ''); if (t === prev) out[out.length - 1]! += 1; else out.push(1); prev = t }
    return out
  }
  it('공모전 1·4·1주 → 4주면 1·2·1, 7주면 1·5·1(시안)', () => {
    expect(phaseWeeks(fitCurriculumToWeeks(contest(), 4))).toEqual([1, 2, 1])
    expect(phaseWeeks(fitCurriculumToWeeks(contest(), 7))).toEqual([1, 5, 1])
    const seven = fitCurriculumToWeeks(contest(), 7)
    expect([seven.weeks, seven.curriculum!.length]).toEqual([7, 7])
    // 같은 길이면 그대로(같은 객체)
    const p = contest()
    expect(fitCurriculumToWeeks(p, 6)).toBe(p)
  })
  it('직접 쓴 할 일 — 줄이면 잘린 주의 할 일을 남는 마지막 주로, 늘리면 빈 주', () => {
    const own: Project = { ...mk('own', 3, 6), curriculum: [{ week: 1, title: '1주', items: ['a'] }, { week: 2, title: '2주', items: ['b'] }, { week: 3, title: '3주', items: ['c', 'b'] }] }
    const short = fitCurriculumToWeeks(own, 2)
    expect(short.curriculum!.map((w) => w.items)).toEqual([['a'], ['b', 'c']])
    const long = fitCurriculumToWeeks(own, 4)
    expect(long.curriculum!.length).toBe(4)
    expect(long.curriculum![3]!.items).toEqual([])
  })
  it('과정 — 늘리는 단계로 맞추고 쉬는 주는 그대로', () => {
    const cur = periodCurriculum([{ weeks: 1, title: '지원', items: [] }, { weeks: 8, title: '근무', items: ['점검'] }, { weeks: 1, title: '정리', items: [] }])
    cur.splice(3, 0, { week: 0, title: '쉬는 주', items: [], pause: true })
    const intern: Project = { ...mk('intern', 11, 40), period: true, curriculum: cur.map((c, i) => ({ ...c, week: i + 1 })), weeks: 11 }
    const fit = fitCurriculumToWeeks(intern, 13)
    expect(fit.curriculum!.length).toBe(13)
    expect(fit.curriculum!.filter((w) => w.pause).length).toBe(1)
    expect(fit.curriculum!.filter((w) => w.title === '근무').length).toBe(10)
  })
})

describe('배치 — 날짜 걸음은 고정, 주 수 걸음은 둘레에(정할 것 1·3)', () => {
  // A 11주·B 6주(각 주 6시간) 다음 순서에 공모전(15주차 고정, 주 6시간). 예산 8시간이면 B 가 공모전 전에 못 끝나 뒤로 간다
  const plan = () => [mk('A', 11, 6), mk('B', 6, 6), contest(), mk('C', 2, 6)]
  it('꾸준히(주 8시간) — 공모전은 15주차 그대로, B 는 공모전 뒤로(한 줄), 뒤 순서 C 는 B 뒤', () => {
    const projects = plan()
    const pinned = datedFixed(projects, CTX)
    expect(pinned.get('contest')).toBe(15)
    const starts = startsOf(autoSchedule(projects, 8, { fixed: pinned }))
    expect(starts.get('contest')).toBe(15)
    expect(starts.get('A')).toBe(1)
    expect(starts.get('B')).toBe(21)          // 12~14주(3주)엔 6주짜리가 안 들어가고, 15~20주는 공모전과 합쳐 12시간 > 8
    expect(starts.get('C')).toBe(27)          // 순서 유지(B 보다 먼저 시작하지 않음) + 예산(B 와 겹치면 12시간 > 8)
    const flips = datedFlips(projects, starts, CTX)
    expect(flips.map((f) => `${f.moved.id}>${f.dated.id}`)).toEqual(['B>contest'])
    expect(flipGroups(flips)).toEqual([{ dated: projects[2], first: projects[1], more: 0 }])
  })
  it('집중해서(주 12시간) — B 가 A 와 나란히 앞에 들어가 뒤집힘이 없다', () => {
    const projects = plan()
    const starts = startsOf(autoSchedule(projects, 12, { fixed: datedFixed(projects, CTX) }))
    expect(starts.get('B')).toBe(1)
    expect(datedFlips(projects, starts, CTX)).toEqual([])
  })
  it('buildTimeline(새 계획 배치)도 계획 시작일을 넘기면 날짜에 고정한다', () => {
    const tl = buildTimeline(plan(), 8, {}, { startDate: START, reviewDay: '월' })
    expect(startsOf(tl.flatMap((sl) => sl.projects.map((project) => ({ week: sl.week, project })))).get('contest')).toBe(15)
    // 계획 시작일이 없으면(예전 경로) 예전처럼 순서대로
    const plain = buildTimeline(plan(), 8)
    expect(startsOf(plain.flatMap((sl) => sl.projects.map((project) => ({ week: sl.week, project })))).get('contest')).not.toBe(15)
  })
  it('날짜가 없으면 배치는 예전과 같다', () => {
    const projects = [mk('A', 11, 6), mk('B', 6, 6), { ...contest(), dateStart: undefined, dateEnd: undefined }]
    expect(autoSchedule(projects, 8, { fixed: datedFixed(projects, CTX) })).toEqual(autoSchedule(projects, 8))
  })
  it('주 15시간 이상 과정을 날짜로 고정하면 그 기간은 다른 걸음이 건너뛴다(내가 정한 것)', () => {
    const intern: Project = { ...mk('intern', 8, 40), period: true, days: ['월', '화', '수', '목', '금'], duration: 480, dateStart: '2026-12-21', dateEnd: '2027-02-14' }
    // 인턴 5~12주차(12.21~2.14). 앞 순서의 10주 걸음 A 는 1~4주에 다 못 들어가 인턴 뒤로, 3주 걸음은 앞에 들어간다
    const pinned = datedFixed([intern], CTX)
    expect(pinned.get('intern')).toBe(5)
    const long = startsOf(autoSchedule([mk('A', 10, 4), intern], 8, { fixed: pinned }))
    expect(long.get('A')).toBe(13)
    const short = startsOf(autoSchedule([mk('A', 3, 4), intern, mk('B', 2, 4)], 8, { fixed: pinned }))
    expect(short.get('A')).toBe(1)
    expect(short.get('B')).toBe(13)          // 뒤 순서는 과정(문)이 끝난 뒤
    // 가벼운 과정(주 15시간 미만)은 문이 아니라 겹쳐 놓인다
    const light: Project = { ...intern, duration: 120 }
    const s2 = startsOf(autoSchedule([mk('A', 10, 4), light], 16, { fixed: datedFixed([light], CTX) }))
    expect(s2.get('A')).toBe(1)
  })
  it('시험일 닻과 함께 — 둘 다 그 자리', () => {
    const exam: Project = { ...mk('exam', 8, 6), name: '컴퓨터활용능력 1급 필기', category: 'qualification', method: 'lecture', methodDetail: { deadline: '2027-06-05' } }
    const projects = [mk('A', 11, 6), contest(), exam]
    const tl = buildTimeline(projects, 8, {}, { startDate: START, reviewDay: '월' })
    const starts = startsOf(tl.flatMap((sl) => sl.projects.map((project) => ({ week: sl.week, project }))))
    expect(starts.get('contest')).toBe(15)
    // 시험 주 = 6.4(금)가 든 주(6.1~6.6 → 28주차)에 끝나거나 그 전
    expect(starts.get('exam')! + 8 - 1).toBeLessThanOrEqual(28)
  })
})

describe('주간결산 속도 바꾸기 — 아직 시작 안 한 날짜 걸음은 그대로(③)', () => {
  const timelineOf = (projects: Project[], hours: number): TimelineSlot[] => buildTimeline(projects, hours, {}, { startDate: START, reviewDay: '월' })
  const startsOfTl = (tl: TimelineSlot[]) => startsOf(tl.flatMap((sl) => sl.projects.map((project) => ({ week: sl.week, project }))))
  it('집중해서 → 3주차부터 틈틈이: 공모전은 15주차, 앞 걸음이 뒤로 밀린 것만 새로 알린다', () => {
    const projects = [mk('A', 4, 6), mk('B', 8, 6), mk('C', 8, 6), contest()]
    const now = timelineOf(projects, 12)
    const before = datedFlips(projects, startsOfTl(now), CTX)
    expect(before).toEqual([])
    const r = rescheduleFrom(projects, now, 3, 5, 60, { startDate: START, reviewDay: '월' })
    const after = startsOfTl(r.timeline)
    expect(after.get('contest')).toBe(15)
    expect(after.get('A')).toBe(startsOfTl(now).get('A'))     // 이미 시작한 것은 그대로
    const fresh = newFlips(datedFlips(projects, after, CTX), before)
    expect(fresh.length).toBeGreaterThan(0)
    expect(fresh.every((f) => f.dated.id === 'contest')).toBe(true)
  })
  it('이미 시작한 날짜 걸음은 고정 대상이 아니다(원래대로 그대로 둔다)', () => {
    const projects = [contest({ dateStart: '2026-11-24', dateEnd: '2027-01-08' }), mk('B', 4, 6)]
    const now = timelineOf(projects, 8)
    const r = rescheduleFrom(projects, now, 3, 16, 60, { startDate: START, reviewDay: '월' })
    expect(startsOfTl(r.timeline).get('contest')).toBe(1)
  })
})

describe('날짜에 다시 맞추기 — 시작 요일을 고를 때·수정 흐름(내가 정한 것)', () => {
  it('월 → 수: 6주가 7주(단계 1·5·1), 자리는 수요일 주로. 다른 걸음은 그대로', () => {
    const projects = [mk('A', 4, 6), contest()]
    const tl: TimelineSlot[] = [{ week: 1, projects: [projects[0]!] }, { week: 15, projects: [projects[1]!] }]
    const r = alignDated(projects, tl, { startDate: START, reviewDay: '수' })
    expect(r.changed).toBe(true)
    const c = r.projects.find((p) => p.id === 'contest')!
    expect(projectWeeks(c)).toBe(7)
    const s = spanOfDates('2027-03-02', '2027-04-09', { startDate: START, reviewDay: '수' })!
    expect(startsOf(r.timeline.flatMap((sl) => sl.projects.map((project) => ({ week: sl.week, project })))).get('contest')).toBe(s.startWeek)
    expect(r.timeline.find((sl) => sl.week === 1)!.projects.map((p) => p.id)).toEqual(['A'])
  })
  it('배치 안 된 날짜 걸음도 그 자리에, 이미 맞으면 바뀐 것 없음', () => {
    const projects = [contest()]
    const r = alignDated(projects, [], CTX)
    expect(r.timeline).toEqual([{ week: 15, projects: [projects[0]] }])
    const again = alignDated(r.projects, r.timeline, CTX)
    expect(again.changed).toBe(false)
  })
})

describe('과정 일정 바꾸기 — 날짜로 정한 과정은 끝나는 날도 함께', () => {
  const intern = (): Project => ({
    ...mk('intern', 8, 40), period: true, curriculum: periodCurriculum([{ weeks: 8, title: '근무', items: [] }]), weeks: 8,
    dateStart: '2026-12-21', dateEnd: '2027-02-14',
  })
  it('끝나는 주 +2 → 2주 뒤, 잠시 쉬어요 1주 → 1주 뒤, 그만뒀어요 → 그날', () => {
    expect(applyPeriodChange(intern(), { kind: 'end', weeks: 2 }, 3, '2027-01-04').dateEnd).toBe('2027-02-28')
    expect(applyPeriodChange(intern(), { kind: 'end', weeks: -2 }, 3, '2027-01-04').dateEnd).toBe('2027-01-31')
    expect(applyPeriodChange(intern(), { kind: 'pause', weeks: 1 }, 3, '2027-01-04').dateEnd).toBe('2027-02-21')
    expect(applyPeriodChange(intern(), { kind: 'stop' }, 3, '2027-01-04').dateEnd).toBe('2027-01-04')
    expect(applyPeriodChange(intern(), { kind: 'days', days: ['월'] }, 3, '2027-01-04').dateEnd).toBe('2027-02-14')
    // 날짜 없는 과정은 그대로
    const plain = { ...intern(), dateStart: undefined, dateEnd: undefined }
    expect(applyPeriodChange(plain, { kind: 'end', weeks: 2 }, 3, '2027-01-04').dateEnd).toBeUndefined()
  })
  it('바꾼 뒤에도 걸친 주 = 커리큘럼 길이', () => {
    const p = applyPeriodChange(intern(), { kind: 'end', weeks: 3 }, 3, '2027-01-04')
    expect(spanOfDates(p.dateStart!, p.dateEnd!, CTX)!.weeks).toBe(p.curriculum!.length)
  })
})

describe('표시', () => {
  it('막대·로드맵·조사', () => {
    expect(datedRange(contest())).toBe('3.2 ~ 4.9')
    expect(datedRangeSlash(contest())).toBe('3/2~4/9')
    expect(iga('캠페인 기획서 만들기')).toBe('캠페인 기획서 만들기가')
    expect(iga('브랜드 전략 분석')).toBe('브랜드 전략 분석이')
    expect(eunNeun('공모전 도전')).toBe('공모전 도전은')
    expect(eunNeun('현장실습')).toBe('현장실습은')
    expect(iga('\'틈틈이\'')).toBe('\'틈틈이\'가')
  })
})

import { describe, expect, it } from 'vitest'
import {
  applyPeriodChange, isPeriod, periodActiveWeeks, periodCheckWeeks, periodCurriculum, periodWeekInfo, PAUSE_TITLE,
  periodDefaults, phasesFromCurriculum, rebuildPeriodCurriculum,
} from '../lib/period'
import type { Project } from '../types/career-design'

// 라이브러리 실제 단계(보편 cp.parttime · cp.degree-4y · cp.internship)
const PARTTIME = [
  { weeks: 1, title: '찾기', items: ['직무와 가까운 일자리 찾기', '근로 조건 확인', '지원'] },
  { weeks: 12, title: '근무', items: ['업무 흐름 익히기', '현장 용어 정리', '맡은 일 기록'] },
  { weeks: 1, title: '정리', items: ['경력 증명 받기', '배운 점 정리', '이력서에 반영'] },
]
const DEGREE4 = [
  { weeks: 52, title: '1학년 — 기초', items: ['수강 신청과 학사 일정 확인', '교양·전공 기초 과목', '학점 관리'] },
  { weeks: 104, title: '2~3학년 — 전공', items: ['전공 필수 과목', '학과가 정한 실습·실험', '졸업 요건(학점·인증) 점검'] },
  { weeks: 52, title: '4학년 — 졸업 준비', items: ['남은 전공 과목', '졸업 요건 마무리', '면허·임용 시험 일정 확인'] },
]

function project(phases = PARTTIME): Project {
  const curriculum = periodCurriculum(phases)
  return {
    id: 'p1', category: 'experience', name: '직무 관련 아르바이트·계약직', goal: '', days: ['월', '수', '금'], duration: 300,
    priority: 'normal', notification: false, missedNotification: false, notificationTime: '09:00', memo: '',
    period: true, curriculum, weeks: curriculum.length,
  }
}

describe('과정 — 점검 주', () => {
  it('아르바이트(찾기 1·근무 12·정리 1)는 시작 준비 끝·가운데·마무리 세 번', () => {
    const m = periodCheckWeeks(PARTTIME)
    expect([...m.keys()]).toEqual([1, 7, 14])
    expect(m.get(1)).toEqual(PARTTIME[0]!.items)
    expect(m.get(7)).toEqual(PARTTIME[1]!.items)
    expect(m.get(14)).toEqual(PARTTIME[2]!.items)
  })
  it('대학 4년은 26주(학기)마다 — 8번, 그 학기 단계의 할 일', () => {
    const m = periodCheckWeeks(DEGREE4)
    expect([...m.keys()]).toEqual([26, 52, 78, 104, 130, 156, 182, 208])
    expect(m.get(52)).toEqual(DEGREE4[0]!.items)
    expect(m.get(78)).toEqual(DEGREE4[1]!.items)
    expect(m.get(208)).toEqual(DEGREE4[2]!.items)
  })
  it('1주짜리 교육은 그 주 한 번, 6주 실습은 마지막 주만(가운데는 8주 이상일 때)', () => {
    expect([...periodCheckWeeks([{ weeks: 1, title: '수료', items: ['교육 기관 신청'] }]).keys()]).toEqual([1])
    expect([...periodCheckWeeks([{ weeks: 6, title: '실습', items: ['실습 일지'] }]).keys()]).toEqual([6])
  })
  it('같은 주에 겹치면 묻는 것을 합치되 되풀이하지 않는다', () => {
    const m = periodCheckWeeks([{ weeks: 2, title: '준비', items: ['a', 'b'] }, { weeks: 2, title: '실습', items: ['b', 'c'] }])
    expect(m.get(2)).toEqual(['a', 'b'])
    expect(m.get(4)).toEqual(['b', 'c'])
  })
})

describe('과정 — 커리큘럼과 표시', () => {
  it('주마다 단계 제목이 오늘 할 일 이름이고 할 일은 비어 있다. 점검 주에만 checks', () => {
    const cur = periodCurriculum(PARTTIME)
    expect(cur).toHaveLength(14)
    expect(cur.every((w) => w.items.length === 0)).toBe(true)
    expect(cur[0]).toMatchObject({ week: 1, title: '찾기', checks: PARTTIME[0]!.items })
    expect(cur[1]).toEqual({ week: 2, title: '근무', items: [] })
    expect(cur.filter((w) => w.checks).map((w) => w.week)).toEqual([1, 7, 14])
  })
  it("'근무 6/12주' — 같은 이름이 이어진 주를 한 덩어리로", () => {
    const p = project()
    expect(periodWeekInfo(p, 7)).toEqual({ label: '근무', nth: 6, of: 12, pause: false })
    expect(periodWeekInfo(p, 1)).toEqual({ label: '찾기', nth: 1, of: 1, pause: false })
    expect(periodWeekInfo(p, 99)).toBeNull()
    expect(isPeriod(p)).toBe(true)
    expect(isPeriod({})).toBe(false)
  })
})

describe('과정 — 주간결산에서 일정 바꾸기', () => {
  it('잠시 쉬어요 2주: 다음 주부터 쉬는 주 2개, 끝이 2주 늦어지고 근무는 그대로 12주', () => {
    const p = applyPeriodChange(project(), { kind: 'pause', weeks: 2 }, 7, '2026-11-20')
    expect(p.curriculum).toHaveLength(16)
    expect(p.weeks).toBe(16)
    expect(p.curriculum![7]).toMatchObject({ week: 8, title: PAUSE_TITLE, pause: true })
    expect(p.curriculum![8]).toMatchObject({ week: 9, pause: true })
    expect(periodWeekInfo(p, 8)?.pause).toBe(true)
    expect(periodWeekInfo(p, 10)).toEqual({ label: '근무', nth: 7, of: 12, pause: false })   // 쉬는 주는 세지 않는다
    expect(periodActiveWeeks(p)).toBe(14)
    expect(p.curriculum!.filter((w) => w.checks).map((w) => w.week)).toEqual([1, 7, 16])  // 마무리 점검은 새 마지막 주
  })
  it('끝나는 주 +4: 마무리(정리) 앞의 근무가 늘고, 마지막 주 점검은 그대로 맨 끝', () => {
    const p = applyPeriodChange(project(), { kind: 'end', weeks: 4 }, 7, '2026-11-20')
    expect(p.curriculum).toHaveLength(18)
    expect(periodWeekInfo(p, 17)).toEqual({ label: '근무', nth: 16, of: 16, pause: false })
    expect(p.curriculum![17]).toMatchObject({ week: 18, title: '정리', checks: PARTTIME[2]!.items })
  })
  it('끝나는 주 −3: 다음 주 뒤의 근무를 뒤에서부터 지운다. 이번 주까지는 그대로', () => {
    const p = applyPeriodChange(project(), { kind: 'end', weeks: -3 }, 7, '2026-11-20')
    expect(p.curriculum).toHaveLength(11)
    expect(periodWeekInfo(p, 7)).toEqual({ label: '근무', nth: 6, of: 9, pause: false })
    expect(p.curriculum![10]).toMatchObject({ week: 11, title: '정리' })
  })
  it('끝나는 주를 남은 주보다 많이 줄여도 이번 주 앞은 지우지 않는다', () => {
    const p = applyPeriodChange(project(), { kind: 'end', weeks: -30 }, 7, '2026-11-20')
    expect(p.curriculum!.slice(0, 7).map((w) => w.title)).toEqual(['찾기', '근무', '근무', '근무', '근무', '근무', '근무'])
    expect(p.curriculum![p.curriculum!.length - 1]).toMatchObject({ title: '정리' })
  })
  it('마지막 단계 자체가 긴 과정(대학)은 그 단계를 늘린다', () => {
    const p = applyPeriodChange(project(DEGREE4), { kind: 'end', weeks: 26 }, 30, '2026-11-20')
    expect(p.curriculum).toHaveLength(234)
    expect(p.curriculum![p.curriculum!.length - 1]).toMatchObject({ title: '4학년 — 졸업 준비', checks: DEGREE4[2]!.items })
    expect(p.curriculum![207]!.checks).toBeUndefined()
  })
  it('그만뒀어요: 이번 주까지 남기고 그만둔 날을 적는다', () => {
    const p = applyPeriodChange(project(), { kind: 'stop' }, 7, '2026-11-20')
    expect(p.curriculum).toHaveLength(7)
    expect(p.stoppedAt).toBe('2026-11-20')
  })
  it('요일이 바뀌었어요: 기간은 그대로', () => {
    const p = applyPeriodChange(project(), { kind: 'days', days: ['화', '목'] }, 7, '2026-11-20')
    expect(p.days).toEqual(['화', '목'])
    expect(p.curriculum).toHaveLength(14)
  })
  it('원래 프로젝트는 건드리지 않는다', () => {
    const p = project()
    applyPeriodChange(p, { kind: 'pause', weeks: 3 }, 2, '2026-11-20')
    applyPeriodChange(p, { kind: 'end', weeks: -2 }, 2, '2026-11-20')
    expect(p.curriculum).toHaveLength(14)
    expect(p.curriculum![13]!.checks).toEqual(PARTTIME[2]!.items)
  })
})

describe('과정 — 직접 만들고 고치기(등록 화면)', () => {
  it('진행 방식별 기본값 — 아르바이트는 근무, 모르는 방식은 이름만', () => {
    expect(periodDefaults('parttime')).toMatchObject({ label: '근무', startLabel: '지원' })
    expect(periodDefaults('parttime').during.length).toBeGreaterThan(0)
    expect(periodDefaults('book')).toEqual({ label: '참여', during: [], end: [], startLabel: '준비', start: [] })
    // 돌려준 목록을 고쳐도 표가 바뀌지 않는다
    periodDefaults('parttime').during.push('x')
    expect(periodDefaults('parttime').during).not.toContain('x')
  })
  it('기본 점검 문장은 3개 이하·20자 이하', () => {
    for (const m of ['parttime', 'internship', 'field_practice', 'school', 'required_course', 'academy', 'club', 'activity']) {
      const d = periodDefaults(m)
      for (const list of [d.during, d.end, d.start]) {
        expect(list.length).toBeLessThanOrEqual(3)
        for (const s of list) expect(s.length).toBeLessThanOrEqual(20)
      }
    }
  })
  it('커리큘럼 → 단계: 예시 계획의 찾기·근무·정리가 그대로 되살아난다', () => {
    const phases = phasesFromCurriculum(periodCurriculum(PARTTIME))
    expect(phases).toEqual(PARTTIME)
  })
  it('쉬는 주는 단계에서 빠지고, 다시 저장하면 같은 주차에 남는다', () => {
    const paused = applyPeriodChange(project(), { kind: 'pause', weeks: 2 }, 7, '2026-11-20')
    const phases = phasesFromCurriculum(paused.curriculum)
    expect(phases.map((ph) => [ph.title, ph.weeks])).toEqual([['찾기', 1], ['근무', 12], ['정리', 1]])
    phases[1]!.title = '카페 근무'
    const again = rebuildPeriodCurriculum(phases, paused.curriculum)
    expect(again).toHaveLength(16)
    expect(again.filter((w) => w.pause).map((w) => w.week)).toEqual([8, 9])
    expect(again[9]).toMatchObject({ week: 10, title: '카페 근무' })
  })
  it('이름을 비운 단계는 저장하지 않고, 점검의 빈 줄은 버린다', () => {
    const cur = rebuildPeriodCurriculum([{ weeks: 2, title: ' ', items: [] }, { weeks: 3, title: '근무', items: ['기록', ' '] }])
    expect(cur).toHaveLength(3)
    expect(cur[2]).toMatchObject({ title: '근무', checks: ['기록'] })
  })
})

import { describe, it, expect } from 'vitest'
import {
  pullAheadCandidates, moveAheadItem, restOrigin, aheadNote, aheadFromNote, validDateKey, type AheadDay, type AheadItem,
  homePullAhead, aheadFromForSave, parsePending, addPending, pendingStep, AHEAD_PENDING_MAX, type AheadPending,
} from '../lib/pullAhead'
import { parseSessions } from '../lib/focusSession'
import { generateItemsForWeek } from '../composables/useWeeklySchedule'
import type { Project, TimelineSlot, DayOfWeek } from '@/modules/career-design/types/career-design'

const P = (itemId: string): AheadItem => ({ itemType: 'project', itemId })
const R = (itemId: string): AheadItem => ({ itemType: 'routine', itemId })

// 시안 예시 — UX·UI 디자이너. 수요일 시작(한 주 수~화), 오늘 일요일 11/29
const base = {
  todayKey: '2026-11-29',
  todayItems: [] as AheadItem[],
  laterDays: [
    { date: '2026-11-30', items: [P('ux'), P('figma')] },
    { date: '2026-12-01', items: [P('figma')] },
  ] as AheadDay[],
  projectOf: (id: string) => ({ ux: {}, figma: {}, course: { period: true }, stopped: { stoppedAt: '2026-11-20' } } as Record<string, object>)[id],
  isDone: () => false,
  hasUndoneThisWeek: () => true,
}

describe('미리 하기 후보', () => {
  it('프로젝트마다 가장 가까운 요일 하나, 날짜 순', () => {
    expect(pullAheadCandidates(base)).toEqual([
      { projectId: 'ux', date: '2026-11-30' },
      { projectId: 'figma', date: '2026-11-30' },
    ])
  })

  it('3개까지', () => {
    const laterDays = [{ date: '2026-11-30', items: ['a', 'b', 'c', 'd'].map(P) }]
    const out = pullAheadCandidates({ ...base, laterDays, projectOf: () => ({}) })
    expect(out.map((c) => c.projectId)).toEqual(['a', 'b', 'c'])
  })

  it('과정·루틴·그만둔 프로젝트·없는 프로젝트는 빠진다', () => {
    const laterDays = [{ date: '2026-11-30', items: [P('course'), R('routine1'), P('stopped'), P('gone'), P('ux')] }]
    expect(pullAheadCandidates({ ...base, laterDays })).toEqual([{ projectId: 'ux', date: '2026-11-30' }])
  })

  it('이번 주 할 일 목록이 다 찬 프로젝트는 빠진다(결과 기다리는 주 포함)', () => {
    const out = pullAheadCandidates({ ...base, hasUndoneThisWeek: (id) => id !== 'figma' })
    expect(out).toEqual([{ projectId: 'ux', date: '2026-11-30' }])
  })

  it('이미 끝낸 칸은 빠지고, 그 프로젝트의 더 뒤 요일로 넘기지 않는다', () => {
    const out = pullAheadCandidates({ ...base, isDone: (id, date) => id === 'figma' && date === '2026-11-30' })
    expect(out).toEqual([{ projectId: 'ux', date: '2026-11-30' }])
  })

  it('오늘 이미 기록한 프로젝트·뺄 목록(오늘 멈춘 집중)은 빠진다', () => {
    expect(pullAheadCandidates({ ...base, isDone: (id, date) => id === 'ux' && date === '2026-11-29' }).map((c) => c.projectId)).toEqual(['figma'])
    expect(pullAheadCandidates({ ...base, skip: new Set(['figma']) }).map((c) => c.projectId)).toEqual(['ux'])
  })

  it('오늘 일정에 이미 있는 프로젝트(옮겨 온 칸)는 빠지고, 나머지는 계속 나온다 — 원래 쉬는 날', () => {
    const todayItems = [{ ...P('ux'), note: aheadNote('2026-11-30') }]
    expect(restOrigin(todayItems)).toBe(true)
    expect(pullAheadCandidates({ ...base, todayItems })).toEqual([{ projectId: 'figma', date: '2026-11-30' }])
  })

  it('원래 할 일이 있던 날은(다 끝냈어도) 나오지 않는다 — 정할 것 5', () => {
    expect(restOrigin([P('ux')])).toBe(false)
    expect(restOrigin([R('r1')])).toBe(false)
    expect(restOrigin([{ ...P('ux'), note: aheadNote('2026-11-30') }, P('figma')])).toBe(false)
    expect(pullAheadCandidates({ ...base, todayItems: [P('other')] })).toEqual([])
  })

  it('이번 주에 뒤 요일이 없으면(주 마지막 날) 아무것도 없다 — 오늘·지난 날짜는 후보가 아니다', () => {
    expect(pullAheadCandidates({ ...base, laterDays: [] })).toEqual([])
    expect(pullAheadCandidates({ ...base, laterDays: [{ date: '2026-11-29', items: [P('ux')] }, { date: '2026-11-28', items: [P('figma')] }] })).toEqual([])
  })

  // 한 주가 여러 요일에 시작할 때 — 실제 배치(generateItemsForWeek)로 뒤 요일을 만들어 본다
  describe('한 주 시작 요일에 따라', () => {
    const ux: Project = { id: 'ux', name: 'UX 기본', days: ['월', '수', '금'], curriculum: [{ week: 1, items: ['a', 'b', 'c'] }, { week: 2, items: ['a', 'b', 'c'] }] } as unknown as Project
    const timeline: TimelineSlot[] = [{ week: 1, projects: [ux] }, { week: 2, projects: [ux] }] as unknown as TimelineSlot[]
    const later = (startDate: string, reviewDay: DayOfWeek, today: string, weekEnd: string): AheadDay[] => {
      const items = generateItemsForWeek({ startDate, reviewDay, projects: [ux], routines: [] }, timeline, startDate, weekEnd)
      const byDate = new Map<string, AheadItem[]>()
      for (const it of items) if (it.date > today) byDate.set(it.date, [...(byDate.get(it.date) ?? []), it])
      return [...byDate].map(([date, its]) => ({ date, items: its }))
    }
    const run = (laterDays: AheadDay[], todayKey: string) => pullAheadCandidates({ ...base, todayKey, laterDays, projectOf: () => ({}) })

    it('월요일 시작 — 토요일(쉬는 날)에는 같은 주 뒤 요일이 없다', () => {
      // 2026-11-16(월) 시작 → 1주차 11/16~11/22. 오늘 11/21(토)
      expect(run(later('2026-11-16', '월', '2026-11-21', '2026-11-22'), '2026-11-21')).toEqual([])
    })
    it('월요일 시작 — 화요일(쉬는 날)에는 수요일 칸', () => {
      expect(run(later('2026-11-16', '월', '2026-11-17', '2026-11-22'), '2026-11-17')).toEqual([{ projectId: 'ux', date: '2026-11-18' }])
    })
    it('수요일 시작 — 일요일(쉬는 날)에는 다음 월요일 칸(같은 주)', () => {
      // 2026-11-18(수) 시작 → 1주차 11/18~11/24. 오늘 11/22(일)
      expect(run(later('2026-11-18', '수', '2026-11-22', '2026-11-24'), '2026-11-22')).toEqual([{ projectId: 'ux', date: '2026-11-23' }])
    })
  })
})

describe('저장할 때 칸 옮기기', () => {
  const items = [
    { id: '1', itemType: 'project' as const, itemId: 'ux', date: '2026-11-30', curriculumWeek: 2 },
    { id: '2', itemType: 'project' as const, itemId: 'figma', date: '2026-11-30', curriculumWeek: 2 },
    { id: '3', itemType: 'routine' as const, itemId: 'ux', date: '2026-11-30' },
  ]
  it('원래 칸을 오늘로 옮기고 표시를 남긴다(다른 칸은 그대로)', () => {
    const r = moveAheadItem(items, { itemId: 'ux', from: '2026-11-30', to: '2026-11-29', newId: 'n' })
    expect(r.changed).toBe(true)
    expect(r.found).toBe(true)
    expect(r.items[0]).toEqual({ id: '1', itemType: 'project', itemId: 'ux', date: '2026-11-29', curriculumWeek: 2, note: 'ahead:2026-11-30' })
    expect(r.items.slice(1)).toEqual(items.slice(1))
    expect(items[0]!.date).toBe('2026-11-30') // 받은 배열은 바꾸지 않는다
  })
  it('칸을 못 찾으면(일정이 다시 만들어짐) 오늘 칸을 하나 더한다', () => {
    const r = moveAheadItem(items, { itemId: 'ux', from: '2026-12-02', to: '2026-11-29', newId: 'n' })
    expect(r).toMatchObject({ changed: true, found: false })
    expect(r.items).toHaveLength(4)
    expect(r.items[3]).toEqual({ id: 'n', itemType: 'project', itemId: 'ux', date: '2026-11-29', curriculumWeek: null, note: 'ahead:2026-12-02' })
  })
  it('오늘에 이미 그 프로젝트 칸이 있으면 그대로', () => {
    const r = moveAheadItem([...items, { id: '4', itemType: 'project' as const, itemId: 'ux', date: '2026-11-29', curriculumWeek: 2 }], { itemId: 'ux', from: '2026-11-30', to: '2026-11-29', newId: 'n' })
    expect(r.changed).toBe(false)
  })
})

describe('표시·주소 값', () => {
  it('옮긴 칸 표시를 읽는다', () => {
    expect(aheadFromNote(aheadNote('2026-11-30'))).toBe('2026-11-30')
    expect(aheadFromNote('')).toBeNull()
    expect(aheadFromNote('ahead:nope')).toBeNull()
    expect(aheadFromNote(undefined)).toBeNull()
  })
  it('날짜 꼴만 받는다', () => {
    expect(validDateKey('2026-11-30')).toBe('2026-11-30')
    expect(validDateKey(['2026-11-30'])).toBeNull()
    expect(validDateKey('11/30')).toBeNull()
  })
  it('멈춘 집중을 이어 할 때 from 이 기기 저장본에 남는다(날짜 꼴이 아니면 버린다)', () => {
    const s = { v: 1, planId: 'p', date: '2026-11-29', itemType: 'project', itemId: 'ux', itemName: 'UX 기본', goalMin: 25, accSec: 30, state: 'paused', segStart: null, reached: false, keepAwake: true, notify: true, updatedAt: 1 }
    const map = parseSessions(JSON.stringify({ a: { ...s, from: '2026-11-30' }, b: { ...s, itemId: 'figma', from: 'x' } }))
    const byId = Object.fromEntries(Object.values(map).map((x) => [x.itemId, x]))
    expect(byId.ux!.from).toBe('2026-11-30')
    expect(byId.figma!.from).toBeUndefined()
  })
})

// ── 홈 연결(usePlanBoard.pullAhead → homePullAhead) ──
describe('홈 연결', () => {
  const dt = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(y!, m! - 1, d!) }
  const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  // 수~화 주(11/25~12/1). 월 11/30: ux·figma, 화 12/1: figma, 다음 주 수 12/2: ux
  const cells: Record<string, AheadItem[]> = { '2026-11-30': [P('ux'), P('figma')], '2026-12-01': [P('figma')], '2026-12-02': [P('ux')] }
  const home = (over: Partial<Parameters<typeof homePullAhead>[0]> = {}) => homePullAhead({
    running: true, today: dt('2026-11-29'), todayKey: '2026-11-29', weekEnd: '2026-12-01',
    itemsOn: (d) => cells[key(d)] ?? [], sessions: [], projectOf: () => ({}), isDone: () => false, hasUndoneThisWeek: () => true,
    ...over,
  })
  it('진행 중인 계획에서만(시작 전·끝난 뒤는 없다)', () => {
    expect(home()).toHaveLength(2)
    expect(home({ running: false })).toEqual([])
    expect(home({ weekEnd: null })).toEqual([])
  })
  it('이번 주 마지막 날까지만 — 다음 주 칸은 후보가 아니다', () => {
    expect(home({ weekEnd: '2026-11-29' })).toEqual([])
    expect(home({ hasUndoneThisWeek: (id) => id === 'ux', isDone: (id, d) => id === 'ux' && d === '2026-11-30' })).toEqual([])
  })
  it('오늘 멈춘 집중이 있는 프로젝트만 뺀다(다른 날 것은 상관없다)', () => {
    expect(home({ sessions: [{ date: '2026-11-29', itemId: 'ux' }] }).map((c) => c.projectId)).toEqual(['figma'])
    expect(home({ sessions: [{ date: '2026-11-28', itemId: 'ux' }] }).map((c) => c.projectId)).toEqual(['ux', 'figma'])
  })
  it('의도된 동작: 미리 해서 칸을 비운 다음 날도 쉬어 가는 날이면 미리 하기가 이어서 나온다(2026-11-23 총괄)', () => {
    // 일요일에 월요일 ux·figma 를 모두 미리 했다 → 월요일 칸이 비었다. 월요일에는 화요일 figma 가 후보로 나온다
    const moved: Record<string, AheadItem[]> = { '2026-11-29': [{ ...P('ux'), note: aheadNote('2026-11-30') }, { ...P('figma'), note: aheadNote('2026-11-30') }], '2026-12-01': [P('figma')] }
    const out = home({ today: dt('2026-11-30'), todayKey: '2026-11-30', itemsOn: (d) => moved[key(d)] ?? [] })
    expect(out).toEqual([{ projectId: 'figma', date: '2026-12-01' }])
  })
})

// ── 저장할 때(CompletePage.save → aheadFromForSave) ──
describe('저장할 때 옮길 날짜', () => {
  const at = (over: Partial<Parameters<typeof aheadFromForSave>[0]> = {}) => aheadFromForSave({
    queryFrom: '2026-11-30', sessionFrom: null, to: '2026-11-29', weekStart: '2026-11-25', weekEnd: '2026-12-01', doneOnFrom: () => false, ...over,
  })
  it('같은 주의 뒤 날짜만', () => {
    expect(at()).toBe('2026-11-30')
    expect(at({ queryFrom: '2026-12-02' })).toBeNull()    // 다음 주
    expect(at({ queryFrom: '2026-11-28' })).toBeNull()    // 앞 날짜
    expect(at({ queryFrom: '2026-11-29' })).toBeNull()    // 같은 날
    expect(at({ queryFrom: '2027-01-01' })).toBeNull()
    expect(at({ queryFrom: 'x' })).toBeNull()
  })
  it('주소에 없으면 멈춘 집중의 from(지우기 전에 읽은 값)', () => {
    expect(at({ queryFrom: undefined, sessionFrom: '2026-12-01' })).toBe('2026-12-01')
    expect(at({ queryFrom: undefined, sessionFrom: undefined })).toBeNull()
  })
  it('그 요일에 이미 끝냈으면 옮기지 않는다(그 칸이 기록 없이 뜬다)', () => {
    expect(at({ doneOnFrom: (d) => d === '2026-11-30' })).toBeNull()
  })
})

// ── 옮기기 실패분(기기) ──
describe('옮기기 실패분', () => {
  const e: AheadPending = { planId: 'p', weekStart: '2026-11-25', weekEnd: '2026-12-01', itemId: 'ux', from: '2026-11-30', to: '2026-11-29' }
  it('모양이 어긋난 것은 버린다', () => {
    expect(parsePending(JSON.stringify([e, { ...e, from: 'x' }, { ...e, planId: '' }, null]))).toEqual([e])
    expect(parsePending('nope')).toEqual([])
    expect(parsePending(null)).toEqual([])
  })
  it('같은 계획·프로젝트·날짜는 하나만, 끝없이 쌓이지 않는다', () => {
    expect(addPending([e], { ...e, from: '2026-12-01' })).toEqual([{ ...e, from: '2026-12-01' }])
    let list: AheadPending[] = []
    for (let i = 0; i < 30; i++) list = addPending(list, { ...e, itemId: `p${i}` })
    expect(list).toHaveLength(AHEAD_PENDING_MAX)
    expect(list[0]!.itemId).toBe('p10')
  })
  it('주가 지났거나·이미 옮겨졌거나·원래 요일에 끝냈으면 버린다', () => {
    const base = { todayKey: '2026-11-29', items: [] as AheadItem[], doneOnFrom: false }
    expect(pendingStep(e, base)).toBe('move')
    expect(pendingStep(e, { ...base, todayKey: '2026-12-02' })).toBe('drop')
    expect(pendingStep(e, { ...base, items: [{ ...P('ux'), date: '2026-11-29' }] })).toBe('drop')
    expect(pendingStep(e, { ...base, doneOnFrom: true })).toBe('drop')
  })
})

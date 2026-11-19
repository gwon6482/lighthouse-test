import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  FOCUS_SESSIONS_KEY, sessionKey, keyOf, elapsedOf, pauseAt, resumeAt, settleForHome, shiftDayKey, isAlive,
  pruneSessions, elapsedText, subjectJosa, pausedEyebrow, parseSessions, type FocusSession, type FocusSessionMap,
} from '../lib/focusSession'

const T0 = new Date(2026, 10, 18, 21, 0, 0).getTime() // 11/18 21:00
const MIN = 60_000

function make(over: Partial<FocusSession> = {}): FocusSession {
  return {
    v: 1, planId: 'plan-a', date: '2026-11-18', itemType: 'project', itemId: 'p1', itemName: '컴퓨터활용능력 2급 필기',
    itemCategory: 'qualification', goalMin: 60, accSec: 0, state: 'running', segStart: T0,
    reached: false, keepAwake: true, notify: true, updatedAt: T0, ...over,
  }
}

describe('focusSession — 시간', () => {
  it('흐르는 중이면 쌓인 초 + 지금 구간, 멈춤이면 쌓인 초 그대로', () => {
    expect(elapsedOf(make({ accSec: 100 }), T0 + 30_000)).toBe(130)
    expect(elapsedOf(make({ accSec: 100, state: 'paused', segStart: null }), T0 + 10 * MIN)).toBe(100)
  })

  it('기기 시계를 뒤로 돌려 시작 시각이 미래여도 0 아래로 가지 않는다', () => {
    expect(elapsedOf(make({ accSec: 50, segStart: T0 + 5 * MIN }), T0)).toBe(50)
    expect(pauseAt(make({ accSec: 0, segStart: T0 + MIN }), T0).accSec).toBe(0)
  })

  it('멈춤 → 이어 하기 → 멈춤을 거쳐도 쌓인 초가 맞고, 멈춘 동안은 늘지 않는다', () => {
    let s = make()
    s = pauseAt(s, T0 + 23 * MIN + 40_000)            // 23분 40초 집중
    expect(s).toMatchObject({ state: 'paused', accSec: 23 * 60 + 40, segStart: null })
    expect(elapsedOf(s, T0 + 5 * 60 * MIN)).toBe(23 * 60 + 40) // 다섯 시간 뒤에도 그대로
    s = resumeAt(s, T0 + 60 * MIN)                      // 한 시간 뒤 이어 하기
    expect(s).toMatchObject({ state: 'running', segStart: T0 + 60 * MIN })
    s = pauseAt(s, T0 + 70 * MIN)                       // 10분 더
    expect(s.accSec).toBe(33 * 60 + 40)
    expect(pauseAt(s, T0 + 99 * MIN)).toBe(s)           // 이미 멈춤이면 그대로
    expect(resumeAt(resumeAt(s, T0 + 80 * MIN), T0 + 90 * MIN).segStart).toBe(T0 + 80 * MIN)
  })

  it('홈에서 다시 볼 때 — 흐르던 것은 꺼진 동안까지 세고 멈춤으로, 멈춘 것은 그대로', () => {
    const settled = settleForHome(make({ accSec: 60 }), T0 + 2 * 60 * MIN) // 앱이 두 시간 꺼져 있었다
    expect(settled).toMatchObject({ state: 'paused', accSec: 60 + 2 * 3600, segStart: null })
    const paused = make({ state: 'paused', segStart: null, accSec: 10 })
    expect(settleForHome(paused, T0 + MIN)).toBe(paused)
  })
})

describe('focusSession — 날짜', () => {
  it('하루씩 옮기기 — 달·해 넘김', () => {
    expect(shiftDayKey('2026-11-19', -1)).toBe('2026-11-18')
    expect(shiftDayKey('2026-12-01', -1)).toBe('2026-11-30')
    expect(shiftDayKey('2027-01-01', -1)).toBe('2026-12-31')
    expect(shiftDayKey('2028-03-01', -1)).toBe('2028-02-29')
    expect(shiftDayKey('2026-12-31', 1)).toBe('2027-01-01')
  })

  it('오늘·어제는 남고 그제는 지운다(해가 바뀌는 날 포함)', () => {
    expect(isAlive({ date: '2026-11-19' }, '2026-11-19')).toBe(true)
    expect(isAlive({ date: '2026-11-18' }, '2026-11-19')).toBe(true)
    expect(isAlive({ date: '2026-11-17' }, '2026-11-19')).toBe(false)
    expect(isAlive({ date: '2026-12-31' }, '2027-01-01')).toBe(true)
    expect(isAlive({ date: '2026-12-30' }, '2027-01-01')).toBe(false)
  })

  it('홈의 작은 글자 — 오늘은 잠시 멈춤, 어제는 날짜와 요일', () => {
    expect(pausedEyebrow('2026-11-19', '2026-11-19')).toBe('잠시 멈춤')
    expect(pausedEyebrow('2026-11-18', '2026-11-19')).toBe('어제 멈춤 · 11/18 (수)')
    expect(pausedEyebrow('2026-11-20', '2026-11-19')).toBe('잠시 멈춤 · 11/20 (금)')
  })
})

describe('focusSession — 정리', () => {
  const ctx = (over: Partial<Parameters<typeof pruneSessions>[1]> = {}) => ({
    planId: 'plan-a', projectIds: new Set(['p1', 'p2']), isDone: () => false, todayKey: '2026-11-19', ...over,
  })
  const map = (...list: FocusSession[]): FocusSessionMap => Object.fromEntries(list.map((s) => [keyOf(s), s]))

  it('다른 계획 · 계획에서 빠진 프로젝트 · 그 날짜에 완료 · 그제 이전은 지우고 나머지는 남긴다', () => {
    const keep1 = make({ date: '2026-11-19', itemId: 'p1' })
    const keep2 = make({ date: '2026-11-18', itemId: 'p2' })
    const otherPlan = make({ planId: 'plan-b', itemId: 'p1', date: '2026-11-18' })
    const removed = make({ itemId: 'gone', date: '2026-11-19' })
    const doneElsewhere = make({ itemId: 'p2', date: '2026-11-19' })
    const old = make({ itemId: 'p1', date: '2026-11-17' })
    const m = { ...map(keep1, keep2, removed, doneElsewhere, old), x: otherPlan }
    const out = pruneSessions(m, ctx({ isDone: (date, id) => date === '2026-11-19' && id === 'p2' }))
    expect(Object.values(out)).toEqual([keep1, keep2])
  })

  it('계획 번호를 못 적은 것(빈 값)은 계획 번호로 지우지 않는다', () => {
    const s = make({ planId: '', date: '2026-11-19' })
    expect(Object.keys(pruneSessions(map(s), ctx()))).toEqual([keyOf(s)])
  })
})

describe('focusSession — 글', () => {
  it('홈·확인 문장의 시간 — 기록 작성 화면의 옛 표기와 같다', () => {
    expect(elapsedText(0)).toBe('0초')
    expect(elapsedText(59.9)).toBe('59초')
    expect(elapsedText(23 * 60 + 40)).toBe('23분 40초')
    expect(elapsedText(25 * 60)).toBe('25분')
    expect(elapsedText(60 * 60)).toBe('1시간')
    expect(elapsedText(65 * 60 + 30)).toBe('1시간 5분')
  })

  it('이/가 — 받침으로', () => {
    expect('23분 40초' + subjectJosa('23분 40초')).toBe('23분 40초가')
    expect('25분' + subjectJosa('25분')).toBe('25분이')
    expect('1시간' + subjectJosa('1시간')).toBe('1시간이')
  })

  it('열쇠는 기록 열쇠와 같은 꼴(날짜:종류:항목)', () => {
    expect(sessionKey('2026-11-18', 'project', 'p1')).toBe('2026-11-18:project:p1')
    expect(keyOf(make())).toBe('2026-11-18:project:p1')
  })
})

describe('focusSession — 기기 저장본 읽기', () => {
  it('모양이 어긋난 것은 버리고 맞는 것만 열쇠로 다시 묶는다', () => {
    const ok = make({ state: 'paused', segStart: null, accSec: 1420 })
    const raw = JSON.stringify({
      whatever: ok,
      a: { ...ok, v: 2 },
      b: { ...ok, itemType: 'routine' },
      c: { ...ok, date: '11/18' },
      d: { ...ok, state: 'running', segStart: null },
      e: { ...ok, accSec: 'x' },
      f: null,
    })
    expect(parseSessions(raw)).toEqual({ [keyOf(ok)]: ok })
    expect(parseSessions('not json')).toEqual({})
    expect(parseSessions('[1]')).toEqual({})
    expect(parseSessions(null)).toEqual({})
  })
})

describe('useFocusSessions — 기기 저장', () => {
  let store: Record<string, string>
  beforeEach(() => {
    store = {}
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => { store[k] = v },
      removeItem: (k: string) => { delete store[k] },
    })
    vi.resetModules()
  })

  it('적고 · 읽고 · 지우고, 비면 저장 칸도 지운다', async () => {
    const { useFocusSessions } = await import('../composables/useFocusSessions')
    const fs = useFocusSessions()
    const s = make()
    fs.put(keyOf(s), s)
    expect(JSON.parse(store[FOCUS_SESSIONS_KEY]!)).toEqual({ [keyOf(s)]: s })
    expect(fs.get(keyOf(s))).toEqual(s)
    fs.remove(keyOf(s))
    expect(FOCUS_SESSIONS_KEY in store).toBe(false)
  })

  it('앱을 다시 켜면 저장본에서 읽고, 홈에서 흐르던 것을 멈춤으로 바꿔 적는다', async () => {
    const s = make({ accSec: 0, segStart: T0 })
    store[FOCUS_SESSIONS_KEY] = JSON.stringify({ [keyOf(s)]: s })
    const { useFocusSessions } = await import('../composables/useFocusSessions')
    const fs = useFocusSessions()
    fs.settleAll(T0 + 10 * MIN)
    expect(fs.get(keyOf(s))).toMatchObject({ state: 'paused', accSec: 600 })
    expect(JSON.parse(store[FOCUS_SESSIONS_KEY]!)[keyOf(s)].state).toBe('paused')
  })

  it('저장소가 막혀 있어도 화면 안에서는 동작한다', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('blocked') },
      removeItem: () => { throw new Error('blocked') },
    })
    const { useFocusSessions } = await import('../composables/useFocusSessions')
    const fs = useFocusSessions()
    const s = make()
    fs.put(keyOf(s), s)
    expect(fs.get(keyOf(s))).toEqual(s)
    fs.clear()
    expect(fs.get(keyOf(s))).toBeNull()
  })
})

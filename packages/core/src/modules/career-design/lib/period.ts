// 프로젝트 종류 '과정'(2026-11-16, 진로설계 검토 정할 것 1번 — 시안 https://claude.ai/artifact/WAZtXSdzTfociK2j5tzFAn)
//
// 과정 = 정해진 곳에 다니는 기간(학교·실습·근무·수련·법정 교육). 기본인 '진도'와 다른 점:
//   · 주간 할 일이 없다 — 커리큘럼의 주마다 title 이 그 주 '오늘 할 일' 이름(라이브러리 단계 제목: 근무·실습·1학년 — 기초), items 는 빈 목록
//   · 다니는 날 '완료' 한 번(루틴처럼, 집중모드 없음) — 진로달성의 하루 완료 기록(toggleProject)을 그대로 쓴다
//   · 점검은 주간결산 3단계에서 — 점검 주의 checks(라이브러리 단계 할 일)를 묻는다
//   · 속도와 상관없이 기간 그대로 — 자동 배치에서 주당 시간을 세지 않고, 앞뒤 프로젝트 사이의 문이 된다(usePlanTimeline)
//   · 일정이 바뀌면(끝나는 주·잠시 쉬어요·요일·그만뒀어요) 주간결산에서 반영한다 — applyPeriodChange
// 진행률(%)은 커리큘럼 항목 수로 세므로 할 일이 없는 과정은 저절로 빠진다(lib/planBoard overallProgress).
import type { DayOfWeek, Project, WeekCurriculum } from '../types/career-design'

export interface PeriodPhase { weeks: number; title: string; items: string[] }

export const isPeriod = (p?: { period?: boolean } | null): boolean => !!p?.period

export const PAUSE_TITLE = '쉬는 주'
/** 26주(한 학기 남짓) 이하 과정은 가운데 한 번, 더 길면 26주마다 점검 */
export const CHECK_EVERY = 26
const MID_MIN = 8   // 가운데 점검을 둘 만큼 긴 단계(주)
const PREP_MAX = 4  // 첫 단계가 이 이하면 '시작 준비'로 보고 그 끝에 점검

const phaseWeeks = (ph: { weeks: number }) => Math.max(1, Math.trunc(ph.weeks) || 1)

/**
 * 점검 주(과정의 1부터 센 주) → 묻는 것(그 단계 할 일).
 *   ① 첫 단계가 4주 이하인 '시작 준비'면 그 끝  ② 26주 이하 과정은 가장 긴 단계(8주 이상)의 가운데, 더 길면 26주마다  ③ 마지막 주
 *   예) 아르바이트 찾기 1·근무 12·정리 1 → 1·7·14주 / 대학 4년 → 26·52·…·182·208주(학기마다 8번)
 */
export function periodCheckWeeks(phases: PeriodPhase[]): Map<number, string[]> {
  const out = new Map<number, string[]>()
  if (!phases.length) return out
  const starts: number[] = []
  let total = 0
  for (const ph of phases) { starts.push(total + 1); total += phaseWeeks(ph) }
  const add = (w: number, items: string[]) => {
    if (!items.length) return
    const prev = out.get(w) ?? []
    out.set(w, [...prev, ...items.filter((x) => !prev.includes(x))])
  }
  const phaseAt = (w: number) => {
    let i = 0
    for (let k = 0; k < starts.length; k += 1) if (starts[k]! <= w) i = k
    return phases[i]!
  }
  const first = phases[0]!
  if (phases.length > 1 && phaseWeeks(first) <= PREP_MAX) add(phaseWeeks(first), first.items)
  if (total <= CHECK_EVERY) {
    let li = 0
    phases.forEach((ph, i) => { if (phaseWeeks(ph) > phaseWeeks(phases[li]!)) li = i })
    const longest = phases[li]!
    if (phaseWeeks(longest) >= MID_MIN) add(starts[li]! + Math.ceil(phaseWeeks(longest) / 2) - 1, longest.items)
  } else {
    for (let w = CHECK_EVERY; w < total; w += CHECK_EVERY) add(w, phaseAt(w).items)
  }
  add(total, phases[phases.length - 1]!.items)
  return new Map([...out.entries()].sort((a, b) => a[0] - b[0]))
}

/** 과정의 단계 → 커리큘럼. 주마다 title = 단계 제목(오늘 할 일 이름), items 없음, 점검 주에만 checks */
export function periodCurriculum(phases: PeriodPhase[]): WeekCurriculum[] {
  const checks = periodCheckWeeks(phases)
  const out: WeekCurriculum[] = []
  for (const ph of phases) {
    for (let k = 0; k < phaseWeeks(ph); k += 1) {
      const week = out.length + 1
      const c = checks.get(week)
      out.push({ week, title: ph.title, items: [], ...(c?.length ? { checks: [...c] } : {}) })
    }
  }
  return out
}

export interface PeriodWeekInfo { label: string; nth: number; of: number; pause: boolean }

/**
 * 과정의 n주째(1부터) 표시 — '근무 6/12주'. 같은 이름이 이어진 주를 한 덩어리로 세고, 쉬는 주는 건너뛴다.
 * 그 주가 없으면 null, 쉬는 주면 pause
 */
export function periodWeekInfo(p: Pick<Project, 'curriculum'>, weekIdx: number): PeriodWeekInfo | null {
  const cur = p.curriculum ?? []
  const w = cur.find((c) => c.week === weekIdx)
  if (!w) return null
  if (w.pause) return { label: PAUSE_TITLE, nth: 0, of: 0, pause: true }
  const real = cur.filter((c) => !c.pause)
  const j = real.indexOf(w)
  let a = j
  let b = j
  while (a > 0 && real[a - 1]!.title === w.title) a -= 1
  while (b < real.length - 1 && real[b + 1]!.title === w.title) b += 1
  return { label: w.title, nth: j - a + 1, of: b - a + 1, pause: false }
}

/** 다니는 주 수(쉬는 주 빼고) */
export const periodActiveWeeks = (p: Pick<Project, 'curriculum'>) => (p.curriculum ?? []).filter((c) => !c.pause).length

// ── 주간결산에서 일정 바꾸기(2026-11-16 사용자: "6개월짜리 과정이어도 중간에 바뀌거나 밀리거나 취소될 수 있다") ──
export type PeriodChange =
  | { kind: 'end'; weeks: number }        // 끝나는 주가 바뀌었어요 — +늘어남 / −줄어듦
  | { kind: 'pause'; weeks: number }      // 잠시 쉬어요(밀렸어요) — 다음 주부터 쉬는 주 수
  | { kind: 'days'; days: DayOfWeek[] }   // 다니는 요일이 바뀌었어요
  | { kind: 'stop' }                      // 그만뒀어요 — 이번 주까지

export const PAUSE_MAX = 52
export const END_MAX = 104

interface Run { title: string; start: number; end: number }  // 커리큘럼 배열의 자리(포함)
function runsOf(cur: WeekCurriculum[]): Run[] {
  const runs: Run[] = []
  cur.forEach((c, i) => {
    if (c.pause) return
    const last = runs[runs.length - 1]
    if (last && last.title === c.title && cur.slice(last.end + 1, i).every((x) => x.pause)) last.end = i
    else runs.push({ title: c.title, start: i, end: i })
  })
  return runs
}
// 늘리고 줄이는 단계 — 마지막 단계가 짧은 마무리(4주 이하이고 앞 단계보다 짧음)면 그 앞 단계, 아니면 마지막 단계
function stretchRun(runs: Run[]): Run | null {
  const last = runs[runs.length - 1]
  const prev = runs[runs.length - 2]
  if (!last) return null
  const len = (r: Run) => r.end - r.start + 1
  return prev && len(last) <= PREP_MAX && len(last) < len(prev) ? prev : last
}
const renumber = (list: WeekCurriculum[]) => list.map((c, i) => ({ ...c, week: i + 1 }))
const copyWeek = (c: WeekCurriculum): WeekCurriculum => ({ ...c, items: [...(c.items ?? [])], ...(c.checks ? { checks: [...c.checks] } : {}) })

/**
 * 바뀐 일정을 프로젝트에 반영한다(새 객체). curIdx = 결산한 주가 그 과정의 몇 주째인지(1부터) — 바뀜은 다음 주부터다.
 *   · end  +n: 늘리는 단계 뒤에 같은 이름의 주를 n개. 마지막 주의 점검은 새 마지막 주로 옮긴다
 *          −n: 다음 주부터의 그 단계 주를 뒤에서부터 지운다(이번 주까지는 지우지 않는다). 지운 주의 점검은 남은 주로 옮긴다
 *   · pause n: 다음 주부터 쉬는 주 n개를 끼운다 — 그만큼 끝이 늦어진다
 *   · days: 요일만 바꾼다(기간 그대로)
 *   · stop: 이번 주까지 남기고 자른다 + 그만둔 날
 */
export function applyPeriodChange(p: Project, change: PeriodChange, curIdx: number, todayKey: string): Project {
  const cur = (p.curriculum ?? []).map(copyWeek)
  const at = Math.max(0, Math.min(cur.length, Math.trunc(curIdx)))
  const done = (list: WeekCurriculum[], extra: Partial<Project> = {}): Project => {
    const curriculum = renumber(list)
    return { ...p, ...extra, curriculum, weeks: curriculum.length }
  }
  switch (change.kind) {
    case 'days':
      return { ...p, days: [...change.days] }
    case 'stop':
      return done(cur.slice(0, Math.max(1, at)), { stoppedAt: todayKey })
    case 'pause': {
      const n = Math.max(1, Math.min(PAUSE_MAX, Math.trunc(change.weeks)))
      const pauses: WeekCurriculum[] = Array.from({ length: n }, () => ({ week: 0, title: PAUSE_TITLE, items: [], pause: true }))
      return done([...cur.slice(0, at), ...pauses, ...cur.slice(at)])
    }
    case 'end': {
      const d = Math.max(-END_MAX, Math.min(END_MAX, Math.trunc(change.weeks)))
      const runs = runsOf(cur)
      const tgt = stretchRun(runs)
      if (!d || !tgt) return p
      const isLast = tgt === runs[runs.length - 1]
      if (d > 0) {
        const add: WeekCurriculum[] = Array.from({ length: d }, () => ({ week: 0, title: tgt.title, items: [] }))
        const list = [...cur.slice(0, tgt.end + 1), ...add, ...cur.slice(tgt.end + 1)]
        if (isLast) {
          const old = list[tgt.end]!
          if (old.checks) { list[list.length - 1] = { ...list[list.length - 1]!, checks: old.checks }; delete old.checks }
        }
        return done(list)
      }
      // 줄이기 — 다음 주(at) 뒤에 있는 그 단계의 주를 뒤에서부터
      let left = -d
      const drop = new Set<number>()
      const carried: string[] = []
      for (let i = tgt.end; i >= Math.max(tgt.start, at) && left > 0; i -= 1) {
        if (cur[i]!.pause) continue
        drop.add(i)
        for (const c of cur[i]!.checks ?? []) if (!carried.includes(c)) carried.push(c)
        left -= 1
      }
      if (!drop.size) return p
      const list = cur.filter((_, i) => !drop.has(i))
      if (carried.length) {
        // 지운 주의 점검 → 그 단계에서 남은 마지막 주(이번 주 뒤), 없으면 맨 끝 주
        const keepIdx = [...cur.keys()].filter((i) => !drop.has(i) && i >= tgt.start && i <= tgt.end && i >= at)
        const target = keepIdx.length ? list.indexOf(cur[keepIdx[keepIdx.length - 1]!]!) : list.length - 1
        const t = list[target]!
        list[target] = { ...t, checks: [...(t.checks ?? []), ...carried.filter((c) => !(t.checks ?? []).includes(c))] }
      }
      return done(list)
    }
  }
}

/** '끝나는 주' 줄이기로 지울 수 있는 주 수 — 다음 주부터의, 늘리고 줄이는 단계의 주(쉬는 주 빼고). 결산 화면의 − 단추 한도 */
export function periodShrinkable(p: Pick<Project, 'curriculum'>, curIdx: number): number {
  const cur = p.curriculum ?? []
  const tgt = stretchRun(runsOf(cur))
  if (!tgt) return 0
  let n = 0
  for (let i = Math.max(tgt.start, Math.trunc(curIdx)); i <= tgt.end; i += 1) if (!cur[i]!.pause) n += 1
  return n
}

/** 바뀐 뒤 과정이 몇 주가 되는지(미리보기 문장용) */
export const periodLength = (p: Pick<Project, 'curriculum' | 'weeks'>) => p.weeks || p.curriculum?.length || 0

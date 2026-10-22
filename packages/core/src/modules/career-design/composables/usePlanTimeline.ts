import type { Project, TimelineSlot } from '../types/career-design'
import { DEFAULT_WEEKS } from './useProjectCurriculum'
import { MONTH_WEEKS, MONTH_WEEKS_START_YEAR, MONTH_WEEKS_END_YEAR } from '../data/month-weeks'

// 진로계획 타임라인의 주차 계산 규칙.
//
// 주는 **월요일~일요일**이고, 그 주는 **월요일이 속한 달**에 귀속된다(2026-08-27 확정).
// → 한 달의 주차 수는 항상 4 또는 5(= 그 달의 월요일 개수). data/month-weeks.ts 테이블 참조.
// → 모든 주가 정확히 7일이라 "프로젝트 n주 = n×7일" 이 배치 위치와 무관하게 보장된다.
//
// 1일이 주 중간이면 그 며칠은 전달 마지막 주에 들어간다.
// 예) 2026-08-01(토)·02(일)은 7월 4주차(7.27~8.2)에 속하고, 8월 1주차는 8.3(월)부터.
//
// 계획의 주차 번호(week)는 **계획 시작일이 속한 주를 1주차로 하는 1-based 인덱스**다.
// 화면에 보이는 "8월 1주차" 라벨은 monthWeekLabel 로 이 인덱스에서 파생한다.
// reviewDay 는 주 경계가 아니라 "그 주의 리뷰를 하는 요일" annotation 이라 계산에 끼지 않는다.
//
// 타임라인은 프로젝트의 **시작 주차만** 저장하고, 점유 구간은 project.weeks 에서 파생한다.
// 점유를 따로 저장하면 프로젝트 기간을 고쳤을 때 둘이 어긋나기 때문.

const MS_PER_DAY = 86_400_000

export function parseDateKey(s: string): Date | null {
  if (!s) return null
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  return new Date(+m[1]!, +m[2]! - 1, +m[3]!)
}

export function toDateKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// 그 날짜가 속한 주(월~일)의 월요일.
export function mondayOf(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const shift = (x.getDay() + 6) % 7      // 월=0 … 일=6
  x.setDate(x.getDate() - shift)
  return x
}

// 그 달의 주차 수(4 또는 5). 테이블 범위 밖이면 즉석 계산으로 떨어진다.
export function weeksInMonth(year: number, month: number): number {
  const row = year >= MONTH_WEEKS_START_YEAR && year <= MONTH_WEEKS_END_YEAR
    ? MONTH_WEEKS[year]
    : undefined
  const c = row?.[month - 1]
  if (c === '4' || c === '5') return Number(c)
  // 테이블 밖(2100년 이후 등) — 그 달의 월요일을 직접 센다.
  const lastDay = new Date(year, month, 0).getDate()
  let n = 0
  for (let d = 1; d <= lastDay; d++) if (new Date(year, month - 1, d).getDay() === 1) n++
  return n
}

// 어떤 주(그 주의 월요일)가 몇 월 몇 주차인지.
// 귀속 달 = 월요일이 속한 달. 그 달의 첫 월요일부터 몇 번째인지가 주차.
export function monthWeekOf(monday: Date): { year: number; month: number; week: number } {
  const year  = monday.getFullYear()
  const month = monday.getMonth() + 1
  let firstMonday = 1
  while (new Date(year, month - 1, firstMonday).getDay() !== 1) firstMonday++
  return { year, month, week: Math.floor((monday.getDate() - firstMonday) / 7) + 1 }
}

// 진로계획 전체 주차 수 = 시작일이 속한 주부터 종료일이 속한 주까지의 달력 주 개수.
// 시작일·종료일이 주 중간이어도 그 주는 통째로 한 주로 센다.
// 기간 미설정이면 0 — 화면은 "기간을 먼저 설정하세요" 로 빠진다.
export function planWeekCount(startDate: string, endDate: string): number {
  const sd = parseDateKey(startDate)
  const ed = parseDateKey(endDate)
  if (!sd || !ed || ed.getTime() < sd.getTime()) return 0
  const first = mondayOf(sd)
  const last  = mondayOf(ed)
  return Math.floor((last.getTime() - first.getTime()) / MS_PER_DAY / 7) + 1
}

// n주차(1-based)의 실제 날짜 범위. 항상 월요일~일요일 7일.
export function weekDateRange(startDate: string, week: number): { start: string; end: string } | null {
  const sd = parseDateKey(startDate)
  if (!sd || week < 1) return null
  const s = mondayOf(sd); s.setDate(s.getDate() + (week - 1) * 7)
  const e = new Date(s);  e.setDate(e.getDate() + 6)
  return { start: toDateKey(s), end: toDateKey(e) }
}

// 어떤 날짜가 계획의 몇 주차인지. 계획 첫 주보다 이전이면 null.
// 시작일이 수요일이면 그 주 월요일도 1주차다(계획 시작 전 이틀이지만 같은 주).
export function weekOfDate(startDate: string, date: Date): number | null {
  const sd = parseDateKey(startDate)
  if (!sd) return null
  const first = mondayOf(sd)
  const cur   = mondayOf(date)
  const diff  = Math.floor((cur.getTime() - first.getTime()) / MS_PER_DAY / 7)
  return diff < 0 ? null : diff + 1
}

// 화면에 보여줄 라벨 — "8월 1주차"
export function monthWeekLabel(startDate: string, week: number): string {
  const r = weekDateRange(startDate, week)
  if (!r) return ''
  const mw = monthWeekOf(parseDateKey(r.start)!)
  return `${mw.month}월 ${mw.week}주차`
}

// "9.1 ~ 9.7" 같은 보조 라벨
export function weekRangeLabel(startDate: string, week: number): string {
  const r = weekDateRange(startDate, week)
  if (!r) return ''
  const fmt = (k: string) => { const d = parseDateKey(k)!; return `${d.getMonth() + 1}.${d.getDate()}` }
  return `${fmt(r.start)} ~ ${fmt(r.end)}`
}

// 프로젝트가 몇 주를 점유하는지. 1단계 기간 스테퍼의 weeks 가 정본이고,
// 서버는 weeks 를 저장하지 않으므로 curriculum 길이로 되살린다.
export function projectWeeks(project: Pick<Project, 'weeks' | 'curriculum'>): number {
  return Math.max(1, project.weeks || project.curriculum?.length || DEFAULT_WEEKS)
}

// 시작주에 배치했을 때 마지막 점유 주차.
export function projectEndWeek(startWeek: number, project: Pick<Project, 'weeks' | 'curriculum'>): number {
  return startWeek + projectWeeks(project) - 1
}

// 그 주차를 시작주로 삼았을 때 계획 기간 안에 다 들어가는가.
// 안 들어가면 배치를 막는다(사용자 결정: 잘라내지 않고 막고 안내).
export function fitsInPlan(
  startWeek: number, project: Pick<Project, 'weeks' | 'curriculum'>, totalWeeks: number,
): boolean {
  return startWeek >= 1 && projectEndWeek(startWeek, project) <= totalWeeks
}

// ⚠️ 타임라인 슬롯은 배치 시점의 프로젝트 **복사본**을 들고 있다.
// localStorage 복원(lh_cd_draft)이나 API 로드를 거치면 계획의 projects 배열과 별개 객체가 되어,
// 배치 후에 기간(weeks)이나 커리큘럼을 고쳐도 슬롯 쪽은 옛 값에 머문다.
// 그래서 슬롯의 프로젝트를 읽을 때는 항상 id 로 원본을 다시 집어온다.
export function resolveProject(p: Project, projects?: Project[]): Project {
  return projects?.find(x => x.id === p.id) ?? p
}

// 특정 주차에 진행 중인 프로젝트들. 시작주 슬롯에서 파생해 구간을 펼친다.
// projects 를 넘기면 슬롯의 복사본 대신 원본을 기준으로 판단한다(권장).
export function projectsActiveInWeek(
  timeline: TimelineSlot[], week: number, projects?: Project[],
): Project[] {
  const out: Project[] = []
  for (const slot of timeline) {
    for (const raw of slot.projects) {
      const p = resolveProject(raw, projects)
      if (slot.week <= week && week <= projectEndWeek(slot.week, p)) out.push(p)
    }
  }
  return out
}

// 특정 날짜에 진행 중인 프로젝트 id 집합. 진로달성이 "오늘 뭐 하지" 를 판단할 때 쓴다.
export function projectIdsActiveOnDate(
  timeline: TimelineSlot[], startDate: string, date: Date, projects?: Project[],
): Set<string> {
  const week = weekOfDate(startDate, date)
  if (week === null) return new Set()
  return new Set(projectsActiveInWeek(timeline, week, projects).map(p => p.id))
}

// 프로젝트가 배치된 시작 주차. 미배치면 null.
export function projectStartWeek(timeline: TimelineSlot[], projectId: string): number | null {
  let best: number | null = null
  for (const slot of timeline) {
    if (!slot.projects.some(p => p.id === projectId)) continue
    if (best === null || slot.week < best) best = slot.week
  }
  return best
}

// 그 날짜가 프로젝트의 커리큘럼 몇 주차인지 (1-based). 배치 전이거나 범위 밖이면 null.
// 주차 모델에서는 계획주차 - 시작주차 + 1 로 바로 떨어진다.
export function projectWeekIndexOn(
  timeline: TimelineSlot[], startDate: string, projectId: string, date: Date,
): number | null {
  const startWeek = projectStartWeek(timeline, projectId)
  if (startWeek === null) return null
  const planWeek = weekOfDate(startDate, date)
  if (planWeek === null || planWeek < startWeek) return null
  return planWeek - startWeek + 1
}

// ── 목표 설정이 맨 끝으로 간 뒤(2026-10-20 사용자: "프로젝트를 배치하지도 않았는데 종료일을 설정하는 게 큰 의미가 없다") ──
// 타임라인 배치 때는 아직 종료일이 없다 → 임시 범위를 보여준다.
//   담은 프로젝트 기간을 모두 이어 붙여도 들어갈 만큼(최소 12주, 최대 104주 = 2년)
export const PROVISIONAL_MIN_WEEKS = 12
export const PROVISIONAL_MAX_WEEKS = 104
export function provisionalWeekCount(projects: Pick<Project, 'weeks' | 'curriculum'>[]): number {
  const sum = projects.reduce((n, p) => n + projectWeeks(p), 0)
  return Math.min(PROVISIONAL_MAX_WEEKS, Math.max(PROVISIONAL_MIN_WEEKS, sum))
}

// 마지막 목표 설정에서 추천하는 종료일 = 배치한 프로젝트 중 가장 늦게 끝나는 주의 일요일. 배치가 없으면 ''
export function suggestedEndDate(startDate: string, timeline: TimelineSlot[], projects?: Project[]): string {
  let last = 0
  for (const slot of timeline) {
    for (const p of slot.projects) last = Math.max(last, projectEndWeek(slot.week, resolveProject(p, projects)))
  }
  return last ? (weekDateRange(startDate, last)?.end ?? '') : ''
}

// ── 자동 배치(B안, 2026-10-22 사용자 선택): "한 주에 몇 시간 쓸 수 있어요?" ──
// 프로젝트의 주당 시간 = 실행 요일 수 × 1회 시간
export function projectHoursPerWeek(p: Pick<Project, 'days' | 'duration'>): number {
  return ((p.days?.length ?? 0) * (p.duration ?? 0)) / 60
}

// 순서대로, 각 주의 시간 합이 예산을 넘지 않는 가장 이른 주에 놓는다. 앞 프로젝트보다 먼저 시작하지는 않는다(순서 유지).
// 한 프로젝트만으로 예산을 넘으면 그 프로젝트는 혼자 있는 주에 놓는다(안 그러면 영원히 못 놓는다).
// 반환: 시작 주차(1부터)
export function autoSchedule(projects: Project[], budgetHours: number): { week: number; project: Project }[] {
  const load: number[] = []
  const out: { week: number; project: Project }[] = []
  let floor = 0
  for (const p of projects) {
    const w = projectWeeks(p)
    const h = projectHoursPerWeek(p)
    let s = floor
    for (;; s++) {
      let ok = true
      for (let k = 0; k < w; k++) {
        const l = load[s + k] ?? 0
        if (l > 0 && l + h > budgetHours) { ok = false; break }
      }
      if (ok) break
    }
    for (let k = 0; k < w; k++) load[s + k] = (load[s + k] ?? 0) + h
    out.push({ week: s + 1, project: p })
    floor = s
  }
  return out
}

// 그 주차가 속한 달(월요일 기준)의 마지막 주차. 타임라인을 '마지막 배치 주가 속한 달 끝까지'만 보여 줄 때 쓴다
export function lastWeekOfMonth(startDate: string, week: number): number {
  const r = weekDateRange(startDate, week)
  if (!r) return week
  const m = monthWeekOf(parseDateKey(r.start)!).month
  let w = week
  for (;;) {
    const next = weekDateRange(startDate, w + 1)
    if (!next || monthWeekOf(parseDateKey(next.start)!).month !== m) return w
    w++
  }
}

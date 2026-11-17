// 진행 속도(한 주에 낼 수 있는 시간) — 타임라인 자동 배치의 기준.
//
// 흐름(2026-10-22 사용자): ① 속도 고르기(생활 모습 카드) + 순서 확인 → ③ 완성된 타임라인을 보고 세부 조정.
//   숫자를 계산하게 하지 않고 "어떤 생활이면 언제 끝나는지"를 보고 고르게 한다.
// ⚠️ 주당 시간 값(5·8·12·16·24)은 데이터 근거 없이 정한 출발값이다(생활 모습 설명에 맞춘 대략치). 사용 데이터로 다듬을 것.
import type { CareerSchool, Project, TimelineSlot } from '../types/career-design'
import { formatWeeks } from '@/modules/encyclopedia/lib/preparation'
import { autoSchedule, countsInBudget, duringOwners, isGatePeriod, parseDateKey, projectEndWeek, projectWeeks, projectHoursPerWeek, weekDateRange, weekOfDate, type ScheduleOptions, type WeekStart } from './usePlanTimeline'
import { EXAM_DAYS, applyExamPace, ceilWeeks, curriculumPhases, examDurationAt, examMates, examMinAge, expandPhases, isExam, resizeExam, scalePhases } from '../lib/examPace'

export interface Pace {
  key: 'light' | 'steady' | 'focus' | 'full' | 'allin'
  icon: string        // 자체 아이콘 이름(public/icons/pace-*.svg)
  title: string
  life: string        // 생활 모습
  hours: number       // 주당 시간(보조 표시)
}

export const PACES: Pace[] = [
  { key: 'light', icon: 'pace-light', title: '틈틈이', life: '평일 저녁 1시간 정도', hours: 5 },
  { key: 'steady', icon: 'pace-steady', title: '꾸준히', life: '매일 1시간, 주말엔 조금 더', hours: 8 },
  { key: 'focus', icon: 'pace-focus', title: '집중해서', life: '하루 2시간 안팎', hours: 12 },
  { key: 'full', icon: 'pace-full', title: '전력으로', life: '하루 2~3시간, 준비에 집중', hours: 16 },
  // 2026-10-22 사용자: 진짜 올인하는 사람(하루 3시간 이상)을 위한 선택지
  { key: 'allin', icon: 'pace-allin', title: '올인', life: '하루 3시간 넘게, 준비가 생활의 중심', hours: 24 },
]
export const DEFAULT_PACE_HOURS = 8

// 기본 속도는 내 진로상황에서(2026-11-17, 정할 것 2·3 시안 화면 4): 학교에 다니면 '집중해서', 졸업 뒤면 '전력으로'.
// 올인은 기본값이 아니다 — 전업은 생활비가 있다는 전제라서다(합격자 68.6%가 부모 지원). 모르면 null(지금처럼 '꾸준히')
export function paceFromSituation(school?: CareerSchool | null): Pace['key'] | null {
  if (school === 'high' || school === 'college' || school === 'grad_school') return 'focus'
  if (school === 'hs_grad' || school === 'college_grad' || school === 'grad_done') return 'full'
  return null
}

// 올인은 하루 시간을 직접 고른다(2026-10-22 사용자). 주 시간 = 하루 × 6(하루는 쉰다고 본다). 동시 진행 상한은 두지 않음(사용자 결정)
export const ALLIN_DAYS_PER_WEEK = 6
export const ALLIN_DAILY = { min: 3, max: 10, default: 4 }
export const allinWeeklyHours = (daily: number) => daily * ALLIN_DAYS_PER_WEEK

export const paceByKey = (key?: string) => PACES.find((p) => p.key === key)
// 예전 임시 계획처럼 속도 키 없이 시간만 있는 경우: 정해진 값이면 그 카드, 아니면(올인 하루 시간 조절값) 올인
export const paceOfHours = (h?: number) => (h == null ? undefined : PACES.find((p) => p.hours === h) ?? paceByKey('allin'))

/**
 * 고른 속도로 계획을 맞춘다(2026-11-17) — 큰 시험은 '분량 ÷ 주당 시간'으로 기간을 다시 잡는다(lib/examPace.ts).
 * 속도 고르기 카드·'이 속도로 배치하기'·완료 화면이 같은 결과를 쓰도록 배치 전에 늘 이것을 거친다. 시험이 없으면 그대로다
 */
export const pacedProjects = (projects: Project[], hours: number): Project[] => applyExamPace(projects, hours)

/** 자동 배치 결과를 타임라인 슬롯으로 — projects 는 pacedProjects 를 거친 것이어야 한다(슬롯이 그 복사본을 든다) */
export function buildTimeline(projects: Project[], hours: number, opts?: ScheduleOptions): TimelineSlot[] {
  const slots: TimelineSlot[] = []
  for (const { week, project } of autoSchedule(projects, hours, opts)) {
    let slot = slots.find((s) => s.week === week)
    if (!slot) { slot = { week, projects: [] }; slots.push(slot) }
    slot.projects.push(project)
  }
  return slots.sort((a, b) => a.week - b.week)
}

/** 그 속도로 배치하면 몇 주차에 끝나는가(시험은 그 속도로 다시 잡은 기간) */
export function scheduleEndWeek(projects: Project[], hours: number, opts?: ScheduleOptions): number {
  const paced = pacedProjects(projects, hours)
  return autoSchedule(paced, hours, opts).reduce((m, { week, project }) => Math.max(m, projectEndWeek(week, project)), 0)
}

/**
 * 응시 나이 규칙(2026-11-17, 검토 C6) — 시험 걸음이 응시할 수 있는 해(어림한 출생 연도 + 응시 나이)의 첫 주보다 먼저 끝나지 않게
 * 시작 자리(0부터)를 정한다. 나이를 모르면 규칙 없음. 나이는 가입 때 받은 나이로 출생 연도를 어림한다
 */
export function examAgeOptions(startKey: string, age: number | null | undefined, reviewDay?: WeekStart): ScheduleOptions {
  const start = parseDateKey(startKey)
  if (!age || !start) return {}
  const birthYear = start.getFullYear() - age
  return {
    minStart: (p) => {
      const min = examMinAge(p)
      const year = birthYear + min
      if (!min || year <= start.getFullYear()) return 0
      const firstWeek = weekOfDate(startKey, new Date(year, 0, 1), reviewDay) ?? 0
      return Math.max(0, firstWeek - projectWeeks(p))   // 시험 걸음의 끝 주가 그 해 첫 주 이후가 되게
    },
  }
}

/** 나이 규칙 때문에 이 속도에서 시험 시작이 실제로 뒤로 밀렸는가 — 밀렸을 때만 속도 고르기 사실 상자에 한 줄(총괄 11-17) */
export function examAgeDelayed(projects: Project[], hours: number, opts: ScheduleOptions): boolean {
  if (!opts.minStart) return false
  const paced = pacedProjects(projects, hours)
  const startOf = (placed: { week: number; project: Project }[]) => new Map(placed.map(({ week, project }) => [project.id, week]))
  const natural = startOf(autoSchedule(paced, hours))
  const aged = startOf(autoSchedule(paced, hours, opts))
  return paced.some((p) => isExam(p) && (aged.get(p.id) ?? 0) > (natural.get(p.id) ?? 0))
}

/** "2027년 6월" — 시작일 기준 그 주차의 마지막 날이 속한 달 */
export function monthLabelOfWeek(startDate: string, week: number, start?: WeekStart): string {
  const end = weekDateRange(startDate, week, start)?.end
  if (!end) return ''
  const [y, m] = end.split('-')
  return `${y}년 ${Number(m)}월`
}

/** "약 13개월" */
// 2년이 넘으면 '약 5년 2개월'로 — 진로백과 준비과정 탭·템플릿 카드와 같은 꼴로 적는다(2026-11-16. 그전에는 '약 62개월')
export const monthsLabel = (weeks: number) => (weeks > 12 ? formatWeeks(weeks) : `약 ${Math.max(1, Math.round(weeks / 4.33))}개월`)

// ── 주간결산에서 속도 바꾸기(2026-10-30) — 남은 계획 다시 배치 ──
// 규칙: fromWeek(다음 주) 전에 이미 시작한 프로젝트는 **그대로 둔다**(옮기면 커리큘럼 주차·완료 기록이 어긋난다).
//       아직 시작 안 한 프로젝트(미배치 포함)만 원래 순서(시작 주차 → 미배치는 계획 순서)대로 fromWeek 부터 새 속도로 놓는다.
//       진행 중인 프로젝트가 남은 주에 쓰는 시간은 미리 깔고 그 위에 얹는다.
// 시간이 0인(서버 수정 전) 프로젝트는 fallbackMin 분으로 본다 — 안 그러면 '시간이 안 드는 프로젝트'가 된다
// 과정 중에 하는 프로젝트(during, 2026-11-16)는 속도와 상관없이 과정에 묶여 있다 — 과정이 옮겨진 만큼 함께 옮기고, 과정이 그대로면 그대로 둔다
// 2026-11-17(정할 것 2·3): 큰 시험은 새 속도로 남은 기간을 다시 센다
//   · 아직 시작 안 한 시험 — 분량 ÷ 새 주당 시간(나란히 짝은 합쳐서, 시간은 나눠서)
//   · 이미 시작한 시험 — 남은 분량 = 남은 주 × 지금 주당 시간. 그것을 새 속도로 편다. 지난 주의 커리큘럼은 그대로 두고 뒤만 다시 편다
//   · 가벼운 과정(주 15시간 미만)은 문이 아니다(시간은 예산에 센다 — LIGHT_PERIOD_COUNTS_HOURS) · 나란히 짝은 같은 주에 함께 놓는다(autoSchedule 과 같은 규칙)
//   projects 로 바뀐 계획을 돌려준다(시험의 기간·요일·1회 시간·커리큘럼이 바뀐 것은 저장해야 한다 — changed)
export function rescheduleFrom(
  projects: Project[], timeline: TimelineSlot[], fromWeek: number, hours: number, fallbackMin = 60,
): { timeline: TimelineSlot[]; endWeek: number; moved: number; projects: Project[]; changed: Project[] } {
  const timed = (p: Project) => (p.duration ? p : { ...p, duration: fallbackMin })
  const startOf = new Map<string, number>()
  for (const s of timeline) for (const p of s.projects) if (!startOf.has(p.id) || s.week < startOf.get(p.id)!) startOf.set(p.id, s.week)
  const started = (p: Project) => (startOf.get(p.id) ?? Infinity) < fromWeek
  // 큰 시험 다시 세기 — 시작 안 한 것은 새 속도로, 시작한 것은 남은 분량만
  let list = applyExamPace(projects, hours, (p) => !started(p))
  list = resumeStartedExams(list, startOf, fromWeek, hours)
  const before = new Map(projects.map((p) => [p.id, p]))
  const changed = list.filter((p) => p !== before.get(p.id))
  const owners = duringOwners(list)
  const mates = examMates(list)
  const kept = list.filter((p) => started(p))
  const notStarted = list.filter((p) => !started(p))
  const riders = notStarted.filter((p) => owners.has(p.id))          // 과정에 딸린 것 — 아래에서 과정을 따라 놓는다
  const toPlace = notStarted
    .filter((p) => !owners.has(p.id))
    .sort((a, b) => (startOf.get(a.id) ?? Infinity) - (startOf.get(b.id) ?? Infinity))
  // 진행 중인 프로젝트가 fromWeek 이후에 쓰는 시간 = 미리 깔린 부하(0 = fromWeek). '과정'(period)은 시간을 세지 않고, 무거운 과정만 문이 된다
  const preload: number[] = []
  let gate = 0       // 진행 중인 (무거운) 과정이 끝나는 자리(fromWeek 기준 0부터, 미포함) — 아직 시작 안 한 프로젝트는 그 뒤에
  let lastEnd = 0    // 진행 중인 것(딸린 것·가벼운 과정 빼고) 가운데 가장 늦게 끝나는 자리 — 아직 시작 안 한 (무거운) 과정은 그 뒤에
  for (const p of kept) {
    const s = startOf.get(p.id)!
    const end = projectEndWeek(s, p)
    const h = countsInBudget(p) ? projectHoursPerWeek(timed(p)) : 0
    for (let w = Math.max(s, fromWeek); w <= end; w++) preload[w - fromWeek] = (preload[w - fromWeek] ?? 0) + h
    if (owners.has(p.id)) continue
    if (!p.period || isGatePeriod(p)) lastEnd = Math.max(lastEnd, end - fromWeek + 1)
    if (isGatePeriod(p)) gate = Math.max(gate, end - fromWeek + 1)
  }
  // autoSchedule 와 같은 규칙(순서 유지·예산 안 넘는 가장 이른 주·무거운 과정은 문·나란히 짝은 함께) + 미리 깔린 부하
  const load = [...preload]
  let floor = 0
  const placed: { week: number; project: Project }[] = []
  const placedIds = new Set<string>()
  for (const p of toPlace) {
    if (placedIds.has(p.id)) continue
    const per = !!p.period
    const isGate = isGatePeriod(p)
    const counts = countsInBudget(p)
    const w = projectWeeks(p); const h = counts ? projectHoursPerWeek(timed(p)) : 0
    const mate = mates.get(p.id)
    const pair = mate && !started(mate) && !placedIds.has(mate.id) && toPlace.includes(mate) ? mate : null
    const mw = pair ? projectWeeks(pair) : 0
    const mh = pair ? projectHoursPerWeek(timed(pair)) : 0
    const span = Math.max(w, mw)
    let s = Math.max(floor, gate, isGate ? lastEnd : 0)
    for (;; s++) {
      let ok = true
      for (let k = 0; k < span && counts; k++) {
        const l = load[s + k] ?? 0
        const add = (k < w ? h : 0) + (k < mw ? mh : 0)
        if (l > 0 && l + add > hours) { ok = false; break }
      }
      if (ok) break
    }
    for (let k = 0; k < w; k++) load[s + k] = (load[s + k] ?? 0) + h
    placed.push({ week: fromWeek + s, project: p }); placedIds.add(p.id)
    if (pair) {
      for (let k = 0; k < mw; k++) load[s + k] = (load[s + k] ?? 0) + mh
      placed.push({ week: fromWeek + s, project: pair }); placedIds.add(pair.id)
    }
    floor = s
    if (!per || isGate) lastEnd = Math.max(lastEnd, s + span)
    if (isGate) gate = Math.max(gate, s + w)
  }
  // 과정에 딸린 프로젝트: 과정이 옮겨진 만큼 함께 옮긴다. 자리가 없던 것은 과정 끝에 맞춘다
  const newStart = new Map(placed.map(({ week, project }) => [project.id, week]))
  for (const p of riders) {
    const o = owners.get(p.id)!
    const oOld = startOf.get(o.id)
    const oNew = newStart.get(o.id) ?? oOld
    const old = startOf.get(p.id)
    let s = fromWeek
    if (old != null && oOld != null && oNew != null) s = old + (oNew - oOld)
    else if (oNew != null) s = projectEndWeek(oNew, o) - projectWeeks(p) + 1
    placed.push({ week: Math.max(fromWeek, s), project: p })
  }
  const slots: TimelineSlot[] = []
  const put = (week: number, p: Project) => { let sl = slots.find((x) => x.week === week); if (!sl) { sl = { week, projects: [] }; slots.push(sl) } sl.projects.push(p) }
  for (const p of kept) put(startOf.get(p.id)!, p)
  for (const { week, project } of placed) put(week, project)
  slots.sort((a, b) => a.week - b.week)
  const endWeek = Math.max(0, ...kept.map((p) => projectEndWeek(startOf.get(p.id)!, p)), ...placed.map(({ week, project }) => projectEndWeek(week, project)))
  return { timeline: slots, endWeek, moved: placed.filter(({ week, project }) => startOf.get(project.id) !== week).length, projects: list, changed }
}

/**
 * 이미 시작한 큰 시험의 남은 기간을 새 속도로(2026-11-17).
 * 남은 분량 = 남은 주 × 지금 주당 시간(짝은 합) — 속도를 한 번 바꾼 계획도 '지난 주 비율'로 세면 남은 분량이 부풀었다(검토 11-17 L1, 5시간 그대로인데 328→449주).
 * 그 분량 ÷ 새 주당 시간으로 뒤를 다시 편다. 짝은 함께 시작했으면 한 덩어리로 센다.
 * 새 속도의 1회 시간·요일이 지금과 같으면(같은 속도) 손대지 않는다
 */
function resumeStartedExams(projects: Project[], startOf: Map<string, number>, fromWeek: number, hours: number): Project[] {
  const mates = examMates(projects)
  const done = new Map<string, Project>()
  for (const p of projects) {
    if (!isExam(p) || done.has(p.id)) continue
    const s = startOf.get(p.id)
    if (s == null || s >= fromWeek) continue
    const mate = mates.get(p.id)
    const group = mate && startOf.get(mate.id) === s ? [p, mate] : [p]
    const len = Math.max(...group.map((g) => projectWeeks(g)))
    const past = fromWeek - s                               // 지난(또는 이번) 주 수
    if (past >= len) continue                               // 이미 끝난 시험
    const total = group.reduce((n, g) => n + g.studyHours!, 0)
    const sameAsNow = group.every((g) => g.duration === examDurationAt((hours * g.studyHours!) / total) && (g.days ?? []).length === EXAM_DAYS.length)
    if (sameAsNow) continue
    const perWeekNow = group.reduce((n, g) => n + projectHoursPerWeek(g), 0)
    const remaining = (len - past) * perWeekNow
    const newLen = past + Math.max(1, ceilWeeks(remaining / Math.max(0.5, hours)))
    for (const g of group) {
      const share = (hours * g.studyHours!) / total
      const cur = g.curriculum ?? []
      const head = cur.slice(0, past)
      const tail = curriculumPhases(cur.slice(past))
      const rest = tail.length ? expandPhases(scalePhases(tail, newLen - past), past + 1) : []
      const resized = resizeExam(g, share, newLen)
      done.set(g.id, { ...resized, curriculum: head.length || rest.length ? [...head, ...rest] : resized.curriculum })
    }
  }
  return projects.map((p) => done.get(p.id) ?? p)
}

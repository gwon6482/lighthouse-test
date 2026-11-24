// 날짜로 정한 프로젝트(2026-11-25) — '주 수' 말고 '시작일 + 마감일'로 만든 걸음.
// 시안: workspace reviews/2026-11-24-project-dates.html(오너 11-25 "확인함 권장대로", 정할 것 1~6 권장).
//
// 규칙(배치 두 벌 — usePlanTimeline.autoSchedule · usePlanPace.rescheduleFrom — 이 함께 쓰는 한 곳)
//   · 날짜를 넣으면 그 날짜에 고정한다. 속도를 바꾸거나 다시 놓아도 그 자리(시험일 역산이 쓰는 고정 자리 fixed 를 넓혔다).
//     날짜 걸음은 고정이고, 주 수 걸음이 그 둘레에서 속도에 맞춰 움직인다(오너 11-25 확인)
//   · 주 수 = 두 날짜가 걸친 계획 주(주 경계 = 계획 시작 요일). 같은 날짜도 시작 요일에 따라 6주·7주가 된다
//   · 계획 시작보다 이른 시작일은 1주차로 둔다(앞 날은 오늘 할 일에 안 나온다). 마감이 계획 시작 전이면 고정하지 않는다
//   · 첫 주·마지막 주의 날짜 밖 요일은 오늘 할 일에서 뺀다(useWeeklySchedule.generateItemsForWeek)
//   · 앞 순서 걸음이 날짜 걸음 전에 못 끝나면 시험일 규칙과 같게 그 둘레에 채운다(앞 걸음이 뒤로 갈 수 있음) — datedFlips 로 한 줄 알린다
//   · 주 15시간 이상 과정(문)을 날짜로 고정하면 그 기간은 다른 걸음이 건너뛴다(autoSchedule·rescheduleCore 의 blocked)
//   · 시험일 칸이 있는 자격 시험 걸음은 날짜로 정할 수 없다(시험일 칸을 쓴다 — 큰 시험의 분량·속도 연결이 끊기지 않게)
//   · 계획 전체의 종료일은 지금처럼 예상 완료일(11-04) — 날짜 걸음이 늦게 있으면 그만큼 늦어질 뿐 자르지 않는다
// 서버 칸: Project.dateStart · dateEnd('YYYY-MM-DD', lighthouse-api feat/project-dates). 계획의 startDate·endDate 와 다른 칸이다.
import type { DayOfWeek, Project, TimelineSlot, WeekCurriculum } from '../types/career-design'
import { parseDateKey, projectWeeks, toDateKey, weekOfDate, type WeekStart } from '../composables/usePlanTimeline'
import { syncCurriculumLength } from '../composables/useProjectCurriculum'
import { examDateOf, takesExamDate } from './examDate'
import { PART, curriculumPhases, expandPhases, scalePhases } from './examPace'
import { phasesFromCurriculum, rebuildPeriodCurriculum, stretchPhaseIndex } from './period'

export interface DatedCtx { startDate: string; reviewDay?: WeekStart }
type DatedFields = Pick<Project, 'dateStart' | 'dateEnd' | 'category' | 'method'>

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
/** 'YYYY-MM-DD' 이고 달력에 있는 날짜(2027-02-30 아님) — 서버 isDateKey 와 같은 규칙 */
export function isDateKey(s?: string | null): s is string {
  if (!s || !DATE_RE.test(s)) return false
  const d = parseDateKey(s)
  return !!d && toDateKey(d) === s
}

/** '날짜로'를 열 수 있는 걸음 — 시험일 칸이 있는 자격 시험 걸음만 뺀다(정할 것 2) */
export const canUseDates = (p: Pick<Project, 'category' | 'method'>) => !takesExamDate(p)

/** 걸음의 날짜 짝 — 둘 다 날짜이고 마감 ≥ 시작이며 날짜를 열 수 있는 걸음일 때만 */
export function projectDatesOf(p: DatedFields): { start: string; end: string } | null {
  if (!isDateKey(p.dateStart) || !isDateKey(p.dateEnd) || p.dateEnd < p.dateStart || !canUseDates(p)) return null
  return { start: p.dateStart, end: p.dateEnd }
}
export const isDated = (p: DatedFields) => !!projectDatesOf(p)

export interface DatedSpan { startWeek: number; endWeek: number; weeks: number; clipped: boolean }
/**
 * 두 날짜가 걸친 계획 주. 시작일이 계획 시작보다 이르면 1주차부터(clipped). 마감이 계획 시작 전이면 null.
 * 계획 시작일이 없으면 null
 */
export function spanOfDates(start: string, end: string, ctx: DatedCtx): DatedSpan | null {
  const ps = ctx.startDate
  if (!ps || !isDateKey(start) || !isDateKey(end) || end < start || end < ps) return null
  const from = start < ps ? ps : start
  const sw = weekOfDate(ps, parseDateKey(from)!, ctx.reviewDay)
  const ew = weekOfDate(ps, parseDateKey(end)!, ctx.reviewDay)
  if (sw == null || ew == null) return null
  return { startWeek: sw, endWeek: ew, weeks: ew - sw + 1, clipped: start < ps }
}
export function datedSpanOf(p: DatedFields, ctx: DatedCtx): DatedSpan | null {
  const d = projectDatesOf(p)
  return d ? spanOfDates(d.start, d.end, ctx) : null
}

const DOW: DayOfWeek[] = ['일', '월', '화', '수', '목', '금', '토']
/** 날짜 안 실행 횟수 — '월·수·금 17번'. 진로달성은 하루에 할 일 한 줄을 체크하므로 '할 수 있는 할 일 줄 수'다 */
export function runsInDates(days: DayOfWeek[] | undefined, start: string, end: string): number {
  const s = parseDateKey(start); const e = parseDateKey(end)
  if (!s || !e || !days?.length || e < s) return 0
  const set = new Set(days)
  let n = 0
  const d = new Date(s)
  for (let i = 0; i < 40000 && d.getTime() <= e.getTime(); i += 1) {
    if (set.has(DOW[d.getDay()]!)) n += 1
    d.setDate(d.getDate() + 1)
  }
  return n
}

/** 그날이 걸음의 날짜 밖인가(첫 주·마지막 주의 날짜 밖 요일 — 오늘 할 일에서 뺀다, 정할 것 4) */
export function outsideDates(p: DatedFields, dateKey: string): boolean {
  const d = projectDatesOf(p)
  return !!d && (dateKey < d.start || dateKey > d.end)
}

/** 날짜 걸음의 고정 자리(id → 시작 주, 1부터). only 로 고를 수 있다(주간결산: 아직 시작 안 한 것) */
export function datedFixed(projects: Project[], ctx: DatedCtx, only: (p: Project) => boolean = () => true): Map<string, number> {
  const out = new Map<string, number>()
  if (!ctx.startDate) return out
  for (const p of projects) {
    if (!only(p)) continue
    const s = datedSpanOf(p, ctx)
    if (s) out.set(p.id, s.startWeek)
  }
  return out
}

// ── 주 수 맞추기 ──
/**
 * 걸음의 커리큘럼을 weeks 주에 맞춘다.
 *   · 과정: 늘리고 줄이는 단계(stretchPhaseIndex)로 맞추고 쉬는 주는 같은 자리에(rebuildPeriodCurriculum) — 쉬는 주도 날짜 안이다
 *   · 템플릿·도우미에서 온 단계 꼴('OOO (k/n)'): 단계 비율대로(큰 시험의 scalePhases). 공모전 1·4·1주 → 4주 1·2·1, 7주 1·5·1
 *   · 직접 쓴 주차별 할 일: 늘리면 뒤에 빈 주('프로젝트명 - n주차'), 줄이면 잘린 주의 할 일을 남는 마지막 주에 옮긴다(조용히 지우지 않게 —
 *     시작 요일을 바꿔 7주 → 6주가 될 때처럼 물을 화면이 없는 곳에서 쓴다. 입력 화면은 지우기 전에 묻는다)
 */
export function fitCurriculumToWeeks(p: Project, weeks: number): Project {
  const want = Math.max(1, Math.trunc(weeks))
  const cur = p.curriculum ?? []
  if (!cur.length) return p.weeks === want ? p : { ...p, weeks: want }
  if (cur.length === want) return p.weeks === want ? p : { ...p, weeks: want }
  let curriculum: WeekCurriculum[]
  if (p.period) {
    const pauses = cur.filter((w) => w.pause).length
    const active = Math.max(1, want - pauses)
    const phases = phasesFromCurriculum(cur)
    if (!phases.length) return { ...p, weeks: want }
    let sum = phases.reduce((n, ph) => n + ph.weeks, 0)
    const k = stretchPhaseIndex(phases)
    phases[k]!.weeks = Math.max(1, phases[k]!.weeks + (active - sum))
    sum = phases.reduce((n, ph) => n + ph.weeks, 0)
    // 늘리는 단계가 1주까지 줄어도 넘치면 긴 단계부터 줄인다
    while (sum > active) {
      const i = phases.reduce((m, ph, j) => (ph.weeks > phases[m]!.weeks ? j : m), 0)
      if (phases[i]!.weeks <= 1) break
      phases[i]!.weeks -= 1; sum -= 1
    }
    curriculum = rebuildPeriodCurriculum(phases, cur)
  } else if (cur.some((w) => PART.test(w.title))) {
    curriculum = expandPhases(scalePhases(curriculumPhases(cur), want))
  } else if (want > cur.length) {
    curriculum = syncCurriculumLength(cur, want, p.name)
  } else {
    const kept = cur.slice(0, want).map((w) => ({ ...w, items: [...(w.items ?? [])] }))
    const last = kept[kept.length - 1]!
    for (const w of cur.slice(want)) for (const t of w.items ?? []) if (t.trim() && !last.items.includes(t)) last.items.push(t)
    curriculum = kept
  }
  return { ...p, weeks: curriculum.length, curriculum }
}
/** 날짜 걸음이면 걸친 주에 맞춘다(아니면 그대로) */
export function fitDated(p: Project, ctx: DatedCtx): Project {
  const s = datedSpanOf(p, ctx)
  return s ? fitCurriculumToWeeks(p, s.weeks) : p
}

/**
 * 날짜 걸음을 날짜에 다시 맞춘다 — 주 수(걸친 주)와 타임라인 자리 모두. 다른 걸음은 그대로 둔다.
 * 새 계획에서 시작 요일을 고를 때(손으로 옮긴 타임라인이어도), 계획 시작일이 바뀔 때, 수정 흐름에서 날짜를 바꾼 걸음에 쓴다.
 * 배치 안 된 날짜 걸음도 그 자리에 놓는다. 마감이 계획 시작 전인 걸음은 건드리지 않는다
 */
export function alignDated(projects: Project[], timeline: TimelineSlot[], ctx: DatedCtx): { projects: Project[]; timeline: TimelineSlot[]; changed: boolean } {
  let changed = false
  const fitted = projects.map((p) => { const q = fitDated(p, ctx); if (q !== p) changed = true; return q })
  const byId = new Map(fitted.map((p) => [p.id, p]))
  const want = datedFixed(fitted, ctx)
  if (!want.size) return { projects: fitted, timeline, changed }
  const at = new Map<string, number>()
  for (const sl of timeline) for (const p of sl.projects) if (!at.has(p.id) || sl.week < at.get(p.id)!) at.set(p.id, sl.week)
  for (const [id, w] of want) if (at.get(id) !== w) changed = true
  if (!changed) return { projects: fitted, timeline, changed }
  const slots: TimelineSlot[] = timeline
    .map((sl) => ({ week: sl.week, projects: sl.projects.filter((p) => !want.has(p.id)).map((p) => byId.get(p.id) ?? p) }))
  for (const [id, w] of want) {
    let sl = slots.find((x) => x.week === w)
    if (!sl) { sl = { week: w, projects: [] }; slots.push(sl) }
    sl.projects.push(byId.get(id)!)
  }
  return { projects: fitted, timeline: slots.filter((sl) => sl.projects.length).sort((a, b) => a.week - b.week), changed }
}

// ── 알림(정할 것 3) ──
export interface DatedFlip { moved: Project; dated: Project }
/**
 * 앞 순서 걸음이 날짜 걸음 뒤로 간 것 — 순서(projects 순)에서 날짜 걸음보다 앞인데 시작이 날짜 걸음 시작보다 늦은 주 수 걸음.
 * 시험일이 있는 걸음·다른 날짜 걸음은 자기 날짜가 있어 세지 않는다
 */
export function datedFlips(projects: Project[], starts: Map<string, number>, ctx: DatedCtx): DatedFlip[] {
  const out: DatedFlip[] = []
  projects.forEach((d, i) => {
    if (!isDated(d) || !datedSpanOf(d, ctx)) return
    const sd = starts.get(d.id)
    if (sd == null) return
    for (const p of projects.slice(0, i)) {
      if (isDated(p) || examDateOf(p)) continue
      const sp = starts.get(p.id)
      if (sp != null && sp > sd) out.push({ moved: p, dated: d })
    }
  })
  return out
}
/** 한 줄로 — 날짜 걸음마다 '캠페인 기획서 만들기 외 1개가 공모전 도전(3.2~4.9) 뒤로' 의 앞부분 */
export function flipGroups(flips: DatedFlip[]): { dated: Project; first: Project; more: number }[] {
  const out: { dated: Project; first: Project; more: number }[] = []
  for (const f of flips) {
    const g = out.find((x) => x.dated.id === f.dated.id)
    if (g) g.more += 1
    else out.push({ dated: f.dated, first: f.moved, more: 0 })
  }
  return out
}
const flipKey = (f: DatedFlip) => `${f.moved.id}>${f.dated.id}`
/** after 에만 있는 뒤집힘(주간결산: 속도를 바꿔 새로 생기는 것만 알린다) */
export const newFlips = (after: DatedFlip[], before: DatedFlip[]) => { const was = new Set(before.map(flipKey)); return after.filter((f) => !was.has(flipKey(f))) }

// ── 표시용 ──
const DOW_KO = ['일', '월', '화', '수', '목', '금', '토']
/** '3.2' */
export const mdDot = (k: string) => { const d = parseDateKey(k); return d ? `${d.getMonth() + 1}.${d.getDate()}` : '' }
/** '3/2' — 로드맵(주차 날짜와 같은 꼴) */
export const mdSlash = (k: string) => { const d = parseDateKey(k); return d ? `${d.getMonth() + 1}/${d.getDate()}` : '' }
/** '4.9(금)' */
export const mdDow = (k: string) => { const d = parseDateKey(k); return d ? `${d.getMonth() + 1}.${d.getDate()}(${DOW_KO[d.getDay()]})` : '' }
/** '3.2 ~ 4.9' — 타임라인 막대(주 수 자리) */
export function datedRange(p: DatedFields, sep = ' ~ '): string {
  const d = projectDatesOf(p)
  return d ? `${mdDot(d.start)}${sep}${mdDot(d.end)}` : ''
}
/** '3/2~4/9' — 로드맵 */
export function datedRangeSlash(p: DatedFields): string {
  const d = projectDatesOf(p)
  return d ? `${mdSlash(d.start)}~${mdSlash(d.end)}` : ''
}
/** 끝 날 말 — 과정은 '끝', 진도는 '마감'(시안 '내가 정한 것': 과정은 '시작일 / 끝나는 날') */
export const endWord = (p: Pick<Project, 'period'>) => (p.period ? '끝' : '마감')

// ── 받침에 맞춘 조사(괄호·따옴표는 건너뛰고 마지막 한글로) ──
const lastHangul = (w: string) => w.match(/[가-힣](?=[^가-힣]*$)/)?.[0]
const hasBatchim = (w: string) => { const h = lastHangul(w); return !!h && (h.charCodeAt(0) - 0xac00) % 28 !== 0 }
/** 이/가 */
export const iga = (w: string) => `${w}${hasBatchim(w) ? '이' : '가'}`
/** 은/는 */
export const eunNeun = (w: string) => `${w}${hasBatchim(w) ? '은' : '는'}`
/** 과/와 */
export const gwaWa = (w: string) => `${w}${hasBatchim(w) ? '과' : '와'}`
/** (으)로 — ㄹ 받침은 '로' */
export const euro = (w: string) => { const h = lastHangul(w); if (!h) return `${w}로`; const j = (h.charCodeAt(0) - 0xac00) % 28; return `${w}${j === 0 || j === 8 ? '로' : '으로'}` }

/** 같은 고정 자리 둘을 합친다 — 날짜 걸음이 먼저(시험일 칸이 있는 걸음은 날짜를 못 가져 겹치지 않는다) */
export function mergeFixed(dated: Map<string, number>, other: Map<string, number>): Map<string, number> {
  const out = new Map(other)
  for (const [k, v] of dated) out.set(k, v)
  return out
}

/** 그 걸음의 시작 주와 끝 주(배치 기준) — 표시용 */
export const placedEnd = (start: number, p: Project) => start + projectWeeks(p) - 1

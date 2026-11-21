// 시험일 역산(2026-11-22, 진로설계 보완 ③) — 시험일이 있는 걸음을 그날에 맞춰 놓고, 그 속도로 시험까지 되는지 본다.
// 시안: workspace reviews/2026-11-22-exam-date-backplan.html(오너 "이대로 가자", 정할 것 1~9 권장).
//
// 규칙(배치 두 벌 — usePlanTimeline.autoSchedule · usePlanPace.rescheduleFrom — 이 함께 쓰는 한 곳)
//   · 시험 주 = 시험 '전날'이 든 계획 주(주 경계 = 계획 시작 요일 — reviewDay). 시험 날 자체는 공부하는 주에 넣지 않는다
//   · 당기기만 한다: 지금 배치(앞에서부터 채우기)로 시험 주 안에 끝나면 그 자리 그대로, 늦게 끝나면 시험 주에 끝나게 앞당긴다.
//     앞당길 자리가 없으면(오늘부터 해도 모자람) 지금 자리에 두고 '모자라요'로 알린다 — 계획을 자르지 않는다(11-04 종료일 = 예상 완료일)
//   · 날짜가 있는 걸음은 모두(여유 있는 것도) 그 자리에 고정하고, 나머지를 그 둘레에 지금 규칙대로 채운다
//     — 고정하지 않으면 9급을 당길 때 한국사가 자기 시험 뒤로 밀린다(시안 시제품)
//   · 짝(필기 → 실기, 1차 → 2차): 뒤 걸음을 당기면 날짜 없는 앞 걸음도 그 앞으로 함께 당긴다. 뒤 걸음은 늘 앞 걸음이 끝난 뒤(examPairs)
//   · 응시 나이(minStart)보다 앞으로는 당기지 않는다 — 나이 줄이 먼저
//   · 시험일이 없으면 아무것도 바뀌지 않는다
import type { Project, ProjectCategory } from '../types/career-design'
import type { ProjectMethod } from '../composables/projectMethods'
import { autoSchedule, parseDateKey, projectWeeks, projectHoursPerWeek, toDateKey, weekDateRange, weekOfDate, type ScheduleOptions, type WeekStart } from '../composables/usePlanTimeline'
import { curriculumPhases, examMates, expandPhases, isExam } from './examPace'
import { AHEAD_WEEKS, DONE_CHOICES, GRADE_ANNOUNCE_DAYS, GRADE_BEFORE_RULES, TIGHT_RATIO } from './examDateRules'

export interface ExamCtx { startDate: string; reviewDay?: WeekStart; minStart?: (p: Project) => number }

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** 시험일 칸을 받는 걸음 — '합격하면 완료'(자격요건 · 필수 교육·기타가 아닌 방식). projectMethods.doneLabel 과 같은 조건 */
export function takesExamDate(p: { category?: ProjectCategory; method?: ProjectMethod | null }): boolean {
  return p.category === 'qualification' && p.method !== 'required_course' && p.method !== 'etc'
}

/** 걸음의 시험일('YYYY-MM-DD') — 칸을 받는 걸음이고 날짜 꼴일 때만. 아니면 '' (기타에 예전에 넣은 값은 지우지 않고 쓰지도 않는다) */
export function examDateOf(p: Pick<Project, 'category' | 'method' | 'methodDetail'>): string {
  const d = (p.methodDetail?.deadline ?? '').trim()
  return takesExamDate(p) && DATE_RE.test(d) && parseDateKey(d) ? d : ''
}

/** 시험 주 — 시험 전날이 든 계획 주. 시험이 계획 시작일과 같거나 앞이면 0 */
export function examWeekOf(startDate: string, date: string, reviewDay?: WeekStart): number {
  const d = parseDateKey(date)
  if (!d) return 0
  const eve = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1)
  return weekOfDate(startDate, eve, reviewDay) ?? 0
}

export interface DatedExam { id: string; date: string; week: number }
/** 계획 안의 시험일 있는 걸음(시험 주가 1주차 이상인 것만 — 이미 지난 시험은 배치에 쓰지 않는다) */
export function datedExams(projects: Project[], ctx: Pick<ExamCtx, 'startDate' | 'reviewDay'>): DatedExam[] {
  if (!ctx.startDate) return []
  const out: DatedExam[] = []
  for (const p of projects) {
    const date = examDateOf(p)
    if (!date) continue
    const week = examWeekOf(ctx.startDate, date, ctx.reviewDay)
    if (week >= 1) out.push({ id: p.id, date, week })
  }
  return out.sort((a, b) => a.week - b.week || a.date.localeCompare(b.date))
}
export const hasExamDates = (projects: Project[], ctx: Pick<ExamCtx, 'startDate' | 'reviewDay'>) => datedExams(projects, ctx).length > 0

// ── 짝(필기 → 실기, 1차 → 2차) ──
const AFTER_RE = /^(.*?)\s*(실기|2차)(.*)$/
const BEFORE_WORD: Record<string, string> = { 실기: '필기', '2차': '1차' }
const norm = (s: string) => s.replace(/\s+/g, '')
/**
 * 짝 뒤 걸음 id → 앞 걸음 id. 이름으로 본다 — '정보처리기사 필기' → '정보처리기사 실기', '공인회계사 1차' → '공인회계사 2차'.
 * 앞 걸음이 계획에서 먼저 나올 때만(보건의료처럼 실기가 먼저인 시험은 짝으로 보지 않는다)
 */
export function examPairs(projects: Pick<Project, 'id' | 'name'>[]): Map<string, string> {
  const out = new Map<string, string>()
  projects.forEach((p, i) => {
    const m = p.name.match(AFTER_RE)
    if (!m) return
    const want = norm(`${m[1]}${BEFORE_WORD[m[2]!]}${m[3]}`)
    const pred = projects.slice(0, i).reverse().find((q) => norm(q.name) === want)
    if (pred) out.set(p.id, pred.id)
  })
  return out
}

// ── 닻 ──
export interface AnchorOptions {
  minWeek?: number                 // 이보다 앞으로는 못 간다(주간결산: 다음 주)
  keep?: Map<string, number>       // 지금 자리(주간결산) — 시험 주 안이면 그대로 둔다
  movable?: Set<string>            // 옮겨도 되는 걸음(주간결산: 아직 시작 안 한 것). 없으면 전부
}
/**
 * 시험일이 있는 걸음(과 함께 움직일 걸음)의 고정 자리(id → 시작 주, 1부터).
 * forward = 닻 없이 지금 규칙으로 놓은 시작 주. projects 는 속도를 반영한 것(큰 시험 기간이 정해진 것)이어야 한다
 */
export function resolveExamAnchors(projects: Project[], forward: Map<string, number>, ctx: ExamCtx, o: AnchorOptions = {}): Map<string, number> {
  const fixed = new Map<string, number>()
  const exams = datedExams(projects, ctx)
  if (!exams.length) return fixed
  const byId = new Map(projects.map((p) => [p.id, p]))
  const dated = new Set(exams.map((e) => e.id))
  const mates = examMates(projects)
  const pairs = examPairs(projects)
  const lo = o.minWeek ?? 1
  const can = (id: string) => !o.movable || o.movable.has(id)
  for (const e of exams) {
    const p = byId.get(e.id)
    const f = forward.get(e.id)
    if (!p || f == null || fixed.has(e.id) || !can(e.id)) continue
    const mate = mates.get(e.id)
    const w = Math.max(projectWeeks(p), mate ? projectWeeks(mate) : 0)
    const floor = Math.max(lo, (ctx.minStart?.(p) ?? 0) + 1)
    const k = o.keep?.get(e.id)
    let s: number
    if (k != null && k >= floor && k + w - 1 <= e.week) s = k          // 지금 자리가 시험 주 안 — 그대로
    else if (f + w - 1 <= e.week) s = f                                  // 앞에서 채워도 시험 전에 끝남 — 그대로
    else if (e.week - w + 1 >= floor) s = e.week - w + 1                 // 시험 주에 끝나게 앞당김
    else s = f                                                           // 앞당길 자리가 없음 — 모자라요
    fixed.set(e.id, s)
    if (mate && can(mate.id)) fixed.set(mate.id, s)
    // 짝 앞 걸음(날짜 없음) — 뒤 걸음보다 늦게 끝나면 그 앞으로
    const predId = pairs.get(e.id)
    const q = predId ? byId.get(predId) : undefined
    const fq = predId ? forward.get(predId) : undefined
    if (q && fq != null && !dated.has(q.id) && !fixed.has(q.id) && can(q.id) && fq >= lo && fq + projectWeeks(q) - 1 >= s) {
      fixed.set(q.id, Math.max(lo, s - projectWeeks(q)))
    }
  }
  return fixed
}

/**
 * 새 계획 배치(속도 고르기·완성 화면) — 닻 없이 한 번 놓고, 시험일이 있으면 닻을 정해 다시 놓는다.
 * 짝 뒤 걸음은 시험일이 없어도 늘 앞 걸음 뒤에(정할 것 6 — 예전엔 주 16시간 이상에서 필기·실기가 같은 주에 시작했다)
 */
export function scheduleWithExams(projects: Project[], budgetHours: number, ctx?: Partial<ExamCtx>): { week: number; project: Project }[] {
  const after = examPairs(projects)
  const base: ScheduleOptions = { ...(ctx?.minStart ? { minStart: ctx.minStart } : {}), ...(after.size ? { after } : {}) }
  const forward = autoSchedule(projects, budgetHours, base)
  if (!ctx?.startDate) return forward
  const full: ExamCtx = { startDate: ctx.startDate, reviewDay: ctx.reviewDay, minStart: ctx.minStart }
  if (!hasExamDates(projects, full)) return forward
  const fixed = resolveExamAnchors(projects, startsOf(forward), full)
  return fixed.size ? autoSchedule(projects, budgetHours, { ...base, fixed }) : forward
}
/** 놓은 결과 → id → 시작 주 */
export const startsOf = (placed: { week: number; project: Pick<Project, 'id'> }[]) => {
  const m = new Map<string, number>()
  for (const { week, project } of placed) if (!m.has(project.id) || week < m.get(project.id)!) m.set(project.id, week)
  return m
}

// ── 판정(데이터 평가 11-22 — 세 칸) ──
export type ExamVerdict = 'ahead' | 'tight' | 'short'
/**
 * 시험까지 되는지 — 입력만 보고 정한다(화면과 떼어 둔다).
 *   spare = 시험 주 - 끝 주(음수면 늦음) · available = 그 걸음이 시험 주까지 쓸 수 있는 주 × 주당 시간 · need = 남은 분량(큰 시험만)
 *   AHEAD_WEEKS 주 이상 전에 끝나면 ahead, 시험 주 안이면 tight, 늦어도 낼 수 있는 시간이 분량의 TIGHT_RATIO 이상이면 tight, 아니면 short
 */
export function examVerdict(spare: number, available: number, need?: number | null): ExamVerdict {
  if (spare >= AHEAD_WEEKS) return 'ahead'
  if (spare >= 0) return 'tight'
  if (need && need > 0 && available >= need * TIGHT_RATIO) return 'tight'
  return 'short'
}

export interface ExamSlot {
  id: string; name: string; date: string
  examWeek: number; start: number; end: number
  spare: number                // 시험 주 - 끝 주(음수 = 늦음)
  usableWeeks: number          // 시작 주부터 시험 주까지(그 걸음이 실제로 쓸 수 있는 주)
  hoursPerWeek: number
  available: number            // usableWeeks × hoursPerWeek
  need: number | null          // 남은 분량(큰 시험만)
  verdict: ExamVerdict
}
/** 놓은 결과(id → 시작 주)로 시험일 있는 걸음마다 한 줄 */
export function examReport(projects: Project[], starts: Map<string, number>, ctx: Pick<ExamCtx, 'startDate' | 'reviewDay'>): ExamSlot[] {
  const byId = new Map(projects.map((p) => [p.id, p]))
  const out: ExamSlot[] = []
  for (const e of datedExams(projects, ctx)) {
    const p = byId.get(e.id)
    const start = starts.get(e.id)
    if (!p || start == null) continue
    const end = start + projectWeeks(p) - 1
    const usableWeeks = Math.max(0, e.week - start + 1)
    const hoursPerWeek = projectHoursPerWeek(p)
    const available = usableWeeks * hoursPerWeek
    const need = isExam(p) ? p.studyHours! : null
    out.push({ id: p.id, name: p.name, date: e.date, examWeek: e.week, start, end, spare: e.week - end, usableWeeks, hoursPerWeek, available, need, verdict: examVerdict(e.week - end, available, need) })
  }
  return out
}

// ── 날짜 사이 확인(정할 것 6) ──
export interface ExamWarn { id: string; kind: 'pair' | 'grade' | 'course'; text: { after?: string; before?: string; course?: string } }
/** 짝 순서가 뒤집힌 날짜 · 등급 발표 조건(한국사 → 9급) · 과정이 끝나기 전 시험 — 막지 않고 한 줄 */
export function examDateWarnings(projects: Project[], starts?: Map<string, number>, ctx?: Pick<ExamCtx, 'startDate' | 'reviewDay'>): ExamWarn[] {
  const out: ExamWarn[] = []
  const byId = new Map(projects.map((p) => [p.id, p]))
  for (const [after, before] of examPairs(projects)) {
    const a = byId.get(after)!; const b = byId.get(before)!
    const da = examDateOf(a); const db = examDateOf(b)
    if (da && db && da <= db) out.push({ id: after, kind: 'pair', text: { after: a.name, before: b.name } })
  }
  for (const rule of GRADE_BEFORE_RULES) {
    const grades = projects.filter((p) => rule.grade.test(p.id) || rule.grade.test(p.name))
    const exams = projects.filter((p) => rule.exam.test(p.name) && takesExamDate(p) && !grades.includes(p))
    for (const g of grades) {
      const dg = parseDateKey(examDateOf(g))
      for (const x of exams) {
        const dx = parseDateKey(examDateOf(x))
        if (dg && dx && (dx.getTime() - dg.getTime()) / 86_400_000 < GRADE_ANNOUNCE_DAYS) out.push({ id: g.id, kind: 'grade', text: {} })
      }
    }
  }
  if (starts && ctx?.startDate) {
    // 과정(학교·실습 — 문이 되는 무거운 과정)이 끝나기 전 시험: 그 과정 기간 안에 시험 주가 들고, 시험 걸음이 과정에 딸린 것이 아닐 때
    for (const e of datedExams(projects, ctx)) {
      for (const c of projects) {
        if (!(c.period || c.course) || c.id === e.id) continue
        const s = starts.get(c.id)
        const p = byId.get(e.id)
        if (s == null || !p || p.during) continue
        const end = s + projectWeeks(c) - 1
        if (s <= e.week && e.week < end) { out.push({ id: e.id, kind: 'course', text: { course: c.name } }); break }
      }
    }
  }
  return out.filter((w, i) => out.findIndex((x) => x.id === w.id && x.kind === w.kind) === i)
}

// ── 이미 공부해 둔 것(정할 것 4, 큰 시험) ──
export interface DoneChoice { key: string; label: string; done: number; hours: number; rest: string }
/** 큰 시험 걸음의 '어디까지 했나요' 보기 — 단계가 둘 이상일 때만. hours = 남은 분량(단계 주 비율로 어림) */
export function doneChoicesOf(p: Project, fullHours = p.examBackup?.studyHours ?? p.studyHours ?? 0): DoneChoice[] {
  const phases = curriculumPhases((p.examBackup?.curriculum ?? p.curriculum) ?? [])
  if (!isExam({ studyHours: fullHours }) || phases.length < 2) return []
  const total = phases.reduce((n, ph) => n + ph.weeks, 0) || 1
  const out: DoneChoice[] = []
  for (const c of DONE_CHOICES) {
    const done = c.done === 'last' ? phases.length - 1 : c.done
    if (done > phases.length - 1 || out.some((x) => x.done === done)) continue
    const left = phases.slice(done)
    out.push({ key: c.key, label: c.label, done, hours: Math.round((fullHours * left.reduce((n, ph) => n + ph.weeks, 0)) / total), rest: done ? left.map((ph) => ph.title).join(' → ') : '' })
  }
  return out
}
/** 앞 done 단계를 빼고 남은 분량으로 — 원래 값은 examBackup 에 남겨 '아직 시작 전'으로 되돌릴 수 있다(설계 중에만) */
export function skipDonePhases(p: Project, done: number): Project {
  const backup = p.examBackup ?? { studyHours: p.studyHours ?? 0, curriculum: p.curriculum ?? [] }
  const phases = curriculumPhases(backup.curriculum)
  if (!done || phases.length < 2) {
    const { examBackup: _b, ...rest } = p; void _b
    return p.examBackup ? { ...rest, studyHours: backup.studyHours, curriculum: backup.curriculum, weeks: backup.curriculum.length || p.weeks } : p
  }
  const total = phases.reduce((n, ph) => n + ph.weeks, 0) || 1
  const left = phases.slice(Math.min(done, phases.length - 1))
  const leftWeeks = left.reduce((n, ph) => n + ph.weeks, 0)
  const curriculum = expandPhases(left)
  return { ...p, examBackup: backup, studyHours: Math.round((backup.studyHours * leftWeeks) / total), curriculum, weeks: curriculum.length }
}

// ── 표시용 ──
const DOW = ['일', '월', '화', '수', '목', '금', '토']
/** '3월 27일(토)' */
export const mdLabel = (date: string) => { const d = parseDateKey(date); return d ? `${d.getMonth() + 1}월 ${d.getDate()}일(${DOW[d.getDay()]})` : '' }
/** '5.15(토)' */
export const shortMdLabel = (date: string) => { const d = parseDateKey(date); return d ? `${d.getMonth() + 1}.${d.getDate()}(${DOW[d.getDay()]})` : '' }
/** '2029년 12월' — 그 주 마지막 날의 달 */
export const weekEndYm = (startDate: string, week: number, reviewDay?: WeekStart) => {
  const e = weekDateRange(startDate, week, reviewDay)?.end
  if (!e) return ''
  const [y, m] = e.split('-')
  return `${y}년 ${Number(m)}월`
}
/** 그 주 마지막 날('3월 14일') */
export const weekEndMd = (startDate: string, week: number, reviewDay?: WeekStart) => {
  const e = weekDateRange(startDate, week, reviewDay)?.end
  const d = e ? parseDateKey(e) : null
  return d ? `${d.getMonth() + 1}월 ${d.getDate()}일` : ''
}
/** 시간 어림 — 백 단위 반올림('약 1,500시간'). 100시간 미만은 10 단위 */
export const hoursLabel = (h: number) => {
  const r = h >= 100 ? Math.round(h / 100) * 100 : Math.max(10, Math.round(h / 10) * 10)
  return `약 ${r.toLocaleString('ko-KR')}시간`
}
/** 오늘부터 시험까지 날수(D-N) — 지났으면 음수 */
export const daysUntil = (date: string, today: Date) => {
  const d = parseDateKey(date)
  if (!d) return NaN
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((d.getTime() - t.getTime()) / 86_400_000)
}
export { toDateKey }

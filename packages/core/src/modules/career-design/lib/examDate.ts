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
import type { Project, ProjectCategory, WeekCurriculum } from '../types/career-design'
import type { ProjectMethod } from '../composables/projectMethods'
import { autoSchedule, parseDateKey, projectWeeks, projectHoursPerWeek, toDateKey, weekDateRange, weekOfDate, type ScheduleOptions, type WeekStart } from '../composables/usePlanTimeline'
import { curriculumPhases, examMates, expandPhases, isExam, scalePhases } from './examPace'
import { AHEAD_WEEKS, DONE_CHOICES, GRADE_ANNOUNCE_DAYS, GRADE_BEFORE_RULES, TIGHT_RATIO, WAIT_WEEK_TITLE } from './examDateRules'

export interface ExamCtx { startDate: string; reviewDay?: WeekStart; minStart?: (p: Project) => number }

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * 시험일 칸을 받는 걸음 — '합격하면 완료'(자격요건 · 필수 교육·기타가 아닌 방식).
 * 방식이 비어 있는 걸음은 빼다(2026-11-22 코드 검토) — 서버(cleanMethod)는 방식이 없으면 세부 칸을 버려 날짜가 저장되지 않는다
 */
export function takesExamDate(p: { category?: ProjectCategory; method?: ProjectMethod | null }): boolean {
  return p.category === 'qualification' && !!p.method && p.method !== 'required_course' && p.method !== 'etc'
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

// ── 짝(앞 시험 → 뒤 시험) ──
// 이름의 끝말로 차수를 본다 — 서버 자료 검사(plan-library-validate STAGE_PAIRS)와 같은 꼴: 필기·학과(시험)·이론(시험)·1차 → 실기·2차·면접·심사·구술·기능시험.
// 괄호 안(과목)은 떼고 본다('공인중개사 1차(부동산학개론·민법)' → '공인중개사 2차(…)'). 자료의 id 꼬리(-written·-first)와 같은 짝을 이름으로 찾는다
const STAGE_RE = /^(.*?)\s*(필기|1차|학과\s*시험|학과|이론\s*시험|이론|실기\s*·\s*구술|실기\s*시험|실기|2차|심사\s*·\s*면접|면접|기능\s*시험)(\s*시험)?$/
const FRONT = /^(필기|1차|학과|이론)/
function stageOf(name: string): { base: string; front: boolean } | null {
  const m = name.replace(/\([^)]*\)/g, '').trim().match(STAGE_RE)
  if (!m || !m[1]!.trim()) return null
  return { base: m[1]!.replace(/\s+/g, ''), front: FRONT.test(m[2]!.replace(/\s+/g, '')) }
}
/**
 * 짝 뒤 걸음 id → 앞 걸음 id. 앞 걸음이 계획에서 먼저 나올 때만(보건의료처럼 실기가 먼저인 시험은 짝으로 보지 않는다).
 * 같은 이름 바탕에서 가장 가까운 앞 걸음
 */
export function examPairs(projects: Pick<Project, 'id' | 'name'>[]): Map<string, string> {
  const out = new Map<string, string>()
  const stages = projects.map((p) => stageOf(p.name))
  projects.forEach((p, i) => {
    const st = stages[i]
    if (!st || st.front) return
    for (let j = i - 1; j >= 0; j--) {
      const q = stages[j]
      if (q && q.front && q.base === st.base) { out.set(p.id, projects[j]!.id); break }
    }
  })
  return out
}

// ── 닻 ──
export interface AnchorOptions {
  minWeek?: number                 // 이보다 앞으로는 못 간다(주간결산: 다음 주)
  keep?: Map<string, number>       // 지금 자리(주간결산) — 시험 주 안이면 그대로 둔다
  movable?: Set<string>            // 옮겨도 되는 걸음(주간결산: 아직 시작 안 한 것). 없으면 전부
  late?: Set<string>               // 사용자가 '시험 직전으로 옮기기'를 고른 걸음 — 여유가 있어도 시험 주에 끝나게(정할 것 5)
}
/**
 * 시험일이 있는 걸음(과 함께 움직일 걸음)의 고정 자리(id → 시작 주, 1부터).
 * forward = 닻 없이 지금 규칙으로 놓은 시작 주. projects 는 속도를 반영한 것(큰 시험 기간이 정해진 것)이어야 한다.
 * 짝(앞 시험 → 뒤 시험)은 겹치지 않는다(2026-11-22 코드 검토 ①): 뒤 걸음은 앞 걸음이 끝난 다음 주부터.
 *   앞 걸음에 날짜가 없으면 뒤 걸음 앞으로 붙여 고정하고, 앞에 자리가 모자라면 앞 걸음을 들어갈 수 있는 가장 이른 자리에 두고 뒤 걸음을 그 뒤로 민다
 *   (시험 주를 넘기면 examReport 가 '늦어요'로 알린다). 둘 다 날짜가 있으면 앞 걸음 자리에서 뒤 걸음을 그 뒤로(간격이 모자라면 examDateWarnings 'gap')
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
  const floorOf = (p: Project) => Math.max(lo, (ctx.minStart?.(p) ?? 0) + 1)
  const weeksOf = (p: Project) => { const m = mates.get(p.id); return Math.max(projectWeeks(p), m ? projectWeeks(m) : 0) }
  const startOf = (id: string) => fixed.get(id) ?? forward.get(id)
  for (const e of exams) {
    const p = byId.get(e.id)
    const f = forward.get(e.id)
    if (!p || f == null || fixed.has(e.id) || !can(e.id)) continue
    const w = weeksOf(p)
    let floor = floorOf(p)
    // 앞 걸음 — 날짜가 있거나 옮길 수 없으면(이미 시작) 그 끝 뒤가 바닥
    const predId = pairs.get(e.id)
    const q = predId ? byId.get(predId) : undefined
    const qMovable = !!q && !dated.has(q.id) && !fixed.has(q.id) && can(q.id) && (forward.get(q.id) ?? 0) >= lo
    let pairFloor = 0
    if (q && !qMovable && startOf(q.id) != null) { pairFloor = startOf(q.id)! + projectWeeks(q); floor = Math.max(floor, pairFloor) }
    const k = o.keep?.get(e.id)
    let s: number
    if (o.late?.has(e.id) && e.week - w + 1 >= floor) s = e.week - w + 1   // 시험 직전으로 옮기기
    else if (k != null && k >= floor && k + w - 1 <= e.week) s = k     // 지금 자리가 시험 주 안 — 그대로
    else if (f >= floor && f + w - 1 <= e.week) s = f                    // 앞에서 채워도 시험 전에 끝남 — 그대로
    else if (e.week - w + 1 >= floor) s = e.week - w + 1                 // 시험 주에 끝나게 앞당김
    // 앞당길 자리가 없음 — 모자라요. 앞 시험 뒤가 바닥이면 그 바로 뒤에(순서 때문에 더 늦게 놓이지 않게), 아니면 지금 자리
    else s = pairFloor && f > pairFloor ? floor : Math.max(f, floor)
    // 날짜 없는 앞 걸음 — 뒤 걸음보다 늦게 끝나면 그 앞에 붙인다. 자리가 모자라면 앞 걸음을 가장 이른 자리에, 뒤 걸음은 그 뒤로
    if (q && qMovable) {
      const fq = forward.get(q.id)!
      const wq = projectWeeks(q)
      if (fq + wq - 1 >= s) {
        const qs = Math.max(floorOf(q), s - wq)
        fixed.set(q.id, qs)
        s = Math.max(s, qs + wq)
      } else fixed.set(q.id, fq)          // 이미 앞에 있다 — 다시 놓을 때 뒤 걸음 자리를 넘어가지 않게 그 자리에 고정
    }
    fixed.set(e.id, s)
    const mate = mates.get(e.id)
    if (mate && can(mate.id)) fixed.set(mate.id, s)
  }
  return fixed
}

/**
 * 새 계획 배치(속도 고르기·완성 화면) — 닻 없이 한 번 놓고, 시험일이 있으면 닻을 정해 다시 놓는다.
 * 짝 뒤 걸음은 시험일이 없어도 늘 앞 걸음 뒤에(정할 것 6 — 예전엔 주 16시간 이상에서 필기·실기가 같은 주에 시작했다)
 */
// extra.pinned(2026-11-25) — 날짜로 정한 걸음의 고정 자리(lib/projectDates.datedFixed). 닻 없이 놓을 때부터 깔고, 시험일 닻과 합친다
export function scheduleWithExams(projects: Project[], budgetHours: number, ctx?: Partial<ExamCtx>, extra: Pick<AnchorOptions, 'late'> & { pinned?: Map<string, number> } = {}): { week: number; project: Project }[] {
  const after = examPairs(projects)
  const pinned = extra.pinned?.size ? extra.pinned : undefined
  const base: ScheduleOptions = { ...(ctx?.minStart ? { minStart: ctx.minStart } : {}), ...(after.size ? { after } : {}) }
  const forward = autoSchedule(projects, budgetHours, pinned ? { ...base, fixed: pinned } : base)
  if (!ctx?.startDate) return forward
  const full: ExamCtx = { startDate: ctx.startDate, reviewDay: ctx.reviewDay, minStart: ctx.minStart }
  if (!hasExamDates(projects, full)) return forward
  const anchors = resolveExamAnchors(projects, startsOf(forward), full, extra)
  if (!anchors.size) return forward
  const fixed = new Map(anchors)
  for (const [k, v] of pinned ?? []) fixed.set(k, v)      // 날짜 걸음이 먼저(시험일 칸이 있는 걸음은 날짜를 못 가져 겹치지 않는다)
  return autoSchedule(projects, budgetHours, { ...base, fixed })
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
export interface ExamWarn { id: string; kind: 'pair' | 'gap' | 'grade' | 'course'; text: { after?: string; before?: string; course?: string; weeks?: number } }
/** 짝 순서가 뒤집힌 날짜 · 등급 발표 조건(한국사 → 9급) · 과정이 끝나기 전 시험 — 막지 않고 한 줄 */
export function examDateWarnings(projects: Project[], starts?: Map<string, number>, ctx?: Pick<ExamCtx, 'startDate' | 'reviewDay'>): ExamWarn[] {
  const out: ExamWarn[] = []
  const byId = new Map(projects.map((p) => [p.id, p]))
  for (const [after, before] of examPairs(projects)) {
    const a = byId.get(after)!; const b = byId.get(before)!
    const da = examDateOf(a); const db = examDateOf(b)
    if (da && db && da <= db) out.push({ id: after, kind: 'pair', text: { after: a.name, before: b.name } })
    // 두 시험 사이가 뒤 걸음 기간보다 짧다 — 겹치지 않게 놓으면 뒤 걸음이 시험보다 늦게 끝난다(2026-11-22 코드 검토 ①)
    else if (da && db && ctx?.startDate) {
      const gap = examWeekOf(ctx.startDate, da, ctx.reviewDay) - examWeekOf(ctx.startDate, db, ctx.reviewDay)
      if (gap < projectWeeks(a)) out.push({ id: after, kind: 'gap', text: { after: a.name, before: b.name, weeks: projectWeeks(a) } })
    }
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

/**
 * 마지막 주 할 일 '응시'를 뺀다(시험일이 있으면 시험 날 표시로 옮긴다 — 정할 것 5). 그 주에 다른 할 일이 없으면 그대로.
 * 원래 할 일은 applyItemBackup 에 남겨 날짜를 지우면 restoreApplyItem 으로 되돌린다(설계 중에만 — 서버에는 가지 않는다)
 */
export function withoutApplyItem(p: Project): Project {
  const cur = p.curriculum ?? []
  const last = cur[cur.length - 1]
  if (!last || !last.items.includes('응시') || last.items.length < 2) return p
  return { ...p, applyItemBackup: [...last.items], curriculum: [...cur.slice(0, -1), { ...last, items: last.items.filter((t) => t !== '응시') }] }
}
/** 뺀 '응시'를 되돌린다 — 마지막 주가 뺀 뒤 그대로일 때만(사용자가 고쳤으면 두고 표시만 지운다) */
export function restoreApplyItem(p: Project): Project {
  const back = p.applyItemBackup
  if (!back) return p
  const { applyItemBackup: _b, ...rest } = p; void _b
  const cur = p.curriculum ?? []
  const last = cur[cur.length - 1]
  const same = !!last && last.items.join('\n') === back.filter((t) => t !== '응시').join('\n')
  return same ? { ...rest, curriculum: [...cur.slice(0, -1), { ...last!, items: [...back] }] } : rest
}
/** 시험일에 맞춰 '응시'를 빼거나 되돌린다 — 속도 고르기 '배치하기' 때 */
export const syncApplyItem = (p: Project): Project => (examDateOf(p) ? withoutApplyItem(p) : restoreApplyItem(p))

// ── 다음 시험 날짜(시험 뒤 첫 결산 — 정할 것 9) ──
/**
 * 이미 시작한(또는 끝난) 시험 걸음을 새 시험 주에 맞춰 다시 편다(2026-11-22 코드 검토 2-1).
 * 지난 주(fromWeek 앞)의 할 일은 그대로 두고, fromWeek 부터 새 시험 주까지를 남은 단계로 채운다.
 * 남은 단계가 없으면(이미 끝난 걸음) 마지막 단계(기출·실전)를 그 주 수만큼 다시 편다. 새 시험 주가 fromWeek 보다 앞이면 그대로
 */
export function refitStartedExam(p: Project, startWeek: number, fromWeek: number, newExamWeek: number): Project {
  const cur = p.curriculum ?? []
  const len = projectWeeks(p)
  const past = Math.max(0, fromWeek - startWeek)          // 지난 주 수(걸음이 끝난 뒤 지난 주 포함)
  const left = newExamWeek - fromWeek + 1
  if (left < 1 || !cur.length) return p
  const head = cur.slice(0, Math.min(past, len))
  // 걸음이 끝난 뒤 이미 지난 주 — 할 일 없는 주로 메운다(지난 주에 할 일이 새로 생기지 않게. 걸음은 한 덩어리라 빈 주로 잇는다)
  const gap = Array.from({ length: Math.max(0, past - len) }, (_, i) => ({ week: len + i + 1, title: WAIT_WEEK_TITLE, items: [] as string[] }))
  const restPhases = curriculumPhases(cur.slice(Math.min(past, len)))
  const phases = restPhases.length ? restPhases : curriculumPhases(cur).slice(-1)
  const tail = expandPhases(scalePhases(phases, left), head.length + gap.length + 1)
  const curriculum = [...head, ...gap, ...tail]
  return { ...p, curriculum, weeks: curriculum.length }
}

/**
 * 시험 뒤 첫 결산의 고른 것 → 바뀐 걸음(없으면 null). 'done' 은 시험일만 지운다(걸음은 완료 처리하지 않는다),
 * 'next' 는 새 날짜를 넣고, 이미 시작한 걸음이면 새 시험 주에 맞춰 남은 주를 다시 편다(refitStartedExam). 'wait'·빈 것은 그대로
 */
export function examAfterChange(
  p: Project, kind: '' | 'wait' | 'next' | 'done', date: string,
  at: { startDate: string; reviewDay?: WeekStart; startWeek: number | null; fromWeek: number },
): Project | null {
  if (kind === 'done') {
    const detail = { ...(p.methodDetail ?? {}) }
    delete detail.deadline
    return { ...p, methodDetail: detail }
  }
  if (kind !== 'next' || !DATE_RE.test(date)) return null
  const next: Project = { ...p, methodDetail: { ...(p.methodDetail ?? {}), deadline: date } }
  if (at.startWeek == null || at.startWeek >= at.fromWeek) return next     // 아직 시작 안 함 — 다시 놓을 때 닻이 맞춘다
  return refitStartedExam(next, at.startWeek, at.fromWeek, examWeekOf(at.startDate, date, at.reviewDay))
}
/** 걸음의 할 일을 다 끝냈는가 — 시험 뒤 질문을 하지 않는다(코드 검토 11-22) */
export function allItemsDone(p: Pick<Project, 'id' | 'curriculum'>, isItemDone: (id: string, week: number, idx: number) => boolean, entriesOf: (w: WeekCurriculum) => string[]): boolean {
  let total = 0
  for (const w of p.curriculum ?? []) {
    const n = entriesOf(w).length
    total += n
    for (let i = 0; i < n; i++) if (!isItemDone(p.id, w.week, i)) return false
  }
  return total > 0
}

// ── 표시용 ──
const DOW = ['일', '월', '화', '수', '목', '금', '토']
/** '3월 27일(토)' */
export const mdLabel = (date: string) => { const d = parseDateKey(date); return d ? `${d.getMonth() + 1}월 ${d.getDate()}일(${DOW[d.getDay()]})` : '' }
/** '3월 27일' */
export const mdPlain = (date: string) => { const d = parseDateKey(date); return d ? `${d.getMonth() + 1}월 ${d.getDate()}일` : '' }
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
  if (h <= 0) return '0시간'
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

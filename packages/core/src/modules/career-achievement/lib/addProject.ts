// 홈에서 새 프로젝트를 바로 더해 시작하기(#99, 2026-11-26 오너 — 시안 workspace reviews/2026-11-26-achievement-home-add-undo.html 정할 것 1~6 권장).
// 화면과 무관한 계산만 여기(시험: __tests__/addProject.spec.ts). 화면은 AddProjectSheet(고르기) → 진로설계 '새로운 프로젝트 추가'(add 모드) → CareerAchievementAddConfirmPage.
//
// 규칙
// - 놓는 주: 기본 '오늘부터'(이번 주, 오늘 전 요일은 빼요 — 프로젝트 startOn = 오늘), '다음 주부터'(다음 주 첫날부터, startOn 없음).
//   날짜로 정한 걸음(dateStart·dateEnd)은 그 날짜가 걸친 주에 놓는다(이 칸은 숨긴다)
// - 다른 프로젝트는 옮기지 않는다. 한 주 시간(속도)을 넘어도 막지 않고 한 줄로 알린다(정할 것 4)
// - 예상 완료일은 사용자가 정하지 않는다 — 배치로 다시 센 projectedEndDate 를 그대로 보여 준다(정할 것 5)
// - 예시: 목표 직업 예시 계획(모든 갈래) 가운데 내 계획에 없는 걸음(같은 이름이 있으면 뺌). 지원하는 곳에 따라 고르는 걸음·과정(다니는 곳)은 넣지 않는다
import type { JobPreparation } from '@/modules/encyclopedia/types/encyclopedia'
import type { DayOfWeek, Project, TimelineSlot } from '@/modules/career-design/types/career-design'
import { helperExampleToProject, projectToExample } from '@/modules/career-design/composables/useHelperExamples'
import {
  parseDateKey, projectEndWeek, projectHoursPerWeek, projectWeeks, projectedEndDate, projectsActiveInWeek, toDateKey, weekDateRange, weekOfDate, type WeekStart,
} from '@/modules/career-design/composables/usePlanTimeline'
import { datedSpanOf } from '@/modules/career-design/lib/projectDates'

export const EXAMPLES_SHOWN = 3

/** 예시 계획에서 고를 걸음 — 기본 갈래부터, 갈래 안 차례대로. 요일은 내 계획의 다른 걸음과 겹치지 않게 고른다 */
export function exampleCandidates(prep: JobPreparation, plan: { projects: Pick<Project, 'name' | 'days'>[] }): Project[] {
  const have = new Set(plan.projects.map((p) => p.name.trim()))
  const seen = new Set<string>()
  const paths = [...prep.paths].sort((a, b) => Number(b.track === prep.defaultTrack) - Number(a.track === prep.defaultTrack))
  const recent: DayOfWeek[][] = plan.projects.map((p) => p.days)
  const out: Project[] = []
  for (const path of paths) {
    for (const item of path.items) {
      const pr = prep.projects[item.ref]
      if (!pr || item.optional || pr.period || seen.has(item.ref) || have.has(pr.name.trim())) continue
      seen.add(item.ref)
      out.push(helperExampleToProject(projectToExample(prep, item, pr), pr.category, recent))
    }
  }
  return out
}

export type StartWhen = 'today' | 'next'
export interface PlanCtx { startDate: string; reviewDay?: WeekStart; endDate?: string; paceHours?: number | null; projects: Project[]; timeline: TimelineSlot[] }

/** '오늘부터'·'다음 주부터'의 첫날 — 오늘 / 다음 주 첫날 */
export function startChoices(plan: Pick<PlanCtx, 'startDate' | 'reviewDay'>, today: Date): { today: string; next: string; week: number } | null {
  const w = weekOfDate(plan.startDate, today, plan.reviewDay)
  const next = w ? weekDateRange(plan.startDate, w + 1, plan.reviewDay) : null
  return w && next ? { today: toDateKey(today), next: next.start, week: w } : null
}

/** 놓을 자리 — 시작 주와 첫날·끝날, 저장할 startOn('오늘부터'만) */
export function placementOf(plan: PlanCtx, project: Project, today: Date, when: StartWhen): { week: number; startKey: string; endKey: string; startOn?: string } | null {
  const ctx = { startDate: plan.startDate, reviewDay: plan.reviewDay }
  const dated = datedSpanOf(project, ctx)
  if (dated) return { week: dated.startWeek, startKey: project.dateStart!, endKey: project.dateEnd! }
  const c = startChoices(plan, today)
  if (!c) return null
  const week = when === 'today' ? c.week : c.week + 1
  const end = weekDateRange(plan.startDate, projectEndWeek(week, project), plan.reviewDay)
  return { week, startKey: when === 'today' ? c.today : c.next, endKey: end?.end ?? '', ...(when === 'today' ? { startOn: c.today } : {}) }
}

/** 타임라인에 한 자리 더하기 — 슬롯에는 프로젝트 사본이 아니라 그 프로젝트를 넣는다(읽을 때 id 로 원본을 다시 찾는다) */
export function withSlot(timeline: TimelineSlot[], project: Project, week: number): TimelineSlot[] {
  const out = timeline.map((s) => ({ week: s.week, projects: [...s.projects] }))
  const s = out.find((x) => x.week === week)
  if (s) s.projects.push(project)
  else out.push({ week, projects: [project] })
  return out.sort((a, b) => a.week - b.week)
}

export interface LoadRow { week: number; hours: number; over: boolean; parts: { id: string; name: string; hours: number; added: boolean; category: Project['category'] }[] }
/** 새 걸음이 놓이는 주마다 쓰는 시간 — 진로설계 타임라인 화면과 같은 셈(그 주에 걸친 프로젝트의 주당 시간 합, projectHoursPerWeek) */
export function weekLoad(plan: PlanCtx, project: Project, week: number): LoadRow[] {
  const projects = [...plan.projects, project]
  const timeline = withSlot(plan.timeline, project, week)
  const rows: LoadRow[] = []
  for (let w = week; w < week + projectWeeks(project); w += 1) {
    const parts = projectsActiveInWeek(timeline, w, projects).map((p) => ({ id: p.id, name: p.name, hours: projectHoursPerWeek(p), added: p.id === project.id, category: p.category }))
    const hours = parts.reduce((n, x) => n + x.hours, 0)
    rows.push({ week: w, hours, over: !!plan.paceHours && hours > plan.paceHours, parts })
  }
  return rows
}

const fmtH = (h: number) => `${Math.round(h * 10) / 10}`
/** 속도를 넘는 주 한 줄 — '4주 모두 정한 속도보다 많아요. 이번 주는 3.5시간 더 써야 해요.' 넘는 주가 없거나 속도가 없으면 '' */
export function overLine(rows: LoadRow[], paceHours: number | null | undefined, labelOf: (week: number) => string): string {
  if (!paceHours) return ''
  const over = rows.filter((r) => r.hours > paceHours)
  if (!over.length) return ''
  const head = over.length === rows.length
    ? (rows.length === 1 ? '정한 속도보다 많아요.' : `${rows.length}주 모두 정한 속도보다 많아요.`)
    : `${rows.length}주 중 ${over.length}주가 정한 속도보다 많아요.`
  const first = over[0]!
  return `${head} ${labelOf(first.week)}는 ${fmtH(first.hours - paceHours)}시간 더 써야 해요.`
}

/** 예상 완료일 — 지금과 더한 뒤 */
export function endChange(plan: PlanCtx, project: Project, week: number): { before: string; after: string } {
  const before = projectedEndDate(plan.startDate, plan.timeline, plan.projects, plan.reviewDay) || plan.endDate || ''
  const after = projectedEndDate(plan.startDate, withSlot(plan.timeline, project, week), [...plan.projects, project], plan.reviewDay) || before
  return { before, after }
}

const DOW = ['일', '월', '화', '수', '목', '금', '토']
/** '11.26(목)' */
export const mdDow = (k: string) => { const d = parseDateKey(k); return d ? `${d.getMonth() + 1}.${d.getDate()}(${DOW[d.getDay()]})` : '' }
/** '2027.9.7(화)' */
export const ymdDow = (k: string) => { const d = parseDateKey(k); return d ? `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}(${DOW[d.getDay()]})` : '' }

/** 예상 완료일 한 줄 — '예상 완료일 2027.9.7(화) 그대로' / '예상 완료일 9.7 → 10.12'(해가 바뀌면 해까지) */
export function endLine(c: { before: string; after: string }): string {
  if (!c.after) return ''
  if (!c.before || c.before === c.after) return `예상 완료일 ${ymdDow(c.after)} 그대로`
  const b = parseDateKey(c.before)!; const a = parseDateKey(c.after)!
  const f = (d: Date, y: boolean) => `${y ? `${d.getFullYear()}.` : ''}${d.getMonth() + 1}.${d.getDate()}`
  const y = b.getFullYear() !== a.getFullYear()
  return `예상 완료일 ${f(b, y)} → ${f(a, y)}`
}

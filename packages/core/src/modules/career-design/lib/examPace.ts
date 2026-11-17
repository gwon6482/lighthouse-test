// 큰 시험의 분량과 속도(2026-11-17, 정할 것 2·3 — workspace decisions/2026-11-17-duration-exam-plan.md).
//
// 진로계획 라이브러리의 큰 시험(9급 필기·임용·전문자격 1·2차 등)은 '첫 시험까지(빠른 경우)' 공부 총량(studyHours, 시간)을 가진다.
// 자료의 주 수는 전업(하루 8시간·주 6일 = 주 48시간) 기준이다. 계획에서는 **고른 속도의 주당 시간이 곧 시험 공부 시간**이다:
//   시험 주 수 = 분량 ÷ 주당 시간 (요일은 주 6일, 1회 = 주당 시간 ÷ 6)
// 나란히(alongside) 짝(7·5급 PSAT ↔ 전문과목·2차)은 두 분량을 합쳐 기간을 정하고 주당 시간을 분량 비율로 나눠 쓴다
// — 두 걸음이 고른 시간을 각각 다 쓰면 실제 공부 시간이 두 배가 된다(데이터 평가 11-17).
// 속도 고르기·완료 화면·주간결산 속도 바꾸기가 이 계산 하나를 쓴다. 화면과 무관한 순수 함수만 둔다.
import { FULL_TIME_HOURS, formatFullTime, formatWeeks } from '@/modules/encyclopedia/lib/preparation'
import type { PrepPassStat } from '@/modules/encyclopedia/types/encyclopedia'
import type { DayOfWeek, ExamStat, Project, WeekCurriculum } from '../types/career-design'

export const EXAM_DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금', '토']

export const isExam = (p?: { studyHours?: number } | null): boolean => (p?.studyHours ?? 0) > 0

/** 분량 ÷ 주당 시간(올림, 1주 이상) */
export const examWeeksAt = (studyHours: number, perWeek: number): number => Math.max(1, ceilWeeks(studyHours / Math.max(0.5, perWeek)))

/** 올림 — 나눗셈의 소수점 오차(104.00000000000001)로 한 주가 더 붙지 않게 */
export const ceilWeeks = (x: number): number => Math.ceil(x - 1e-9)

export interface PhaseLike { title: string; weeks: number; items: string[] }

const PART = /^(.*) \((\d+)\/(\d+)\)$/

/** 주차별 커리큘럼을 단계로 되묶는다 — 'OOO (2/24)' 꼴(phasesToCurriculum 이 만든 이름)을 단계 하나로 */
export function curriculumPhases(cur: WeekCurriculum[]): PhaseLike[] {
  const out: PhaseLike[] = []
  for (const w of cur) {
    const m = w.title.match(PART)
    const title = m ? m[1]! : w.title
    const last = out[out.length - 1]
    if (last && m && Number(m[2]) > 1 && last.title === title) { last.weeks += 1; continue }
    out.push({ title, weeks: 1, items: [...(w.items ?? [])] })
  }
  return out
}

/** 단계 주 수를 비율대로 total 주에 맞춘다(각 단계 1주 이상, 남는 주는 소수점이 큰 단계부터) */
export function scalePhases(phases: PhaseLike[], total: number): PhaseLike[] {
  const n = phases.length
  if (!n) return []
  const t = Math.max(1, Math.round(total))
  if (t <= n) return phases.slice(0, t).map((p) => ({ ...p, weeks: 1 }))
  const sum = phases.reduce((a, p) => a + p.weeks, 0) || n
  const raw = phases.map((p) => (p.weeks / sum) * t)
  const out = raw.map((x) => Math.max(1, Math.floor(x)))
  let left = t - out.reduce((a, b) => a + b, 0)
  const order = raw.map((x, i) => [x - Math.floor(x), i] as const).sort((a, b) => b[0] - a[0])
  for (let k = 0; left > 0; k = (k + 1) % n) { out[order[k]![1]]! += 1; left -= 1 }
  while (left < 0) { const i = out.indexOf(Math.max(...out)); out[i]! -= 1; left += 1 }
  return phases.map((p, i) => ({ ...p, weeks: out[i]! }))
}

/** 단계를 주차별 커리큘럼으로(useHelperExamples.phasesToCurriculum 과 같은 꼴) */
export function expandPhases(phases: PhaseLike[], from = 1): WeekCurriculum[] {
  const out: WeekCurriculum[] = []
  for (const ph of phases) {
    const n = Math.max(1, Math.trunc(ph.weeks))
    for (let k = 1; k <= n; k += 1) out.push({ week: from + out.length, title: n > 1 ? `${ph.title} (${k}/${n})` : ph.title, items: [...ph.items] })
  }
  return out
}

/** 1회 시간(분) = 주당 시간 ÷ 6 — 분 단위 내림(10분 이상)이라 짝의 합이 예산을 넘지 않는다 */
export const examDurationAt = (perWeek: number): number => Math.max(10, Math.floor((perWeek * 60) / EXAM_DAYS.length))

/** 시험 프로젝트 하나를 주당 perWeek 시간 · weeks 주로 다시 잡는다(요일 6일, 1회 = examDurationAt) */
export function resizeExam(p: Project, perWeek: number, weeks: number): Project {
  const duration = examDurationAt(perWeek)
  const phases = curriculumPhases(p.curriculum ?? [])
  const curriculum = phases.length ? expandPhases(scalePhases(phases, weeks)) : p.curriculum
  return { ...p, days: [...EXAM_DAYS], duration, weeks, ...(curriculum ? { curriculum } : {}) }
}

/** 나란히 짝 — 둘 다 계획에 있는 시험일 때만(한쪽이 빠졌거나 사용자가 기간을 고쳐 연결을 끊었으면 혼자) */
export function examMates(projects: Project[]): Map<string, Project> {
  const byId = new Map(projects.map((p) => [p.id, p]))
  const out = new Map<string, Project>()
  for (const p of projects) {
    const q = p.alongside ? byId.get(p.alongside) : undefined
    if (isExam(p) && q && isExam(q) && q.id !== p.id) { out.set(p.id, q); out.set(q.id, p) }
  }
  return out
}

/**
 * 계획의 시험들을 주당 hours 시간에 맞춘다. 시험이 아닌 프로젝트는 그대로다.
 * only 로 고친 것만 고를 수 있다(주간결산: 아직 시작하지 않은 시험만).
 */
export function applyExamPace(projects: Project[], hours: number, only: (p: Project) => boolean = () => true): Project[] {
  const mates = examMates(projects)
  const done = new Map<string, Project>()
  for (const p of projects) {
    if (!isExam(p) || !only(p) || done.has(p.id)) continue
    const mate = mates.get(p.id)
    if (mate && only(mate)) {
      const total = p.studyHours! + mate.studyHours!
      const weeks = examWeeksAt(total, hours)
      done.set(p.id, resizeExam(p, (hours * p.studyHours!) / total, weeks))
      done.set(mate.id, resizeExam(mate, (hours * mate.studyHours!) / total, weeks))
    } else {
      done.set(p.id, resizeExam(p, hours, examWeeksAt(p.studyHours!, hours)))
    }
  }
  // 기간·1회 시간·요일 수가 그대로면 원래 것을 돌려준다(같은 속도로 미리보기·다시 배치할 때 바뀐 것으로 세지 않게)
  return projects.map((p) => { const r = done.get(p.id); return r && !sameShape(p, r) ? r : p })
}

const sameShape = (a: Project, b: Project) =>
  (a.weeks || a.curriculum?.length || 0) === (b.weeks || b.curriculum?.length || 0) && a.duration === b.duration && (a.days ?? []).length === (b.days ?? []).length

/**
 * 합격자 수치 → 속도 고르기에 보여 줄 한 벌.
 * noBeyond = 근거가 맞지 않는 걸음(7급 — 7·9급 합친 값, PSAT 도입 전): 평균 요약(headlineMean)만, 근거 밖 줄 없음(오너 결정 8 '평균·출처만')
 */
export function examStatOf(stat: PrepPassStat | undefined | null, noBeyond = false): ExamStat | undefined {
  if (!stat?.headline) return undefined
  const dist = stat.dist ?? []
  const beyond = !noBeyond && stat.beyondWeeks != null ? dist.find((d) => d.weeks === stat.beyondWeeks) : undefined
  const last = !noBeyond && dist.length ? dist[dist.length - 1] : undefined
  return {
    headline: noBeyond ? meanHeadline(stat) : stat.headline,
    beyondWeeks: beyond ? beyond.weeks : null,
    beyondLine: beyond ? `합격한 사람 10명 중 ${Math.floor(beyond.pct / 10)}명은 ${beyond.label}에 붙었어요` : null,
    allWeeks: last && last.weeks !== beyond?.weeks ? last.weeks : null,
    allLine: last && last.weeks !== beyond?.weeks ? `합격한 사람 100명 중 ${Math.floor(last.pct)}명은 ${last.label}에 붙었어요` : null,
  }
}

/** 평균만 쓰는 요약 — 자료의 headlineMean, 없으면 평균으로 짓는다(자료가 들어오기 전 대비) */
export const meanHeadline = (stat: PrepPassStat): string =>
  stat.headlineMean || (stat.mean ? `합격한 사람은 평균 ${stat.mean.label} 만에 붙었어요` : stat.headline)

/** 시험 덩어리(혼자 · 나란히 짝) — 덩어리마다 분량을 합쳐 기간을 센다 */
export interface ExamUnit { projects: Project[]; hours: number; stat?: ExamStat }
export function examUnits(projects: Project[]): ExamUnit[] {
  const mates = examMates(projects)
  const seen = new Set<string>()
  const out: ExamUnit[] = []
  for (const p of projects) {
    if (!isExam(p) || seen.has(p.id)) continue
    const mate = mates.get(p.id)
    seen.add(p.id); if (mate) seen.add(mate.id)
    const group = mate ? [p, mate] : [p]
    out.push({ projects: group, hours: group.reduce((n, g) => n + g.studyHours!, 0), stat: p.examStat ?? mate?.examStat })
  }
  return out
}

/**
 * 이 속도에서 시험 공부 전체를 한 줄로(검토 11-17 C1·C3·C4) — 시험이 둘 이상이면 합쳐 쓰고, 나란히 짝은 한 덩어리로 센다.
 *   느리면 "그중 시험 공부(2개)가 약 9년이에요. 전업(하루 8시간) 2년 3개월 분량을 이 속도로 마치는 데 걸려요. 시험은 해마다 있어요."
 *   전업 이상이면 "그중 첫 시험까지 공부가 약 12개월이에요."
 * 근거 밖 줄은 덩어리마다 그 수치의 기준을 넘을 때만(7급은 examStatOf 가 비웠다). 줄 순서: 시험 → 근거 밖 → 97% → 속도 올리기
 */
export interface ExamPaceSummary { count: number; weeks: number; slow: boolean; lines: string[] }
export function examPaceSummary(projects: Project[], hours: number): ExamPaceSummary | null {
  const units = examUnits(projects)
  if (!units.length) return null
  const weeks = units.reduce((n, u) => n + examWeeksAt(u.hours, hours), 0)
  const fullWeeks = units.reduce((n, u) => n + u.hours / FULL_TIME_HOURS, 0)
  const slow = hours < FULL_TIME_HOURS
  const n = units.length > 1 ? `(${units.length}개)` : ''
  const W = formatWeeks(weeks)
  const lines = [slow
    ? `그중 시험 공부${n}가 ${W}${josaIeyo(W)}. 전업(하루 8시간) ${formatFullTime(fullWeeks)} 분량을 이 속도로 마치는 데 걸려요. 시험은 해마다 있어요.`
    : `그중 첫 시험까지 공부${n}가 ${W}${josaIeyo(W)}.`]
  const over = (u: ExamUnit, lim: number | null | undefined) => lim != null && examWeeksAt(u.hours, hours) > lim
  const beyond = units.find((u) => u.stat?.beyondLine && over(u, u.stat.beyondWeeks))?.stat?.beyondLine ?? null
  const all = units.find((u) => u.stat?.allLine && over(u, u.stat.allWeeks))?.stat?.allLine ?? null
  if (beyond) lines.push(`${beyond}.`)
  if (all) lines.push(`${all}.`)
  if (beyond) lines.push('시간이 더 날 때(방학·졸업 뒤 등) 주간결산에서 속도를 올리면 날짜가 당겨져요.')
  return { count: units.length, weeks, slow, lines }
}

// '약 4년' + '이에요' / '8주' + '예요'
const josaIeyo = (s: string) => { const c = s.charCodeAt(s.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 === 0 ? '예요' : '이에요' }

// ── 응시 나이(2026-11-17, 검토 C6) ──
// 자료의 minAge(시험을 보는 해 기준 — 공무원 공채 18, 교정 20, 경위 공채 21)를 먼저 쓴다. 없으면 이름 규칙: 5·7·9급·PSAT 18, 교정·보호 20.
// 계획의 시험 걸음이 응시할 수 있는 해보다 먼저 끝나면 그 해로 미룬다(속도 고르기). 나이는 가입 때 받은 나이로 출생 연도를 어림한다
export function examMinAge(p: Pick<Project, 'name' | 'studyHours' | 'minAge'>): number {
  if (!isExam(p)) return 0
  if ((p.minAge ?? 0) > 0) return p.minAge!
  if (/교정|보호/.test(p.name) && /[579]급/.test(p.name)) return 20
  return /[579]급|PSAT|공직적격성/.test(p.name) ? 18 : 0
}

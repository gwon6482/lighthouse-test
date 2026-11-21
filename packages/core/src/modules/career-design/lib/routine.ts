// 루틴 리뉴얼(2026-11-21, workspace reviews/2026-11-21-routine-renewal.html — 오너 정할 것 1~7 모두 권장) — 화면과 무관한 계산만.
//
//   · 종류: 기준 넘기(target) · 실력 올리기(level) · 감 유지(keep). 종류가 없는 옛 루틴은 감 유지처럼 계획 끝까지 그 요일에 나온다
//   · 함께 할 프로젝트(projectId)에 붙이면 그 프로젝트가 놓인 주에만 나온다. 프로젝트는 목표·기록 재기·마무리, 루틴은 매일 분량(시간은 한 번만 센다)
//   · 라이브러리 제안을 '넣기'로 넣는 순간에만 그 프로젝트를 주 1회 기록 재기·점검으로 줄이고, 루틴을 빼면 되돌린다(총괄 11-21)
//   · 완료는 한 번 누르기 그대로. target·level 만 주 1회 기록(주간결산에 추이)
//   · 루틴 시간은 속도 예산에 센다 — 붙은 루틴은 그 프로젝트의 시간으로, 붙지 않은 루틴은 예산에서 먼저 뺀다
//   · '이번 주 N번 중 M번'. 2주 연속 절반 미만이면 주간결산에서 맞춰 보기를 묻는다(빨간 X·'실패' 같은 말은 쓰지 않는다)
import type { PrepRoutineSuggestion } from '@/modules/encyclopedia/types/encyclopedia'
import type { DayOfWeek, MeasureUnit, Project, Routine, RoutineKind, RoutineMeasure, RoutineRecord, SafetyKey, TimelineSlot, WeekCurriculum } from '../types/career-design'
import { phasesToCurriculum } from '../composables/useHelperExamples'
import { projectEndWeek, projectStartWeek } from '../composables/usePlanTimeline'

export const KIND_LABEL: Record<RoutineKind, string> = { target: '기준 넘기', level: '실력 올리기', keep: '감 유지' }
export const KIND_DESC: Record<RoutineKind, string> = {
  target: '시험 기준이 있고, 시험 날 끝나요',
  level: '녹음·영상으로 나아진 것을 봐요',
  keep: '익힌 감을 잃지 않게 가볍게 이어 가요',
}
export const KINDS: RoutineKind[] = ['target', 'level', 'keep']
export const UNIT_LABEL: Record<MeasureUnit, string> = { time: '시간(분:초)', count: '횟수', number: '숫자', ratio: '푼 수 / 전체', media: '녹음·영상' }
/** 기록 단위 고르기 — 작성 화면과 체력 제안 넣기가 쓴다(거리·무게는 숫자 + 단위, 2026-11-21 진로상담 검토) */
export interface MeasureOption { unit: Exclude<MeasureUnit, 'media' | 'ratio'> | 'media' | 'ratio'; suffix?: string; label: string }
export const MEASURE_OPTIONS: MeasureOption[] = [
  { unit: 'time', label: '시간(분:초)' },
  { unit: 'count', suffix: '회', label: '횟수(회)' },
  { unit: 'number', suffix: 'm', label: '거리(m)' },
  { unit: 'number', suffix: 'cm', label: '거리(cm)' },
  { unit: 'number', suffix: 'kg', label: '무게(kg)' },
  { unit: 'ratio', label: '푼 수 / 전체' },
  { unit: 'number', label: '숫자' },
  { unit: 'media', label: '녹음·영상' },
]
export const optionLabel = (u: { unit: string; suffix?: string }) =>
  MEASURE_OPTIONS.find((o) => o.unit === u.unit && (o.suffix ?? '') === (u.suffix ?? ''))?.label ?? (u.suffix ? `${UNIT_LABEL[u.unit as MeasureUnit]}(${u.suffix})` : UNIT_LABEL[u.unit as MeasureUnit])
// 고정 안전 문구 — 서버 자료(routines.json safety)와 같은 글(2026-11-21 진로상담 검토로 바꿈). 루틴에는 열쇠만 저장한다
export const SAFETY_TEXT: Record<SafetyKey, string> = {
  body: '아프거나 다친 곳이 있으면 쉬어요. 통증이 계속되면 병원 진료를 받아 보세요.',
  voice: '목이 아프거나 쉬면 쉬어요. 쉰 소리가 계속되면 이비인후과 진료를 받아 보세요.',
  start: '운동이 처음이거나 지병이 있으면 시작 전에 상의해요.',
}
/** 안전 문구 열쇠 — 처음엔 문자열 하나였다(목록으로 읽는다) */
export const safetyKeys = (r: Pick<Routine, 'safety'>): SafetyKey[] =>
  (Array.isArray(r.safety) ? r.safety : r.safety ? [r.safety] : []).filter((k): k is SafetyKey => k in SAFETY_TEXT)
/** 기록 방향 — 단위로 정한다(시간은 낮을수록, 나머지는 높을수록) */
export const betterOf = (m: Pick<RoutineMeasure, 'unit'>): 'low' | 'high' | null => (m.unit === 'media' ? null : m.unit === 'time' ? 'low' : 'high')
export const EXAMPLE_NOTE = '예시 · 현직자 검토 전'

const ALL_DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일']
const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5)

/** 주 1회 기록을 재는 루틴인가 — 기준 넘기·실력 올리기에 기록 항목이 있을 때만 */
export const measureOf = (r: Pick<Routine, 'kind' | 'measure'>): RoutineMeasure | null =>
  (r.kind === 'target' || r.kind === 'level') && r.measure ? r.measure : null

/** '월·수·금' / 매일 / 평일 / 주말 */
export function daysSummary(days: DayOfWeek[] | string[] = []): string {
  const d = days as DayOfWeek[]
  if (d.length === 7) return '매일'
  if (d.length === 5 && ALL_DAYS.slice(0, 5).every((x) => d.includes(x))) return '평일'
  if (d.length === 2 && d.includes('토') && d.includes('일')) return '주말'
  return ALL_DAYS.filter((x) => d.includes(x)).join('·')
}

// ── 어느 날 나오나 ──
export interface RoutineDayContext {
  date: string                   // 'YYYY-MM-DD'
  dow: DayOfWeek
  planWeek: number
  projectIds: Set<string>        // 계획에 있는 프로젝트 — 붙은 프로젝트가 지워졌으면 붙지 않은 루틴처럼 둔다
  activeProjectIds: Set<string>  // 그 주에 진행 중인 프로젝트
  courseDay: boolean             // 그날 과정(학교·학원)에 다니는가
}
export function routineOnDay(r: Routine, c: RoutineDayContext): boolean {
  if (!r.days?.includes(c.dow)) return false
  if (r.endedAt && c.date >= r.endedAt) return false
  if (r.pauseWeeks?.includes(c.planWeek)) return false
  if (r.projectId && c.projectIds.has(r.projectId) && !c.activeProjectIds.has(r.projectId)) return false
  // 과정 다니는 날은 기본으로 뺀다(새 루틴은 onCourseDays: false 로 저장). 옛 루틴(칸 없음)은 지금처럼 나온다
  if (r.onCourseDays === false && c.courseDay) return false
  return true
}

/**
 * 목을 쓰는 루틴은 한 번에 하나(2026-11-21 진로상담 검토 — 아나운서 발성·낭독 → 뉴스 낭독, 성우 발성·낭독 → 목소리 연기).
 * 같은 날 둘 이상이 나올 때는 붙은 프로젝트가 먼저 시작한 것만 남긴다 — 앞 프로젝트가 끝나는 주부터 뒤 루틴이 이어받는다.
 * 돌려주는 것 = 그날 빼야 하는 루틴 id
 */
export function voiceOverlap(routines: Routine[], startWeekOf: Map<string, number>, c: Pick<RoutineDayContext, 'date' | 'planWeek' | 'activeProjectIds'>): Set<string> {
  const live = routines.filter((r) => safetyKeys(r).includes('voice') && r.projectId && c.activeProjectIds.has(r.projectId)
    && !(r.endedAt && c.date >= r.endedAt) && !r.pauseWeeks?.includes(c.planWeek))
  if (live.length < 2) return new Set()
  const start = (r: Routine) => startWeekOf.get(r.projectId!) ?? Infinity
  const keep = live.reduce((a, b) => (start(b) < start(a) ? b : a))
  return new Set(live.filter((r) => r !== keep).map((r) => r.id))
}

/** 붙은 프로젝트가 끝났거나 그만뒀는가 — 끝날 때 '감 유지로 바꾸기 / 끝내기'를 한 번 묻는다 */
export function attachedEnded(r: Routine, projects: Project[], timeline: TimelineSlot[], planWeek: number, todayKey: string): Project | null {
  if (!r.projectId || r.endedAt || r.kind === 'keep') return null
  const p = projects.find((x) => x.id === r.projectId)
  if (!p) return null
  if (p.stoppedAt && p.stoppedAt <= todayKey) return p
  const sw = projectStartWeek(timeline, p.id)
  if (sw === null) return null
  return projectEndWeek(sw, p) < planWeek ? p : null
}

/** 붙은 프로젝트가 놓인 주(계획 주차) — '2~11주차' */
export function attachedWeeks(projectId: string | undefined, projects: Project[], timeline: TimelineSlot[]): { from: number; to: number } | null {
  if (!projectId) return null
  const p = projects.find((x) => x.id === projectId)
  const sw = p ? projectStartWeek(timeline, p.id) : null
  return p && sw !== null ? { from: sw, to: projectEndWeek(sw, p) } : null
}

// ── 속도 예산 ──
/**
 * 루틴 시간을 속도 계산에 넣는다(정할 것 5). 붙은 루틴은 그 프로젝트의 시간(routineMin)으로 — 그 기간에만 든다.
 * 붙지 않은 루틴(감 유지·옛 루틴)은 계획 내내 들어 예산에서 먼저 뺀다(freeMin). 끝낸 루틴은 세지 않는다
 */
export function withRoutineLoad(projects: Project[], routines: Routine[] = []): { projects: Project[]; freeMin: number } {
  const ids = new Set(projects.map((p) => p.id))
  const extra = new Map<string, number>()
  let freeMin = 0
  for (const r of routines) {
    if (r.endedAt) continue
    const min = (r.days?.length ?? 0) * (r.duration ?? 0)
    if (r.projectId && ids.has(r.projectId)) extra.set(r.projectId, (extra.get(r.projectId) ?? 0) + min)
    else freeMin += min
  }
  if (!extra.size) return { projects, freeMin }
  return { projects: projects.map((p) => (extra.has(p.id) ? { ...p, routineMin: extra.get(p.id) } : p)), freeMin }
}
/** 붙지 않은 루틴을 뺀 프로젝트 예산(주당 시간). 1시간보다 작아지지 않는다 */
export const budgetHours = (hours: number, freeMin: number) => Math.max(1, Math.round((hours - freeMin / 60) * 10) / 10)
/** 속도 계산이 붙인 routineMin 을 떼어 낸다(타임라인 칸에 남지 않게) */
export function stripLoad(timeline: TimelineSlot[], originals: Project[]): TimelineSlot[] {
  const byId = new Map(originals.map((p) => [p.id, p]))
  return timeline.map((s) => ({ ...s, projects: s.projects.map((p) => byId.get(p.id) ?? withoutLoad(p)) }))
}
function withoutLoad(p: Project): Project {
  if (p.routineMin === undefined) return p
  const { routineMin: _m, ...rest } = p
  void _m
  return rest
}
/** 루틴들의 주당 분(끝낸 것 빼고) */
export const routineWeeklyMin = (routines: Routine[] = []) =>
  routines.filter((r) => !r.endedAt).reduce((n, r) => n + (r.days?.length ?? 0) * (r.duration ?? 0), 0)

// ── 라이브러리 제안 넣기·빼기 ──
/** 프로젝트를 주 1회로 줄일 때의 요일 — 루틴 요일과 겹치지 않는 원래 요일, 없으면 원래 첫 요일 */
function projectDay(original: DayOfWeek[], routineDays: string[]): DayOfWeek {
  return original.find((d) => !routineDays.includes(d)) ?? ALL_DAYS.find((d) => !routineDays.includes(d)) ?? original[0] ?? '토'
}
/**
 * 제안을 넣을 때 그 계획 안의 프로젝트를 주 1회 기록 재기·점검으로 줄인다. 원래 값은 routineBackup 에 둔다(빼면 되돌린다).
 * 커리큘럼 길이는 지금 프로젝트 그대로 — 내 진로상황으로 줄어든 프로젝트(남은 n주)는 뒤에서부터 맞춘다
 */
export function applySuggestion(p: Project, sug: PrepRoutineSuggestion): Project {
  const backup = p.routineBackup ?? { days: [...(p.days ?? [])], duration: p.duration, curriculum: cloneCurriculum(p.curriculum) }
  const full = phasesToCurriculum(sug.project.phases)
  const len = p.curriculum?.length || full.length
  const picked: WeekCurriculum[] = full.length >= len
    ? full.slice(full.length - len)
    : [...full, ...Array.from({ length: len - full.length }, () => full[full.length - 1]!)]
  const curriculum = picked.map((w, i) => ({ week: i + 1, title: w.title, items: [...w.items] }))
  return { ...p, days: [projectDay(backup.days, sug.days)], duration: sug.project.minutesPerSession, curriculum, routineBackup: backup }
}
/** 넣은 루틴을 빼면 프로젝트를 원래대로 */
export function restoreProject(p: Project): Project {
  const b = p.routineBackup
  if (!b) return p
  const { routineBackup: _b, ...rest } = p
  void _b
  return { ...rest, days: [...b.days], duration: b.duration, curriculum: cloneCurriculum(b.curriculum) }
}
function cloneCurriculum(c?: WeekCurriculum[]): WeekCurriculum[] {
  return (c ?? []).map((w) => ({ ...w, items: [...(w.items ?? [])], ...(w.checks ? { checks: [...w.checks] } : {}) }))
}
/** 갈래마다 다른 제안을 고른 갈래로 정한다 — 그 갈래가 null 이면 제안 없음(연주가의 지휘) */
export function suggestionForTrack(sug: PrepRoutineSuggestion, track: string | null): PrepRoutineSuggestion | null {
  const copy: PrepRoutineSuggestion = JSON.parse(JSON.stringify(sug))
  const t = track && sug.tracks && track in sug.tracks ? sug.tracks[track] : undefined
  delete copy.tracks
  if (t === null) return null
  if (!t) return copy
  return {
    ...copy,
    ...(t.name ? { name: t.name } : {}),
    ...(t.measure ? { measure: { ...t.measure } } : {}),
    ...(t.safety ? { safety: [...t.safety], safetyTexts: [...(t.safetyTexts ?? [])] } : {}),
  }
}

/** 제안에서 새 루틴 — choice = 넣을 때 고른 기록 단위(체력) */
export function routineFromSuggestion(sug: PrepRoutineSuggestion, projectId: string, id: string, choice?: { unit: string; suffix?: string } | null): Routine {
  const m = sug.measure
  const unit = (choice?.unit ?? m?.unit) as MeasureUnit | undefined
  const suffix = choice ? choice.suffix : m?.suffix
  return {
    id,
    name: sug.name,
    kind: sug.kind,
    projectId,
    days: ALL_DAYS.filter((d) => sug.days.includes(d)),
    duration: sug.minutes,
    ...(sug.minMinutes ? { minMinutes: sug.minMinutes } : {}),
    ...(sug.minNote ? { minNote: sug.minNote } : {}),
    measure: m && unit ? { label: m.label, unit, better: betterOf({ unit }), ...(suffix ? { suffix } : {}) } : null,
    ...(sug.safety?.length ? { safety: [...sug.safety] } : {}),
    onCourseDays: false,
    memo: '',
  }
}

// ── 프로젝트가 끝날 때 · 맞춰 보기 ──
/** 감 유지로 바꾼 모습 — 주 2번(첫 요일과 사흘 뒤) · 시간 절반 · 기록 재기 없이 · 프로젝트에서 떼어 낸다 */
export function keepVersion(r: Routine): Routine {
  const first = ALL_DAYS.find((d) => r.days?.includes(d)) ?? '월'
  const second = ALL_DAYS[(ALL_DAYS.indexOf(first) + 3) % 7]!
  const days = (r.days?.length ?? 0) <= 2 ? [...(r.days ?? [])] : ALL_DAYS.filter((d) => d === first || d === second)
  const { projectId: _p, ...rest } = r
  void _p
  return { ...rest, kind: 'keep', days, duration: shortened(r), measure: null }
}
/** 시간 줄이기 — 절반(5분 단위), 바쁜 날 최소보다 작아지지 않게 */
export const shortened = (r: Pick<Routine, 'duration' | 'minMinutes'>) => Math.max(r.minMinutes ?? 10, round5((r.duration ?? 30) / 2))

export interface WeekCount { planned: number; done: number }
/** 2주 연속 절반 미만인가 — 주간결산이 맞춰 보기를 묻는다 */
export const twoWeeksLow = (cur: WeekCount, prev: WeekCount | null) =>
  !!prev && cur.planned > 0 && prev.planned > 0 && cur.done * 2 < cur.planned && prev.done * 2 < prev.planned

// ── 주 1회 기록 ──
/** 분:초 · 42개 · 250m · 3/4 · 했어요 */
export function formatMeasure(value: number | null | undefined, m: RoutineMeasure, total?: number): string {
  if (m.unit === 'media') return value === null || value === undefined ? '했어요' : String(value)
  if (value === null || value === undefined) return '-'
  if (m.unit === 'ratio') return total ? `${value}/${total}` : String(value)
  if (m.unit === 'time') {
    const s = Math.round(value)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }
  const n = Number.isInteger(value) ? String(value) : value.toFixed(1)
  return `${n}${m.suffix ?? (m.unit === 'count' ? '회' : '')}`
}
/** 시간 입력(분·초) → 초. 잘못되면 null */
export function timeFromParts(min: string | number, sec: string | number): number | null {
  const m = Number(min || 0)
  const s = Number(sec || 0)
  if (!Number.isFinite(m) || !Number.isFinite(s) || m < 0 || s < 0 || s >= 60) return null
  const total = Math.round(m * 60 + s)
  return total > 0 ? total : null
}
const better = (m: RoutineMeasure) => betterOf(m)
/** 받침에 맞춘 '과/와' — '체력시험 준비’와 함께' */
export function josaWa(w: string): string {
  const t = w.replace(/[^가-힣A-Za-z0-9]+$/, '')
  const c = t.charCodeAt(t.length - 1) - 0xac00
  return c < 0 || c > 11171 ? '와(과)' : c % 28 ? '과' : '와'
}
/** 받침에 맞춘 '이/가' */
function josaIGa(w: string): string {
  const c = w.charCodeAt(w.length - 1) - 0xac00
  return c < 0 || c > 11171 ? '이(가)' : c % 28 ? '이' : '가'
}
/**
 * 주간결산의 추이 — 최근 기록(값 있는 것) 몇 주와 한 줄. 잘했다·못했다가 아니라 방향과 '낮을수록 좋아요'만 말한다
 *   '대표 종목 기록이 줄고 있어요 · 낮을수록 좋아요'
 */
export function measureTrend(records: RoutineRecord[] = [], m: RoutineMeasure, upToWeek?: number, last = 4): { points: RoutineRecord[]; line: string } {
  const points = records
    .filter((r) => (upToWeek === undefined || r.week <= upToWeek) && (m.unit === 'media' || typeof r.value === 'number'))
    .sort((a, b) => a.week - b.week)
    .slice(-last)
  if (m.unit === 'media') return { points, line: points.length ? `${points.length}주 남겼어요` : '' }
  if (points.length < 2) return { points, line: points.length ? '다음 주 기록과 비교해 볼 수 있어요' : '' }
  // 푼 수 / 전체는 비율로 비교한다(테스트마다 문제 수가 다르다)
  const val = (p: RoutineRecord) => (m.unit === 'ratio' && p.total ? p.value! / p.total : p.value!)
  const a = val(points[points.length - 2]!)
  const b = val(points[points.length - 1]!)
  const dir = b < a ? '줄고 있어요' : b > a ? '늘고 있어요' : '그대로예요'
  const hint = better(m) === 'low' ? '낮을수록 좋아요' : '높을수록 좋아요'
  return { points, line: `${m.label}${josaIGa(m.label)} ${dir} · ${hint}` }
}
export const recordOfWeek = (r: Routine, week: number) => r.records?.find((x) => x.week === week) ?? null

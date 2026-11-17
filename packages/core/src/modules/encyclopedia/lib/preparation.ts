// 진로백과 준비과정 탭의 계산(2026-11-15) — 화면과 무관한 순수 함수만 둔다.
// 자료는 서버(진로계획 라이브러리)가 갈래별로 순서까지 풀어서 준다. 여기서는 고르고 글자로 바꾸기만 한다.
import type { JobPreparation, PrepChecked, PrepItem, PrepPath, PrepProject, PrepStatSource, PrepSum } from '../types/encyclopedia'

export interface PrepStep {
  key: string            // 펼침 상태를 기억하는 열쇠 — 프로젝트 id + 순서. 갈래를 바꿔도 공통 항목은 같은 열쇠라 열린 채로 남는다
  no: number             // 화면에 보이는 순서(1부터)
  item: PrepItem
  project: PrepProject
}

/** 고른 갈래의 길. 갈래가 없는 계획은 하나뿐인 길을 준다 */
export function pathOf(prep: JobPreparation, track: string | null): PrepPath | null {
  return prep.paths.find((p) => p.track === track) ?? prep.paths[0] ?? null
}

/** 길을 화면용 걸음으로 — 프로젝트를 붙이고 1부터 번호를 매긴다(서버의 step 은 건너뛰는 번호가 있다) */
export function stepsOf(prep: JobPreparation, path: PrepPath | null): PrepStep[] {
  if (!path) return []
  const out: PrepStep[] = []
  for (const item of path.items) {
    const project = prep.projects[item.ref]
    if (!project) continue
    // 같은 프로젝트가 한 길에 두 번 나올 수 있다(예: 대외활동 — 공통 하나, 갈래 하나) → 순서까지 붙여 구분한다
    out.push({ key: `${item.ref}@${item.step}`, no: out.length + 1, item, project })
  }
  return out
}

const WEEKS_PER_MONTH = 4.345

/**
 * 주 수를 읽기 쉬운 기간으로. 짧으면 주, 길면 달·해로 바꾼다.
 *   8 → '8주' · 24 → '약 6개월' · 108 → '약 2년 1개월'
 */
export function formatWeeks(weeks: number): string {
  const w = Math.max(0, Math.round(weeks))
  if (w <= 12) return `${w}주`
  const months = Math.round(w / WEEKS_PER_MONTH)
  if (months < 24) return `약 ${months}개월`
  const years = Math.floor(months / 12)
  const rest = months % 12
  return rest ? `약 ${years}년 ${rest}개월` : `약 ${years}년`
}

/** 한 번에 하는 시간 — 60 → '1시간' · 90 → '1시간 30분' · 45 → '45분' */
export function formatMinutes(min: number): string {
  if (min < 60) return `${min}분`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}시간 ${m}분` : `${h}시간`
}

const CHECK_LEVEL: Record<NonNullable<PrepChecked['level']>, string> = {
  law: '법령 원문과 대조',
  official: '기관 공고와 대조',
  secondary: '안내 자료와 대조',
}
export const checkLevelLabel = (c?: PrepChecked | null) => (c?.level && CHECK_LEVEL[c.level]) || '출처와 대조'

/**
 * 차례로 할 때의 주 수 — 서버가 주는 totals 와 같은 규칙(2026-11-16). 진로설계 템플릿이 '이미 있어요'로 뺀 뒤 다시 셀 때 쓴다.
 *   · 선택 항목은 세지 않는다
 *   · 과정 걸음(대학·대학원·수련) 뒤의 '과정 중에' 걸음은 그 과정이 들어 있으면 세지 않는다 — 과정 기간에 이미 들어 있다
 * rows 는 길 전체(순서대로), include 는 이 대상이 하는 걸음인지(전공자는 major 만).
 */
export function sumWeeks<T extends { item: Pick<PrepItem, 'optional' | 'during'>; project: Pick<PrepProject, 'weeks' | 'course'> }>(
  rows: T[],
  include: (row: T) => boolean = () => true,
): Required<Pick<PrepSum, 'count' | 'weeks' | 'courseWeeks'>> {
  let count = 0
  let weeks = 0
  let courseWeeks = 0
  let ownerIn = false          // 바로 앞의 필수 과정 걸음이 이 대상에게 들어 있는가
  for (const row of rows) {
    const { item, project } = row
    if (project.course) ownerIn = !item.optional && include(row)
    if (item.optional || !include(row)) continue
    count += 1
    if (project.course) { weeks += project.weeks; courseWeeks += project.weeks }
    else if (!(item.during && ownerIn)) weeks += project.weeks
  }
  return { count, weeks, courseWeeks }
}

/** 전공자에게 줄어드는 것이 있는 길인가(없으면 전공자 줄을 보여 주지 않는다) */
export const hasMajorSkip = (path: PrepPath | null) =>
  !!path && path.totals.major.count < path.totals.nonMajor.count

// ── 두 칸(2026-11-17, 정할 것 2·3 — workspace decisions/2026-11-17-duration-exam-plan.md) ──
// 맨 위 기간을 '스스로 준비'(낼 수 있는 시간에 따라 길어지고 짧아지는 것)와 '과정'(다니는 기간 — 속도와 상관없음)으로 나눈다.
// 과정 = '과정' 꼬리표 걸음 전부(학교·수련 course + 프로젝트 종류 '과정' period). 과정 안에서 하는 걸음(during)은 센다만 하고 더하지 않는다.
// 서버 totals 의 selfWeeks·periodWeeks·duringCount·selfWeeksPart 와 같은 규칙이다(weeks = selfWeeks + periodWeeks — sumWeeks 와 같다).
// 큰 시험(studyHours)이 있으면 그 시험을 '일·학업과 함께'(하루 3시간·주 6일)로 할 때의 스스로 준비 주 수(selfWeeksPart)도 준다.
export const FULL_TIME_HOURS = 48     // 전업: 하루 8시간 · 주 6일 — 자료의 시험 주 수가 이 기준이다
export const PART_TIME_HOURS = 18     // 일·학업과 함께: 하루 3시간 · 주 6일

export interface PrepParts {
  count: number
  weeks: number
  courseWeeks: number
  selfWeeks: number
  periodWeeks: number
  duringCount: number
  examHours: number       // 0 = 큰 시험 없음
  selfWeeksPart: number   // 큰 시험을 하루 3시간으로 할 때(없으면 selfWeeks 와 같다)
  selfCount: number       // 스스로 준비 걸음 수
  periodCount: number     // 과정 걸음 수
}

export function sumParts<T extends { item: Pick<PrepItem, 'optional' | 'during'>; project: Pick<PrepProject, 'weeks' | 'course' | 'period' | 'studyHours'> }>(
  rows: T[],
  include: (row: T) => boolean = () => true,
): PrepParts {
  const out: PrepParts = { count: 0, weeks: 0, courseWeeks: 0, selfWeeks: 0, periodWeeks: 0, duringCount: 0, examHours: 0, selfWeeksPart: 0, selfCount: 0, periodCount: 0 }
  let ownerIn = false
  let examWeeks = 0
  let partWeeks = 0
  for (const row of rows) {
    const { item, project } = row
    if (project.course) ownerIn = !item.optional && include(row)
    if (item.optional || !include(row)) continue
    out.count += 1
    if (project.course) { out.weeks += project.weeks; out.courseWeeks += project.weeks; out.periodWeeks += project.weeks; out.periodCount += 1 }
    else if (item.during && ownerIn) out.duringCount += 1
    else if (project.period) { out.weeks += project.weeks; out.periodWeeks += project.weeks; out.periodCount += 1 }
    else {
      out.weeks += project.weeks; out.selfWeeks += project.weeks; out.selfCount += 1
      const h = project.studyHours ?? 0
      if (h > 0) { examWeeks += project.weeks; out.examHours += h; partWeeks += Math.ceil(h / PART_TIME_HOURS) }
    }
  }
  out.selfWeeksPart = out.selfWeeks - examWeeks + partWeeks
  return out
}

/** 공부 총량을 읽기 쉽게 — 2496 → '약 2,500시간' */
export function formatStudyHours(h: number): string {
  const r = Math.round(h / 100) * 100
  return `약 ${String(r).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}시간`
}

/** '약 12개월' + (으)로 — 받침이 없거나 ㄹ 받침이면 '로' */
export function josaRo(s: string): string {
  const c = s.charCodeAt(s.length - 1)
  if (c < 0xac00 || c > 0xd7a3) return '로'
  const jong = (c - 0xac00) % 28
  return jong === 0 || jong === 8 ? '로' : '으로'
}

/**
 * 전업 기준 분량을 '약' 없이 — 주 × 12 ÷ 52 를 반올림한 개월(검토 11-17 C3).
 *   52 → '1년' · 78 → '1년 6개월' · 39 → '9개월' · 26 → '6개월' · 65 → '1년 3개월'
 */
export function formatFullTime(weeks: number): string {
  const m = Math.max(1, Math.round((weeks * 12) / 52))
  const y = Math.floor(m / 12)
  const r = m % 12
  return y && r ? `${y}년 ${r}개월` : y ? `${y}년` : `${r}개월`
}

/**
 * 합격자 수치의 출처 한 줄(검토 11-17 C7) — '출처 · 제목(게재처) · 매체 날짜 보도로 확인 · 확인 날짜 확인'.
 * via 의 기사 제목은 그리지 않는다(시안이 쓰지 않기로 한 숫자 '하루 10시간'이 들어 있다) — 「 앞의 매체·날짜만 쓴다
 */
export function statSourceLine(src: PrepStatSource | null | undefined): string {
  if (!src?.title) return ''
  const parts = ['출처', src.title]
  if (src.via) {
    const outlet = src.via.split('「')[0]!.trim()
    if (outlet) parts.push(`${outlet} 보도로 확인`)
  } else if (src.level === 'abstract') parts.push('논문 초록으로 확인')
  if (src.checkedAt) parts.push(`${src.checkedAt} 확인`)
  return parts.join(' · ')
}

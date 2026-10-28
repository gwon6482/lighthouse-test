// 진로달성 메인·로드맵이 같이 쓰는 계산(2026-10-28) — 화면과 무관한 순수 함수만 둔다.
// 화면 연결은 composables/usePlanBoard.ts.
import type { DayOfWeek, Project, ProjectCategory } from '@/modules/career-design/types/career-design'
import { weekEntriesOf } from '@/modules/career-design/composables/useProjectCurriculum'

// 분류 색·라벨 — ⚠️ 같은 표가 여러 화면에 복제돼 있다(실무경험 추가 때 18곳). 새 화면은 여기 것을 쓴다
export const CATEGORY_META: Record<ProjectCategory, { label: string; color: string }> = {
  qualification: { label: '자격요건',   color: '#1DB95A' },
  knowledge:     { label: '분야지식',   color: '#F47820' },
  skill:         { label: '직무기술',   color: '#A855F7' },
  portfolio:     { label: '포트폴리오', color: '#4480F5' },
  experience:    { label: '실무경험',   color: '#F0507E' },
}
export const categoryColor = (c?: ProjectCategory) => (c && CATEGORY_META[c]?.color) || '#AAAAAA'
export const categoryLabel = (c?: ProjectCategory) => (c && CATEGORY_META[c]?.label) || ''

// 을/를 — 마지막 글자 받침으로(한글이 아니면 '을(를)')
export function objectJosa(w: string): string {
  const c = w.trim().slice(-1).charCodeAt(0) - 0xac00
  if (Number.isNaN(c) || c < 0 || c > 11171) return '을(를)'
  return c % 28 ? '을' : '를'
}

const MS_PER_DAY = 86_400_000
const midnight = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }

// 'YYYY-MM-DD' / 'YYYY.MM.DD' / 'YYYY-MM' / 'YYYY년 M월' — 일이 없으면 그 달 1일
export function parsePlanDate(s: string | undefined): Date | null {
  if (!s) return null
  const ymd = s.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})/)
  if (ymd) return new Date(+ymd[1]!, +ymd[2]! - 1, +ymd[3]!)
  const ym = s.match(/^(\d{4})[-./](\d{1,2})/) ?? s.match(/(\d{4})\s*년\s*(\d{1,2})\s*월/)
  if (ym) return new Date(+ym[1]!, +ym[2]! - 1, 1)
  return null
}

// b - a (날짜 단위)
export const daysBetween = (a: Date, b: Date) => Math.round((midnight(b).getTime() - midnight(a).getTime()) / MS_PER_DAY)

export type PlanPhase = 'before' | 'running' | 'finished'
export function planPhase(startDate: string, endDate: string, today: Date): PlanPhase {
  const s = parsePlanDate(startDate)
  const e = parsePlanDate(endDate)
  if (s && daysBetween(s, today) < 0) return 'before'
  if (e && daysBetween(e, today) > 0) return 'finished'
  return 'running'
}

// 계획 N일차(시작일 = 1일차). 시작 전이면 null
export function planDayNumber(startDate: string, today: Date): number | null {
  const s = parsePlanDate(startDate)
  if (!s) return null
  const n = daysBetween(s, today) + 1
  return n < 1 ? null : n
}

// ① '완료까지' 칸 — 끝난 뒤는 '계획 완료'만(다음 계획 유도 없음, 사용자 결정 2026-10-28)
export function dDayLabel(endDate: string, today: Date): string {
  const e = parsePlanDate(endDate)
  if (!e) return '-'
  const left = daysBetween(today, e)
  if (left < 0) return '계획 완료'
  if (left === 0) return 'D-Day'
  return `D-${left}`
}

// ① 전체 진행 = 완료한 커리큘럼 항목 ÷ 전체 항목(사용자 결정 (a): 지난 기간이 아니라 해낸 양)
export function overallProgress(
  projects: Pick<Project, 'id' | 'curriculum'>[],
  isItemDone: (projectId: string, week: number, idx: number) => boolean,
): { done: number; total: number; percent: number } {
  let done = 0
  let total = 0
  for (const p of projects) {
    for (const cw of p.curriculum ?? []) {
      const n = weekEntriesOf(cw).length
      total += n
      for (let i = 0; i < n; i++) if (isItemDone(p.id, cw.week, i)) done++
    }
  }
  return { done, total, percent: total ? Math.floor((done / total) * 100) : 0 }
}

// 연속 달성 — 오늘부터 거슬러 올라가며 '계획된 일을 다 한 날'을 센다.
// 할 일 없는 날은 건너뛴다(끊지도 늘리지도 않음). 오늘은 아직 안 끝났어도 끊지 않는다.
export function streakCount(
  today: Date, startDate: string,
  planned: (d: Date) => number, done: (d: Date) => number,
): number {
  const start = parsePlanDate(startDate)
  if (!start) return 0
  const cursor = midnight(today)
  let streak = 0
  let isToday = true
  while (cursor.getTime() >= start.getTime()) {
    const p = planned(cursor)
    if (p > 0) {
      if (done(cursor) >= p) streak++
      else if (!isToday) break
    }
    isToday = false
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// ⑤ 결산 배지 — 결산 요일까지 남은 날. 요일이 없거나 계획 중이 아니면 null
const DOW: DayOfWeek[] = ['일', '월', '화', '수', '목', '금', '토']
export function reviewBadge(
  reviewDay: DayOfWeek | '', today: Date, phase: PlanPhase,
): { kind: 'today' } | { kind: 'left'; days: number } | null {
  if (!reviewDay || phase !== 'running') return null
  const target = DOW.indexOf(reviewDay)
  if (target < 0) return null
  const left = (target - today.getDay() + 7) % 7
  return left === 0 ? { kind: 'today' } : { kind: 'left', days: left }
}

// ② 오늘 상태 문장 — 응원형, 놓친 일을 탓하지 않는다(사용자 결정)
export function todayMessage(o: { phase: PlanPhase; startDate: string; total: number; done: number }): string {
  if (o.phase === 'finished') return '계획을 모두 마쳤어요!'
  if (o.phase === 'before') {
    const s = parsePlanDate(o.startDate)
    return s ? `${s.getMonth() + 1}월 ${s.getDate()}일에 출발해요` : '곧 출발해요'
  }
  if (o.total === 0) return '오늘은 쉬어 가는 날이에요'
  if (o.done >= o.total) return '오늘도 해냈어요!'
  if (o.done === 0) return `오늘 할 일 ${o.total}개, 시작해 볼까요?`
  return `${o.total - o.done}개만 더 하면 돼요!`
}

// ② 큰 줄 — '간호사를 향해 23일차' / 시작 전·완료 후는 '간호사를 향해'까지만
export function journeyHeadline(targetJob: string, phase: PlanPhase, day: number | null): string {
  const job = targetJob.trim()
  const head = job ? `${job}${objectJosa(job)} 향해` : '목표를 향해'
  return phase === 'running' && day ? `${head} ${day}일차` : head
}

// 진행 속도(한 주에 낼 수 있는 시간) — 타임라인 자동 배치의 기준.
//
// 흐름(2026-10-22 사용자): ① 속도 고르기(생활 모습 카드) + 순서 확인 → ③ 완성된 타임라인을 보고 세부 조정.
//   숫자를 계산하게 하지 않고 "어떤 생활이면 언제 끝나는지"를 보고 고르게 한다.
// ⚠️ 주당 시간 값(5·8·12·16·24)은 데이터 근거 없이 정한 출발값이다(생활 모습 설명에 맞춘 대략치). 사용 데이터로 다듬을 것.
import type { Project, TimelineSlot } from '../types/career-design'
import { autoSchedule, projectEndWeek, weekDateRange, type WeekStart } from './usePlanTimeline'

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

// 올인은 하루 시간을 직접 고른다(2026-10-22 사용자). 주 시간 = 하루 × 6(하루는 쉰다고 본다). 동시 진행 상한은 두지 않음(사용자 결정)
export const ALLIN_DAYS_PER_WEEK = 6
export const ALLIN_DAILY = { min: 3, max: 10, default: 4 }
export const allinWeeklyHours = (daily: number) => daily * ALLIN_DAYS_PER_WEEK

export const paceByKey = (key?: string) => PACES.find((p) => p.key === key)
// 예전 임시 계획처럼 속도 키 없이 시간만 있는 경우: 정해진 값이면 그 카드, 아니면(올인 하루 시간 조절값) 올인
export const paceOfHours = (h?: number) => (h == null ? undefined : PACES.find((p) => p.hours === h) ?? paceByKey('allin'))

/** 자동 배치 결과를 타임라인 슬롯으로 */
export function buildTimeline(projects: Project[], hours: number): TimelineSlot[] {
  const slots: TimelineSlot[] = []
  for (const { week, project } of autoSchedule(projects, hours)) {
    let slot = slots.find((s) => s.week === week)
    if (!slot) { slot = { week, projects: [] }; slots.push(slot) }
    slot.projects.push(project)
  }
  return slots.sort((a, b) => a.week - b.week)
}

/** 그 속도로 배치하면 몇 주차에 끝나는가 */
export function scheduleEndWeek(projects: Project[], hours: number): number {
  return autoSchedule(projects, hours).reduce((m, { week, project }) => Math.max(m, projectEndWeek(week, project)), 0)
}

/** "2027년 6월" — 시작일 기준 그 주차의 마지막 날이 속한 달 */
export function monthLabelOfWeek(startDate: string, week: number, start?: WeekStart): string {
  const end = weekDateRange(startDate, week, start)?.end
  if (!end) return ''
  const [y, m] = end.split('-')
  return `${y}년 ${Number(m)}월`
}

/** "약 13개월" */
export const monthsLabel = (weeks: number) => `약 ${Math.max(1, Math.round(weeks / 4.33))}개월`

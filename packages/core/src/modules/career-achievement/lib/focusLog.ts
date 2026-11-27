// 로그·주간결산의 '쌓은 시간'과 기록 카드(2026-11-26 집중모드 넓히기 — 시안 reviews/2026-11-26-focus-anywhere, 오너 결정 3·6)
// 화면과 무관한 계산만(시험: __tests__/focusLog.spec.ts)
//
// 규칙
// - 카드 = 기록 화면에서 저장한 것(doneAt 있음): 프로젝트 · 집중으로 남긴 루틴 · 바로 집중. '완료'만 누른 루틴은 기록이 아니다(doneAt 없음)
// - 시간: 프로젝트는 집중한 시간, 없으면 계획 시간(지금 그대로). 루틴·바로 집중은 집중한 시간만(하지 않은 시간을 섞지 않게)
// - 바로 집중은 완료가 아니다 — 오늘 할 일 수·링·연속 달성·전체 진행·주간 % 에는 넣지 않는다(이 파일은 시간과 카드만 센다)
import { durationLabel } from './focusTimer'

export type LogItemType = 'project' | 'routine' | 'free'
export interface LogEntryLike {
  itemType: LogItemType
  itemName: string
  elapsedSec: number
  duration: number
  date: string
}

export const FREE_LABEL = '바로 집중'

/** 한 기록의 분(소수 그대로 — 합계에서 반올림) */
export function entryMinutes(e: Pick<LogEntryLike, 'itemType' | 'elapsedSec' | 'duration'>): number {
  const sec = Number(e.elapsedSec) > 0 ? Number(e.elapsedSec) : 0
  if (e.itemType === 'project') return sec ? sec / 60 : Math.max(0, Number(e.duration) || 0)
  return sec / 60
}

export interface MinutesByKind { project: number; routine: number; free: number; total: number }
export function minutesByKind(list: readonly Pick<LogEntryLike, 'itemType' | 'elapsedSec' | 'duration'>[]): MinutesByKind {
  const out: MinutesByKind = { project: 0, routine: 0, free: 0, total: 0 }
  for (const e of list) {
    const m = entryMinutes(e)
    if (e.itemType === 'routine') out.routine += m
    else if (e.itemType === 'free') out.free += m
    else out.project += m
    out.total += m
  }
  return out
}

const KIND_LABEL: Record<LogItemType, string> = { project: '프로젝트', routine: '루틴', free: FREE_LABEL }
/** 주간결산 '쌓은 시간' 아래 한 줄 — 둘 이상 있을 때만(오너 결정 6). '프로젝트 5시간 40분 · 루틴 1시간 58분 · 바로 집중 42분' */
export function minutesSplitLine(by: MinutesByKind): string | null {
  const parts = (['project', 'routine', 'free'] as const)
    .filter((k) => Math.round(by[k]) >= 1)
    .map((k) => `${KIND_LABEL[k]} ${durationLabel(by[k] * 60)}`)
  return parts.length >= 2 ? parts.join(' · ') : null
}

/** 카드 이름 — 바로 집중은 적은 한 줄, 비웠으면 '바로 집중' */
export function cardName(e: Pick<LogEntryLike, 'itemType' | 'itemName'>): string {
  const n = (e.itemName ?? '').trim()
  if (e.itemType === 'free') return n || FREE_LABEL
  return n || (e.itemType === 'routine' ? '루틴' : '프로젝트')
}

// 끝낸 줄을 누르면(#101, 2026-11-26 오너 '(다) 작은 메뉴' — 시안 workspace reviews/2026-11-26-achievement-home-add-undo.html 정할 것 7·8).
// 화면과 무관한 계산만 여기(시험: __tests__/undoDone.spec.ts). 화면 연결은 usePlanBoard(undo*)·CareerAchievementPage.
//
// 규칙
// - 메뉴(기록 보기 · 다시 집중하기 · 완료 취소)는 '기록이 있는 끝낸 줄'에 연다. 종류(프로젝트·루틴)로 가르지 않는다 —
//   집중으로 끝낸 루틴(집중모드 넓히기 #95·#96)도 기록이 생기면 같은 메뉴를 쓴다. 지금은 프로젝트(진도) 줄이 여기에 든다
// - 기록 없이 '완료'만 누른 루틴·과정 줄은 지금처럼 바로 취소하고 '되돌렸어요 · 다시 완료' 알림을 3초
// - 완료 취소는 기록을 지우고(서버 동작 그대로) 그 주 할 일 체크도 한 칸 되돌린다 — 체크된 **마지막** 칸.
//   완료할 때 '안 한 첫 칸'을 체크하므로(CompletePage.advanceProjectCurriculum) 반대 순서다. 손으로 체크한 칸이 있으면 다른 칸이 풀릴 수 있다
// - 미리 하기로 당겨 온 칸(note ahead:<원래 날짜>)은 원래 요일이 아직 안 지났으면(오늘 뒤, 같은 주) 그 요일로 돌려놓는다. 지났으면 오늘에 둔다
import { aheadFromNote } from './pullAhead'

export interface DoneRowLike { type: 'project' | 'routine' | 'period' }
/** 메뉴를 여는 줄인가 — 기록이 있거나 집중으로 하는 프로젝트(진도) 줄 */
export const opensDoneMenu = (row: DoneRowLike, hasRecord: boolean) => row.type === 'project' || hasRecord

/** 그 주 할 일 중 체크된 마지막 칸(없으면 -1) */
export function lastCheckedIndex(n: number, isDone: (idx: number) => boolean): number {
  for (let i = n - 1; i >= 0; i -= 1) if (isDone(i)) return i
  return -1
}

export interface UndoItem { id?: string; itemType: 'project' | 'routine'; itemId: string; date: string; note?: string; curriculumWeek?: number | null }
/**
 * 미리 하기로 당겨 온 칸을 원래 요일로 — 오늘(today) 칸 가운데 그 프로젝트의 ahead 칸이 있고, 원래 날짜가 오늘 뒤 ~ 주 끝(weekEnd)일 때만.
 * 그 요일에 이미 그 프로젝트 칸이 있으면(그사이 일정이 다시 만들어짐) 오늘 칸만 지운다. 바꿀 것이 없으면 null
 */
export function moveAheadBack<T extends UndoItem>(items: T[], o: { itemId: string; today: string; weekEnd: string }): { items: T[]; to: string } | null {
  const i = items.findIndex((it) => it.itemType === 'project' && it.itemId === o.itemId && it.date === o.today && aheadFromNote(it.note))
  if (i < 0) return null
  const from = aheadFromNote(items[i]!.note)!
  if (!(from > o.today) || from > o.weekEnd) return null
  if (items.some((it) => it.itemType === 'project' && it.itemId === o.itemId && it.date === from)) {
    return { items: items.filter((_, k) => k !== i), to: from }
  }
  const next = items.slice()
  next[i] = { ...items[i]!, date: from, note: '' }
  return { items: next, to: from }
}

/** 확인 판의 '지워지는 것' 한 줄 — '48분 기록과 사진·메모가 지워져요'. 지울 것이 없으면 '' */
const SUBJECT: Record<string, string> = { '사진·메모': '사진·메모가', '사진': '사진이', '메모': '메모가' }
export function lossLine(o: { minutes: number; photo: boolean; note: boolean }, timeLabel: (min: number) => string): string {
  const extra = o.photo && o.note ? '사진·메모' : o.photo ? '사진' : o.note ? '메모' : ''
  if (o.minutes > 0) return `${timeLabel(o.minutes)} 기록${extra ? `과 ${SUBJECT[extra]}` : '이'} 지워져요`
  return extra ? `${SUBJECT[extra]} 지워져요` : ''
}

/** 확인 판 머리 아래 한 줄 — '오늘 · 48분 · 사진·메모 있음' */
export function recordSummary(o: { minutes: number; photo: boolean; note: boolean }, timeLabel: (min: number) => string): string {
  const parts = ['오늘']
  if (o.minutes > 0) parts.push(timeLabel(o.minutes))
  const extra = o.photo && o.note ? '사진·메모' : o.photo ? '사진' : o.note ? '메모' : ''
  if (extra) parts.push(`${extra} 있음`)
  return parts.join(' · ')
}

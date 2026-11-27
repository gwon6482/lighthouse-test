// 앱의 하루(2026-11-26, 업무 보드 #102 '하루 시작 시간').
//
// 앱의 '오늘'은 달력의 자정이 아니라 **하루 시작 시각**에 바뀐다(기본 새벽 4시, 마이페이지에서 0~6시로 바꿈).
// 예: 하루 시작이 새벽 4시면 목요일 새벽 1시는 아직 수요일의 하루다. 홈의 할 일·완료 기록 날짜·주의 경계·
// 주간결산이 뜨는 때·시험일 D-day·날짜로 정한 프로젝트의 마감이 모두 이 하루를 따른다.
// 실제 달력을 그대로 쓰는 곳: 채용 공고 마감·검사 결과 내보내기 날짜·휴지통(오너 2026-11-26 정할 것 5).
//
// 이 파일은 순수 계산만 둔다. 화면이 쓰는 '오늘'은 dev-date.ts 의 getToday()·getTodayKey().
// ⚠️ 정본·사본: 이 파일이 정본이고 서버 lighthouse-api `services/appDay.js` 가 사본이다
//    (서버는 계획을 고칠 때 '이번 주 이후 일정'을 지우는 데 같은 하루를 쓴다 — services/scheduleReset.js).
//    기본값·고를 수 있는 값·규칙을 바꾸면 서버도 바꾸고 서버 `scripts/check-method-sync.js` 를 돌린다.
//
// 규칙 모양(계정 설정 user.settings.dayStart — 고른 적이 없으면 비어 있고 기본값을 쓴다)
//   { hour: 0~6, from: 'YYYY-MM-DD', since: ISO 시각 }
//   바꾼 시각은 **다음 하루부터**(오너 2026-11-26). 바꾸는 순간의 하루 D 가 끝나는 시각(since)까지는 D,
//   그 뒤로는 새 시각으로 세되 from(=D 다음 날)보다 앞으로 돌아가지 않는다. from·since 는 서버가 정한다.

/** 하루 시작 시각(시) — 아무것도 정하지 않은 계정의 값 */
export const DEFAULT_DAY_START_HOUR = 4
/** 고를 수 있는 하루 시작 시각 — 자정과 새벽 1~6시 */
export const DAY_START_HOURS = [0, 1, 2, 3, 4, 5, 6]

export interface DayStartRule {
  hour?: number
  from?: string
  since?: string | Date
}

const HOUR_MS = 3_600_000
const DAY_MS = 24 * HOUR_MS
const KEY_RE = /^\d{4}-\d{2}-\d{2}$/

/** 'YYYY-MM-DD'(기기 현지 달력) */
export function dateKeyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 'YYYY-MM-DD' → 그 날 00:00(기기 현지) */
export function dateOfKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y!, m! - 1, d!)
}

function addDaysKey(key: string, n: number): string {
  const d = dateOfKey(key)
  d.setDate(d.getDate() + n)
  return dateKeyOf(d)
}

const validHour = (h: unknown): h is number => typeof h === 'number' && DAY_START_HOURS.includes(h)

/** 규칙의 하루 시작 시각(바꾸는 중이면 새 시각) — 없거나 잘못된 값이면 기본값 */
export function dayStartHourOf(rule: DayStartRule | number | null | undefined): number {
  const h = typeof rule === 'number' ? rule : rule?.hour
  return validHour(h) ? h : DEFAULT_DAY_START_HOUR
}

/**
 * 지금 시각 `now` 를 하루 시작 시각만큼 뒤로 민 시각 — 그 달력 날짜가 앱의 하루다(바꾸는 중인 규칙은 appDayKeyOf).
 * 돌려주는 Date 는 시각이 붙어 있다(받는 쪽이 자정으로 맞춘다).
 */
export function appDayOf(now: Date, hour: number = DEFAULT_DAY_START_HOUR): Date {
  return hour ? new Date(now.getTime() - hour * HOUR_MS) : new Date(now.getTime())
}

/** 지금 시각이 어느 날의 하루인가('YYYY-MM-DD'). rule: 계정 설정 settings.dayStart(또는 시각 숫자, 없으면 기본값) */
export function appDayKeyOf(now: Date, rule?: DayStartRule | number | null): string {
  const hour = dayStartHourOf(rule)
  const plain = dateKeyOf(appDayOf(now, hour))
  if (typeof rule !== 'object' || !rule?.from || !rule.since || !KEY_RE.test(rule.from)) return plain
  const since = new Date(rule.since).getTime()
  if (Number.isNaN(since)) return plain
  const left = since - now.getTime()
  if (left > 2 * DAY_MS) return plain // 이틀 넘게 남았다면 잘못된 값(기기 시계 등) — 바꾸기를 무시한다
  if (left > 0) return addDaysKey(rule.from, -1) // 바꾸기 전 하루가 아직 안 끝났다 — 그 하루(from 전날)
  return plain < rule.from ? rule.from : plain // 새 시각으로 세되 from 보다 앞으로 돌아가지 않는다
}

/** 바꾼 시각이 아직 적용 전인가(다음 하루부터) */
export function dayStartPending(rule: DayStartRule | null | undefined, now: Date): boolean {
  if (!rule?.since || !rule.from) return false
  const left = new Date(rule.since).getTime() - now.getTime()
  return left > 0 && left <= 2 * DAY_MS
}

/** 화면 이름 — 0 '자정', 그 밖 '새벽 N시' */
export function dayStartLabel(hour: number): string {
  return hour === 0 ? '자정' : `새벽 ${hour}시`
}

const DOW = ['일', '월', '화', '수', '목', '금', '토']
/**
 * 달력은 이미 다음 날인데 앱은 아직 전날의 하루일 때(자정 ~ 하루 시작 시각) 홈에 보일 한 줄. 아니면 ''.
 * 예: '아직 11월 25일(수)의 하루예요'
 */
export function carriedOverLine(appKey: string, calendarKey: string): string {
  if (!KEY_RE.test(appKey) || !(appKey < calendarKey)) return ''
  const d = dateOfKey(appKey)
  return `아직 ${d.getMonth() + 1}월 ${d.getDate()}일(${DOW[d.getDay()]})의 하루예요`
}

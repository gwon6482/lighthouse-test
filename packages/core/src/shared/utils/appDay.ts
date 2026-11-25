// 앱의 하루(2026-11-26, 업무 보드 #102 '하루 시작 시간').
//
// 앱의 '오늘'은 달력의 자정이 아니라 **하루 시작 시각**에 바뀐다. 예: 하루 시작이 새벽 4시면
// 목요일 새벽 1시는 아직 수요일의 하루다. 홈의 할 일·완료 기록 날짜·주의 경계·주간결산이 모두 이 하루를 따른다.
//
// 이 파일은 순수 계산만 둔다(화면 상태는 dev-date.ts 의 getToday).
// ⚠️ 정본·사본: 이 파일이 정본이고 서버 lighthouse-api `services/appDay.js` 가 사본이다
//    (서버는 계획을 고칠 때 '이번 주 이후 일정'을 지우는 데 같은 하루를 쓴다 — services/scheduleReset.js).
//    상수를 바꾸면 서버도 바꾸고 서버 `scripts/check-method-sync.js` 를 돌린다.

/** 하루 시작 시각(시) — 아무것도 정하지 않은 계정의 값 */
export const DEFAULT_DAY_START_HOUR = 0

const HOUR_MS = 3_600_000

/** 'YYYY-MM-DD'(기기 현지 달력) */
export function dateKeyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * 지금 시각 `now` 가 어느 날의 하루인가 — 하루 시작 시각만큼 뒤로 민 시각의 달력 날짜.
 * 돌려주는 Date 는 시각이 붙어 있다(받는 쪽이 자정으로 맞춘다 — 예전 getToday 와 같은 모양).
 */
export function appDayOf(now: Date, hour: number = DEFAULT_DAY_START_HOUR): Date {
  return hour ? new Date(now.getTime() - hour * HOUR_MS) : new Date(now.getTime())
}

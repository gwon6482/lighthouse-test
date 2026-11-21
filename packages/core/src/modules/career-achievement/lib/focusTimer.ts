// 집중모드(2026-11-04 C안 '채움') — 화면과 무관한 계산만. 화면은 pages/CareerAchievementStartPage.vue
// ⚠️ 완료는 판정하지 않는다: 목표보다 일찍 끝낸 건 포기가 아니라 일이 빨리 끝난 경우가 더 많다(사용자 결정)

export const FOCUS_PRESETS = [15, 25, 50, 90] as const
export const FOCUS_MIN = 5
export const FOCUS_MAX = 180
export const FOCUS_STEP = 5

// 목표 시간 기본값 = 계획에 정한 1회 시간(없으면 25분), 5~180분
export function clampGoal(min: number | undefined): number {
  const m = Math.round(Number(min) || 25)
  return Math.min(FOCUS_MAX, Math.max(FOCUS_MIN, m))
}

// '12분' · '1시간 5분' · '2시간'
export function durationLabel(sec: number): string {
  const m = Math.round(Math.max(0, sec) / 60)
  if (m < 60) return `${m}분`
  const h = Math.floor(m / 60)
  return m % 60 ? `${h}시간 ${m % 60}분` : `${h}시간`
}

// 목표와의 차이 — 1분 안쪽은 '딱 맞게'. 잘했다·못했다는 따지지 않는다(일찍 끝낸 건 일이 빨리 끝난 것일 수 있다)
// 2026-11-21 오너(시안 '진로달성 다듬기' A1 권장): '빨리 했어요' → 사실 그대로 '일찍 끝냈어요'.
// 목표의 절반을 못 채웠으면 차이 대신 고른 목표를 보인다('목표 15분 중 14초 집중했어요') — 14초에 '15분 빨리'가 칭찬처럼 읽혔다
// sub = 완료 화면 둘째 칸의 작은 글자
export function focusGap(elapsedSec: number, goalSec: number): { diff: string; line: string; sub: string } {
  const d = elapsedSec - goalSec
  const goal = `${Math.round(goalSec / 60)}분` // 목표는 고른 그대로 분으로(설정 화면·완료 카드와 같게)
  const vs = `목표 ${goal}보다`
  if (Math.abs(d) < 60) return { diff: '딱 맞게', line: '목표 시간에 딱 맞춰 끝냈어요', sub: vs }
  if (d > 0) return { diff: `${durationLabel(d)} 늦게`, line: `${vs} ${durationLabel(d)} 늦게 했어요`, sub: vs }
  if (elapsedSec * 2 < goalSec) {
    return { diff: goal, line: `목표 ${goal} 중 ${elapsedShort(elapsedSec)} 집중했어요`, sub: '고른 목표' }
  }
  return { diff: `${durationLabel(-d)} 일찍`, line: `${vs} ${durationLabel(-d)} 일찍 끝냈어요`, sub: vs }
}

// 집중한 시간을 한 단위로 — 1분이 안 되면 초('14초'), 그 밖은 분을 버림('12분'). 완료 화면 큰 원과 같은 셈
export function focusBadge(elapsedSec: number): { num: number; unit: '초' | '분' } {
  const s = Math.max(0, Math.floor(elapsedSec))
  return s < 60 ? { num: s, unit: '초' } : { num: Math.floor(s / 60), unit: '분' }
}
const elapsedShort = (sec: number) => { const b = focusBadge(sec); return `${b.num}${b.unit}` }

// 로그 한 줄의 시간 — 1분이 안 되면 '1분 미만'(예전엔 1분으로 올려 적어 14초와 달라 보였다). 합계는 이 함수를 쓰지 않고 초를 더해 센다
export function logMinutesLabel(sec: number): string {
  return sec < 60 ? '1분 미만' : `${Math.round(sec / 60)}분`
}

const pad = (n: number) => String(n).padStart(2, '0')

// 큰 숫자 두 줄(분·초). 목표를 넘기면 넘긴 시간에 '+'
export function focusDigits(elapsedSec: number, goalSec: number): { over: boolean; min: string; sec: string } {
  const left = goalSec - elapsedSec
  const over = left < 0
  const t = Math.floor(Math.abs(left))
  return { over, min: (over ? '+' : '') + pad(Math.floor(t / 60)), sec: pad(t % 60) }
}

// 37:24 · 1:06:25
export function clockLabel(sec: number): string {
  const s = Math.max(0, Math.floor(sec))
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60)
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`
}

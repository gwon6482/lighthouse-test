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

// 목표와의 차이 — 1분 안쪽은 '딱 맞게'
export function focusGap(elapsedSec: number, goalSec: number): { diff: string; line: string } {
  const d = elapsedSec - goalSec
  if (Math.abs(d) < 60) return { diff: '딱 맞게', line: '목표 시간에 딱 맞춰 끝냈어요' }
  const goal = `${Math.round(goalSec / 60)}분` // 목표는 고른 그대로 분으로(설정 화면·완료 카드와 같게)
  return d < 0
    ? { diff: `${durationLabel(-d)} 빨리`, line: `목표 ${goal}보다 ${durationLabel(-d)} 빨리 했어요` }
    : { diff: `${durationLabel(d)} 늦게`, line: `목표 ${goal}보다 ${durationLabel(d)} 늦게 했어요` }
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

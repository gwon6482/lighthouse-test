// 디테일(10단계) 척도 색 — 검사 화면(ScaleQuestion10)과 검사 방식 선택 카드 미리보기가 같이 쓴다 (2026-10-30)
// 기준은 베이직(ScaleQuestion5) 원 버튼 다섯 색: 전혀 그렇지 않다 → 매우 그렇다
//   - 테두리·숫자(text·line): 다섯 색을 1~10 으로 이어 그라데이션 — 숫자마다 색이 조금씩 다르다
//   - 선택했을 때 칠하는 색(fill): 두 칸씩 다섯 색 그대로 — 그라데이션으로 칠하면 6·7 이 탁한 회녹색이 된다
//   - 가운데 회색만 칠할 때 조금 진하게(#858B92) — 흰 숫자 대비 2.6 → 3.5

const BASE = ['#FF6B57', '#FF9A8B', '#9AA0A6', '#5DBA8A', '#1DB95A']
const FILL = ['#FF6B57', '#FF9A8B', '#858B92', '#5DBA8A', '#1DB95A']

export type ScaleColor = { text: string; line: string; fill: string }

const toRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

function blend(i: number): number[] {
  const t = (i / 9) * (BASE.length - 1)
  const k = Math.min(BASE.length - 2, Math.floor(t))
  const [a, b] = [toRgb(BASE[k]), toRgb(BASE[k + 1])]
  return a.map((v, n) => Math.round(v + (b[n] - v) * (t - k)))
}

/** 1~10 각 칸의 색 (index 0 = 1점) */
export const SCALE10_COLORS: ScaleColor[] = Array.from({ length: 10 }, (_, i) => {
  const [r, g, b] = blend(i)
  return {
    text: `rgb(${r}, ${g}, ${b})`,
    line: `rgba(${r}, ${g}, ${b}, 0.4)`,
    fill: FILL[Math.floor(i / 2)],
  }
})

/** 칸에 넘길 CSS 변수 */
export const scale10Style = (i: number) => ({
  '--sc-text': SCALE10_COLORS[i].text,
  '--sc-line': SCALE10_COLORS[i].line,
  '--sc-fill': SCALE10_COLORS[i].fill,
})

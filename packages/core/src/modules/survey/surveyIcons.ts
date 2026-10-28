// 자기이해 화면 공용 아이콘 이름(public/icons) — 2026-10-28 이모지 → 자체 아이콘
// 영역·팁 아이콘이 화면마다 따로 적혀 있던 것(5곳)을 여기 한 곳에서 가져다 쓴다
export const AREA_ICON = {
  personality: 'area-personality',   // 성격 & 기질(T1)
  likes: 'area-likes',               // 좋아하는 일 — 재능·흥미·가치관(T2)
  environment: 'area-environment',   // 업무 환경(T3)
} as const

export const TIP_ICON = {
  honest: 'tip-honest',     // 정답은 없어요, 솔직하게
  quick: 'tip-quick',       // 첫 느낌으로
  warning: 'tip-warning',   // 중간에 멈추면 처음부터
} as const

/** 업무환경 판정: 맞는 환경 / 유연(상관없음) / 피하면 좋은 환경 */
export const ENV_JUDGE_ICON = { good: 'env-good', neutral: 'env-neutral', bad: 'env-bad' } as const

/** 업무환경 요소 WE01~WE49 */
export const weIcon = (code: string) => `env-${code.toLowerCase()}`

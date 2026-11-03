// 상단(노치·상태바) 색 — 화면 머리 색과 맞춰 흰 띠가 끊겨 보이지 않게(2026-11-03).
// 라우트 meta.themeColor 가 있으면 그 색, 없으면 흰색. iOS 사파리는 확실히 따르고, 홈 화면 앱(PWA)은 iOS 버전에 따라 다르다.
// 단색만 된다 — 머리의 그라데이션·무늬는 노치까지 이어지지 않는다.
export const THEME_COLOR = {
  heroYellow: '#FFDF3D', // 진로달성 홈·진로정보·마이 노란 머리 그라데이션 시작색(AchievementHome .ah-hero 등)
  primary: '#FFD100',    // 로드맵 고정 바·로그 머리($color-primary)
  default: '#ffffff',    // index.html · manifest theme_color 와 같다
} as const

export function applyThemeColor(color: unknown) {
  const value = typeof color === 'string' && color ? color : THEME_COLOR.default
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }
  if (meta.content !== value) meta.content = value
}

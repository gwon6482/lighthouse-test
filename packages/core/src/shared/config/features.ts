// 피처 플래그 — 런칭 후 재오픈용.
// 나브 노출·라우트 진입점을 이 플래그로 감싸되, 화면/라우트 코드 자체는 보존한다.
// 재오픈 시 해당 값만 true 로 바꾸면 나브·딥링크가 함께 살아난다.
// (2026-07-31 나브 3탭 축소: 커뮤니티·커리어 베타 비활성)
export const features = {
  community: false,
  career: false,
  // 비회원 진입 경로(2026-11-09) — /start(비회원 검사) · /job/:jobCode(비회원 진로백과) · 결과지·진로백과 잠금.
  // 빌드 환경변수로 켠다: 스테이징(deploy-test)만 VITE_GUEST_ENTRY=1. 운영은 처리방침 시행(2026-11-16) 뒤에 켤 것
  guestEntry: import.meta.env.VITE_GUEST_ENTRY === '1',
} as const

export type FeatureKey = keyof typeof features

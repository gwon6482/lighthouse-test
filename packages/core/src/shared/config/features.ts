// 피처 플래그 — 런칭 후 재오픈용.
// 나브 노출·라우트 진입점을 이 플래그로 감싸되, 화면/라우트 코드 자체는 보존한다.
// 재오픈 시 해당 값만 true 로 바꾸면 나브·딥링크가 함께 살아난다.
// (2026-07-31 나브 3탭 축소: 커뮤니티·커리어 베타 비활성)
export const features = {
  community: false,
  career: false,
  // 비회원 진입 경로(2026-11-09) — /start(비회원 검사) · /job/:jobCode(비회원 진로백과) · 결과지·진로백과 잠금.
  // 빌드 환경변수로 켠다: 스테이징(deploy-test)·운영(deploy-app) 모두 VITE_GUEST_ENTRY=1 (운영은 2026-11-12~)
  guestEntry: import.meta.env.VITE_GUEST_ENTRY === '1',
} as const

export type FeatureKey = keyof typeof features

// 내 진로상황(2026-11-16) — 학교·학과·경력·성과를 받는 기능이라 **개인정보처리방침 시행일(2026-11-23 0시)부터** 연다.
//   (처리방침 제12조: 바뀐 방침은 시행 7일 전에 공지 — 11-16 게시·11-23 시행. 연구 설문 평가지를 날짜로 막은 것과 같은 방식)
//   스테이징(deploy-test)·로컬 개발은 VITE_CAREER_SITUATION_EARLY=1 로 미리 연다. 날짜가 지나면 이 스위치는 지워도 된다
export const CAREER_SITUATION_OPENS_AT = '2026-11-23T00:00:00+09:00'
export function careerSituationOpen(now: number = Date.now()): boolean {
  return import.meta.env.VITE_CAREER_SITUATION_EARLY === '1' || now >= Date.parse(CAREER_SITUATION_OPENS_AT)
}


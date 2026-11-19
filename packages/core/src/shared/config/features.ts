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
  // 진로백과 '분류로 찾기'(2026-11-17 오너 결정 — 직무·관심 분야·업무 환경·재능·가치관·연봉으로 직업 좁히기).
  // 스테이징(deploy-test)만 VITE_JOB_BROWSE=1. 운영(deploy-app)은 사용성 확인 뒤 오너 지시로 켠다
  jobBrowse: import.meta.env.VITE_JOB_BROWSE === '1',
  // 집중모드 '잠시 멈추고 홈으로 · 집중 취소하고 홈으로'(2026-11-19 오너 결정 — 멈춘 집중을 기기에 남겨 홈에서 이어 하기).
  // 스테이징(deploy-test)만 VITE_FOCUS_PAUSE=1. 운영(deploy-app)은 사용성 확인 뒤 오너 지시로 켠다.
  // 꺼져 있으면 예전 동작('집중한 기록이 사라져요' 확인 창) 그대로 — 운영에 켜고 나면 다음 정리 때 옛 갈래를 지운다
  focusPause: import.meta.env.VITE_FOCUS_PAUSE === '1',
} as const

export type FeatureKey = keyof typeof features

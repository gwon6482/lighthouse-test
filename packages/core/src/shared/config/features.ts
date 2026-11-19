// 피처 플래그 — 런칭 후 재오픈용.
// 나브 노출·라우트 진입점을 이 플래그로 감싸되, 화면/라우트 코드 자체는 보존한다.
// 재오픈 시 해당 값만 true 로 바꾸면 나브·딥링크가 함께 살아난다.
// (2026-07-31 나브 3탭 축소: 커뮤니티·커리어 베타 비활성)
export const features = {
  community: false,
  career: false,
  // 2026-11-19 오너 '지금까지의 스위치 기능들은 내부적으로 모두 점검 되었어. 그냥 바로 적용하자' — 운영에 켜져 있던
  // guestEntry(비회원 진입)·jobBrowse(분류로 찾기)·focusPause(집중 멈춤·취소)·browsePolish2(가입 둘러보기·진로백과 홈 아래 탭)
  // 네 스위치를 지우고 켜진 동작만 남겼다(VITE_GUEST_ENTRY 등 빌드 환경변수도 더는 읽지 않는다)
} as const

export type FeatureKey = keyof typeof features

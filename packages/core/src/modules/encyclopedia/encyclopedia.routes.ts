import type { RouteLocation } from 'vue-router'
import { THEME_COLOR } from '@/shared/router/themeColor'
export default [
  {
    // 하단 탭 '진로정보'(2026-10-29 기획회의) — 검사 · 진로백과 바로가기 · 진로·채용 소식
    path: '/career-info',
    name: 'Career Info',
    component: () => import('./pages/CareerInfoPage.vue'),
    meta: { showBottomNav: true, themeColor: THEME_COLOR.heroYellow },
  },
  {
    path: '/career-encyclopedia',
    name: 'Career Encyclopedia',
    component: () => import('./pages/EncyclopediaHomePage.vue'),
    // 아래 탭(2026-11-19 다듬기 2차 7·8) — 보이는 규칙은 다른 탭 화면과 같다(로그인 + 진행 중인 계획). 켜짐은 '진로정보'(BottomNav activeFor).
    // 직업 상세·분류로 찾기는 더 깊은 화면이라 지금처럼 뒤로 버튼
    meta: { showBottomNav: true },
  },
  {
    path: '/career-encyclopedia/recommended',
    name: 'Career Encyclopedia Recommended',
    component: () => import('./pages/EncyclopediaRecommendedPage.vue'),
  },
  // 분류로 찾기(2026-11-17 오너 결정, 운영 2026-11-18~).
  // 고른 조건은 주소(query)에 담는다: ?group=&interest=&env=&talent=&value=&salary=(쉼표로 여럿)&sort=
  {
    path: '/career-encyclopedia/browse',
    name: 'Career Encyclopedia Browse',
    component: () => import('./pages/EncyclopediaBrowsePage.vue'),
  },
  {
    // :axis = group · interest · env · talent · value · salary. 직무는 ?top=02 로 대분류 → 직무
    path: '/career-encyclopedia/browse/:axis',
    name: 'Career Encyclopedia Browse Pick',
    component: () => import('./pages/EncyclopediaBrowsePickPage.vue'),
  },
  {
    // 비회원 진로백과 홍보 링크(2026-11-09) — app.lighthouse.career/job/직업코드?c=캠페인.
    // 직업 상세는 원래 비로그인으로 열린다. 비회원에게는 '이 일을 하는 사람들' 아래를 잠근다(OverviewTab)
    path: '/job/:jobCode',
    redirect: (to: RouteLocation) => ({ path: `/career-encyclopedia/job/${to.params.jobCode}`, query: to.query }),
  },
  {
    path: '/career-encyclopedia/job/:jobCode',
    name: 'Career Encyclopedia Job Detail',
    component: () => import('./pages/EncyclopediaJobDetailPage.vue'),
  },
  {
    // 결과지 직무 카드의 '채용 공고'(2026-11-09) — code = 고용24 채용 직종 중분류(3자리, '01A' 처럼 영문자 섞임)
    path: '/career-encyclopedia/group/:code/recruitment',
    name: 'Career Encyclopedia Group Recruitment',
    component: () => import('./pages/EncyclopediaGroupRecruitPage.vue'),
  },
]

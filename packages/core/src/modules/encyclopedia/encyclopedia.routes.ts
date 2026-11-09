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
  },
  {
    path: '/career-encyclopedia/recommended',
    name: 'Career Encyclopedia Recommended',
    component: () => import('./pages/EncyclopediaRecommendedPage.vue'),
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

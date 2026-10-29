export default [
  {
    // 하단 탭 '진로정보'(2026-10-29 기획회의) — 검사 · 진로백과 바로가기 · 진로·채용 소식
    path: '/career-info',
    name: 'Career Info',
    component: () => import('./pages/CareerInfoPage.vue'),
    meta: { showBottomNav: true },
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
]

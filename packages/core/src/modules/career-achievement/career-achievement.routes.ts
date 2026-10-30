export default [
  {
    path: '/career-achievement',
    name: 'Career Achievement',
    component: () => import('./pages/CareerAchievementPage.vue'),
    meta: { showBottomNav: true },
  },
  {
    path: '/career-achievement/start/:type/:id',
    name: 'Career Achievement Start',
    component: () => import('./pages/CareerAchievementStartPage.vue'),
  },
  {
    path: '/career-achievement/complete/:type/:id',
    name: 'Career Achievement Complete',
    component: () => import('./pages/CareerAchievementCompletePage.vue'),
  },
  {
    // 주간결산(2026-10-30 시안) — 단계마다 페이지 1~5. 예전 '지난 주 회고'(weekly-review)를 대신할 예정
    path: '/career-achievement/review/:step(\\d)',
    name: 'Career Achievement Review',
    component: () => import('./pages/CareerAchievementReviewFlowPage.vue'),
  },
  {
    path: '/career-achievement/weekly-review',
    name: 'Career Achievement Weekly Review',
    component: () => import('./pages/CareerAchievementWeeklyReviewPage.vue'),
  },
  {
    // 하단 탭 '로드맵'(2026-10-28~). 예전엔 이 탭이 '이번 주 일정 조정'(weekly-schedule)이었다
    path: '/career-achievement/roadmap',
    name: 'Career Achievement Roadmap',
    component: () => import('./pages/CareerAchievementRoadmapPage.vue'),
    meta: { showBottomNav: true },
  },
  {
    // 하단 탭 '로그'(2026-10-29 기획회의) — 진로 달성 기록을 한 번에. 예전 '기록 모아보기'(메인 타일·마이페이지 미리보기)를 대신한다
    path: '/career-achievement/records',
    name: 'Career Achievement Records',
    component: () => import('./pages/CareerAchievementRecordsPage.vue'),
    meta: { showBottomNav: true },
  },
  {
    path: '/career-achievement/weekly-schedule',
    name: 'Career Achievement Weekly Schedule',
    component: () => import('./pages/CareerAchievementSchedulePage.vue'),
    meta: { showBottomNav: true },
  },
]

import { THEME_COLOR } from '@/shared/router/themeColor'
export default [
  {
    path: '/career-achievement',
    name: 'Career Achievement',
    component: () => import('./pages/CareerAchievementPage.vue'),
    meta: { swReloadTo: true, showBottomNav: true, themeColor: THEME_COLOR.heroYellow },
  },
  {
    path: '/career-achievement/start/:type/:id',
    name: 'Career Achievement Start',
    component: () => import('./pages/CareerAchievementStartPage.vue'),
    meta: { noSwReload: true, themeColor: THEME_COLOR.focus },
  },
  {
    path: '/career-achievement/complete/:type/:id',
    name: 'Career Achievement Complete',
    component: () => import('./pages/CareerAchievementCompletePage.vue'),
    meta: { noSwReload: true },
  },
  {
    // 주간결산(2026-10-30 시안) — 단계마다 페이지 1~5. 예전 '지난 주 회고'(weekly-review)를 대신할 예정
    path: '/career-achievement/review/:step(\\d)',
    name: 'Career Achievement Review',
    component: () => import('./pages/CareerAchievementReviewFlowPage.vue'),
    meta: { noSwReload: true },
  },
  {
    // 주간결산 모아보기(2026-10-30) — 마이페이지 '진로 관리'
    path: '/career-achievement/reviews',
    name: 'Career Achievement Reviews',
    component: () => import('./pages/CareerAchievementReviewsPage.vue'),
  },
  {
    path: '/career-achievement/weekly-review',
    name: 'Career Achievement Weekly Review',
    component: () => import('./pages/CareerAchievementWeeklyReviewPage.vue'),
    meta: { noSwReload: true },
  },
  {
    // 하단 탭 '로드맵'(2026-10-28~). 예전엔 이 탭이 '이번 주 일정 조정'(weekly-schedule)이었다
    path: '/career-achievement/roadmap',
    name: 'Career Achievement Roadmap',
    component: () => import('./pages/CareerAchievementRoadmapPage.vue'),
    meta: { swReloadTo: true, showBottomNav: true, themeColor: THEME_COLOR.primary },
  },
  {
    // 하단 탭 '로그'(2026-10-29 기획회의) — 진로 달성 기록을 한 번에. 예전 '기록 모아보기'(메인 타일·마이페이지 미리보기)를 대신한다
    path: '/career-achievement/records',
    name: 'Career Achievement Records',
    component: () => import('./pages/CareerAchievementRecordsPage.vue'),
    meta: { swReloadTo: true, showBottomNav: true, themeColor: THEME_COLOR.primary },
  },
  {
    // 홈에서 새 프로젝트 시작하기 — 확인(#99, 2026-11-26). 고르기는 홈·로드맵의 시트, 만들기는 진로설계 '새로운 프로젝트 추가'(?add=1)
    path: '/career-achievement/add/confirm',
    name: 'Career Achievement Add Confirm',
    component: () => import('./pages/CareerAchievementAddConfirmPage.vue'),
    meta: { noSwReload: true },
  },
  {
    path: '/career-achievement/weekly-schedule',
    name: 'Career Achievement Weekly Schedule',
    component: () => import('./pages/CareerAchievementSchedulePage.vue'),
    meta: { noSwReload: true, showBottomNav: true },
  },
]

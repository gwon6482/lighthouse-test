export default [
  {
    path: '/career-achievement',
    name: 'Career Achievement',
    component: () => import('./pages/CareerAchievementPage.vue'),
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
    path: '/career-achievement/weekly-review',
    name: 'Career Achievement Weekly Review',
    component: () => import('./pages/CareerAchievementWeeklyReviewPage.vue'),
  },
  {
    path: '/career-achievement/weekly-schedule',
    name: 'Career Achievement Weekly Schedule',
    component: () => import('./pages/CareerAchievementSchedulePage.vue'),
  },
]

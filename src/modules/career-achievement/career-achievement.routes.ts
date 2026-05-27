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
]

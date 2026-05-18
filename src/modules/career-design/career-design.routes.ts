export default [
  {
    path: '/career-design',
    name: 'Career Design',
    component: () => import('./pages/CareerDesignPage.vue'),
  },
  {
    path: '/career-design/explore',
    name: 'Career Design Explore',
    component: () => import('./pages/CareerDesignExplorePage.vue'),
  },
  {
    path: '/career-design/plan/new',
    name: 'Career Design Plan Write',
    component: () => import('./pages/CareerDesignPlanWritePage.vue'),
  },
  {
    path: '/career-design/project/new',
    name: 'Career Design Project Write',
    component: () => import('./pages/CareerDesignProjectWritePage.vue'),
  },
  {
    path: '/career-design/project/:id',
    name: 'Career Design Project Detail',
    component: () => import('./pages/CareerDesignProjectDetailPage.vue'),
  },
  {
    path: '/career-design/complete',
    name: 'Career Design Complete',
    component: () => import('./pages/CareerDesignCompletePage.vue'),
  },
  {
    path: '/career-design/result',
    name: 'Career Design Result',
    component: () => import('./pages/CareerDesignResultPage.vue'),
  },
]

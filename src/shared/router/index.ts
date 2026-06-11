import { createRouter, createWebHistory } from 'vue-router'

import surveyRoutes from '@/modules/survey/survey.routes'
import encyclopediaRoutes from '@/modules/encyclopedia/encyclopedia.routes'
import careerDesignRoutes from '@/modules/career-design/career-design.routes'
import careerAchievementRoutes from '@/modules/career-achievement/career-achievement.routes'
import onboardingRoutes from '@/modules/onboarding/onboarding.routes'

// BottomNav 스텁 라우트 (커리어 허브 / 커뮤니티) — 실제 기능은 추후 구현
const stubRoutes = [
  {
    path: '/career-hub',
    name: 'Career Hub',
    component: () => import('@/shared/pages/ComingSoonPage.vue'),
    meta: {
      showBottomNav: true,
      comingSoonTitle: '커리어 허브',
      comingSoonMsg: '진로체험, 채용정보, 채용박람회 뉴스를 한 곳에서 만날 수 있게 준비하고 있어요.',
    },
  },
  {
    path: '/community',
    name: 'Community',
    component: () => import('@/shared/pages/ComingSoonPage.vue'),
    meta: {
      showBottomNav: true,
      comingSoonTitle: '커뮤니티',
      comingSoonMsg: '같은 진로를 향해 노력하는 동료들의 완료 피드와 응원을 곧 만날 수 있어요.',
    },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...onboardingRoutes,
    ...surveyRoutes,
    ...encyclopediaRoutes,
    ...careerDesignRoutes,
    ...careerAchievementRoutes,
    ...stubRoutes,
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router

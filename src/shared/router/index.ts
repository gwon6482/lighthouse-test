import { createRouter, createWebHistory } from 'vue-router'

import surveyRoutes from '@/modules/survey/survey.routes'
import encyclopediaRoutes from '@/modules/encyclopedia/encyclopedia.routes'
import careerDesignRoutes from '@/modules/career-design/career-design.routes'
import careerAchievementRoutes from '@/modules/career-achievement/career-achievement.routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...surveyRoutes,
    ...encyclopediaRoutes,
    ...careerDesignRoutes,
    ...careerAchievementRoutes,
  ],
  scrollBehavior: () => ({ top: 0 }),
})

export default router

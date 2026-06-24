// test 셸 라우터 — 개발/테스트 워크벤치. 모든 모듈을 전부 포함한다.
import surveyRoutes from '@/modules/survey/survey.routes'
import encyclopediaRoutes from '@/modules/encyclopedia/encyclopedia.routes'
import careerDesignRoutes from '@/modules/career-design/career-design.routes'
import careerAchievementRoutes from '@/modules/career-achievement/career-achievement.routes'
import onboardingRoutes from '@/modules/onboarding/onboarding.routes'
import stubRoutes from './stubRoutes'
import { makeRouter } from './createRouter'

const router = makeRouter([
  ...onboardingRoutes,
  ...surveyRoutes,
  ...encyclopediaRoutes,
  ...careerDesignRoutes,
  ...careerAchievementRoutes,
  ...stubRoutes,
])

export { resetViewportZoom } from './createRouter'
export default router

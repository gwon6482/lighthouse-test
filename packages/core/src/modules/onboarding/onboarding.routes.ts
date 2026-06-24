// 최초 진입 사용자 온보딩 플로우
// 0 스플래시 → 1 서비스 소개 → 2 로그인/가입 → 3 가입 위저드 → 4 welcome → 5 /main/before
// 단계별로 하나씩 구현 중. 아직 안 만든 단계는 임시 placeholder 로 둔다.
import type { RouteRecordRaw } from 'vue-router'

const onboardingRoutes: RouteRecordRaw[] = [
  {
    path: '/onboarding',
    name: 'Onboarding Splash',
    component: () => import('./pages/SplashPage.vue'),
  },
  {
    path: '/onboarding/intro',
    name: 'Onboarding Intro',
    component: () => import('./pages/IntroSlidesPage.vue'),
  },
  {
    path: '/onboarding/auth',
    name: 'Onboarding Auth',
    component: () => import('./pages/AuthPage.vue'),
  },
  {
    path: '/onboarding/signup',
    name: 'Onboarding Signup',
    component: () => import('./pages/SignupWizardPage.vue'),
  },
  {
    path: '/onboarding/welcome',
    name: 'Onboarding Welcome',
    component: () => import('./pages/WelcomePage.vue'),
  },
]

export default onboardingRoutes

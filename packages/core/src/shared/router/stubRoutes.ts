import type { RouteRecordRaw } from 'vue-router'
import { features } from '@/shared/config/features'

// 피처 플래그가 꺼져 있으면 딥링크/북마크 진입도 홈으로 돌려보낸다(코드는 보존).
const HOME_ROUTE = { name: 'Career Achievement' }

// BottomNav 스텁 라우트 (커리어 허브 / 커뮤니티) — 실제 기능은 추후 구현
const stubRoutes: RouteRecordRaw[] = [
  {
    path: '/career-hub',
    name: 'Career Hub',
    component: () => import('@/shared/pages/ComingSoonPage.vue'),
    beforeEnter: () => (features.career ? true : HOME_ROUTE),
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
    beforeEnter: () => (features.community ? true : HOME_ROUTE),
    meta: {
      showBottomNav: true,
      comingSoonTitle: '커뮤니티',
      comingSoonMsg: '같은 진로를 향해 노력하는 동료들의 완료 피드와 응원을 곧 만날 수 있어요.',
    },
  },
  // 없는 주소(옛 링크·잘못된 주소)는 흰 화면이 됐다 — '/' 로 보내면 진입 가드가 상태에 맞는 자리로 보낸다(2026-11-26 나가는 길 점검)
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export default stubRoutes

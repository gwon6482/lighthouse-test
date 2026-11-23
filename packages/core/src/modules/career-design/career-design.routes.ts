export default [
  {
    path: '/career-design',
    name: 'Career Design',
    component: () => import('./pages/CareerDesignPage.vue'),
    meta: { noSwReload: true },
  },
  {
    path: '/career-design/explore',
    name: 'Career Design Explore',
    component: () => import('./pages/CareerDesignExplorePage.vue'),
    meta: { noSwReload: true },
  },
  {
    // 내 진로상황(2026-11-16) — [진로계획 세우기] 다음, 템플릿 앞. 학교·관련 학과·이미 해 둔 것·경력·성과
    path: '/career-design/situation',
    name: 'Career Design Situation',
    component: () => import('./pages/CareerDesignSituationPage.vue'),
    meta: { noSwReload: true },
  },
  {
    // 마이페이지 > 내 진로상황 — 언제든 적고 고치고 지운다(진로계획 단계와 같은 질문)
    path: '/mypage/career-situation',
    name: 'My Career Situation',
    component: () => import('./pages/MyCareerSituationPage.vue'),
    meta: { noSwReload: true },
  },
  {
    // 템플릿에서 수정하기(베타) — 라이트하우스가 미리 설계한 진로계획을 골라 고친다
    path: '/career-design/templates',
    name: 'Career Design Templates',
    component: () => import('./pages/CareerDesignTemplatesPage.vue'),
    meta: { noSwReload: true },
  },
  {
    // 진행 속도 고르기(생활 모습 카드) + 순서 확인 → 타임라인 자동 배치. 프로젝트 구성과 타임라인 사이
    path: '/career-design/plan/pace',
    name: 'Career Design Pace',
    component: () => import('./pages/CareerDesignPacePage.vue'),
    meta: { noSwReload: true },
  },
  {
    path: '/career-design/plan/new',
    name: 'Career Design Plan Write',
    component: () => import('./pages/CareerDesignPlanWritePage.vue'),
    meta: { noSwReload: true },
  },
  {
    path: '/career-design/plan/:planId',
    name: 'Career Design Plan Detail',
    component: () => import('./pages/CareerDesignPlanDetailPage.vue'),
    meta: { noSwReload: true },
  },
  {
    path: '/career-design/plan/projects',
    name: 'Career Design Projects',
    component: () => import('./pages/CareerDesignProjectsPage.vue'),
    meta: { noSwReload: true },
  },
  {
    path: '/career-design/project/new',
    name: 'Career Design Project Write',
    component: () => import('./pages/CareerDesignProjectWritePage.vue'),
    meta: { noSwReload: true },
  },
  {
    path: '/career-design/project/curriculum',
    name: 'Career Design Project Curriculum',
    component: () => import('./pages/CareerDesignProjectCurriculumPage.vue'),
    meta: { noSwReload: true },
  },
  {
    // 과정 프로젝트의 둘째 화면(2026-11-16) — 주차별 할 일 대신 '다니는 방식'(오늘 할 일 이름·기간·결산 점검). ⚠️ :id 보다 위에
    path: '/career-design/project/period',
    name: 'Career Design Project Period',
    component: () => import('./pages/CareerDesignProjectPeriodPage.vue'),
    meta: { noSwReload: true },
  },
  {
    path: '/career-design/project/:id',
    name: 'Career Design Project Detail',
    component: () => import('./pages/CareerDesignProjectDetailPage.vue'),
    meta: { noSwReload: true },
  },
  {
    // 삭제 직후 안내(2026-11-04) — 목표 진로 확인 → 다시 설계, 되돌리기
    path: '/career-design/deleted/:planId',
    name: 'Career Design Deleted',
    component: () => import('./pages/CareerDesignDeletedPage.vue'),
    meta: { noSwReload: true },
  },
  {
    // 최근 삭제한 계획(휴지통, 30일) — 마이페이지 '진로 관리'
    path: '/career-design/trash',
    name: 'Career Design Trash',
    component: () => import('./pages/CareerDesignTrashPage.vue'),
    meta: { noSwReload: true },
  },
  {
    path: '/career-design/complete',
    name: 'Career Design Complete',
    component: () => import('./pages/CareerDesignCompletePage.vue'),
    meta: { noSwReload: true },
  },
  {
    path: '/career-design/plan/routines',
    name: 'Career Design Routines',
    component: () => import('./pages/CareerDesignRoutinesPage.vue'),
    meta: { noSwReload: true },
  },
  {
    path: '/career-design/routine/new',
    name: 'Career Design Routine Write',
    component: () => import('./pages/CareerDesignRoutineWritePage.vue'),
    meta: { noSwReload: true },
  },
  {
    path: '/career-design/plan/review-day',
    name: 'Career Design Review Day',
    component: () => import('./pages/CareerDesignReviewDayPage.vue'),
    meta: { noSwReload: true },
  },
  {
    path: '/career-design/result',
    name: 'Career Design Result',
    component: () => import('./pages/CareerDesignResultPage.vue'),
    meta: { noSwReload: true },
  },
]

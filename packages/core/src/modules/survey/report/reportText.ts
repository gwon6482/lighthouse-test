/**
 * PDF 결과지 문구 — **결과지의 고정 문구는 전부 여기에 있다.** 문구만 고칠 때는 이 파일만 보면 된다.
 * (쪽 구성은 ResultReport.vue 의 PAGES, 구역 내용은 sections/, 색·크기는 report.scss)
 *
 * 양식 참고: TCI 성인용 결과지(reference /TCI_성인용_결과지_sample.pdf) — 표지 요약 + 쪽별 표 + 공통 머리말·꼬리말
 */
export const REPORT_TEXT = {
  title: '자기이해 검사',
  subtitle: '결과지',
  coverPanel: ['Personality · Talent', 'Interest · Values', 'Work Environment'],

  summary: {
    heading: 'DATA SUMMARY',
    respondentId: '응답 번호',
    date: '검사일',
    parts: '검사 구성',
    partsValue: '성격 · 재능 · 흥미 · 가치관 · 업무 환경',
    items: '문항 수',
    // ⚠️ 문항 수는 설문지가 바뀌면 같이 고칠 것(현재 성격 43 · 재능 61 · 흥미 33 · 가치관 9 · 환경 6)
    itemsValue: '성격 43 · 재능 61 · 흥미 33 · 가치관 9 · 환경 6',
  },

  type: { heading: '성격 유형' },

  personality: {
    heading: '성격 프로파일',
    sub: '9가지 성격 요소',
    cols: { name: '요소', score: '점수', avg: '평균', top: '상위' },
    notes: [
      '점수는 0~100 으로 환산한 값이며, 막대 위 회색 선은 응답자 평균입니다.',
      '상위 % 가 작을수록 그 성향이 다른 응답자보다 뚜렷하다는 뜻입니다.',
    ],
  },

  personalityDefs: {
    heading: '성격 요소 정의',
    sub: '9가지 성격 요소가 뜻하는 것',
    cols: { name: '요소', def: '정의' },
  },

  talent: {
    heading: '재능 프로파일',
    sub: '8가지 재능 · 상위 3개 강조',
    cols: { name: '재능', score: '점수', desc: '설명' },
    rank: (n: number) => `${n}위`,
  },

  values: {
    heading: '나의 가치관',
    sub: '중요하게 여기는 순서',
    rank: (n: number) => `${n}순위`,
  },

  interest: {
    heading: '관심 분야',
    sub: (n: number) => `${n}개 선택`,
  },

  summaryLine: {
    heading: '한 줄 요약',
    // "나는 {관심 분야}에서 {재능}을(를) 활용해 {가치}을(를) 좇는 일을 할 때 가장 빛나요." — 을/를은 이름에 따라 붙인다(composables/josa.ts)
    pre: '나는',
    afterInterest: '에서',
    afterTalent: '활용해',
    afterValue: '좇는 일을 할 때 가장 빛나요.',
  },

  environment: {
    heading: '업무 환경 성향',
    sub: '6개 항목 · 1(낮음) ~ 5(높음)',
    cols: { name: '항목', level: '수준', desc: '내가 고른 환경' },
    notes: ['채워진 점이 내가 고른 수준, 점선 테두리가 응답자 평균입니다.'],
    fitHeading: '나에게 맞는 환경 / 맞지 않는 환경',
    good: '나에게 맞는 환경',   // 표시는 머리의 색 점(report.scss .rp-box h4::before) — 이모지는 쓰지 않는다
    bad: '나에게 맞지 않는 환경',
  },

  currentJob: {
    heading: '현재 직업과의 매칭도',
    sub: '지금 하시는 일이 검사 결과와 얼마나 맞는지',
    inTop: '추천 Top 5에도 들었어요',
    mine: '현재 직업',
  },

  jobs: {
    heading: '나에게 맞는 직업 Top 5',
    // 앱은 직무 3가지가 본 추천이고 직업 Top 5 는 '직업 순위'로 뒤에 붙는다(2026-11-09)
    headingRank: '직업 순위 Top 5',
    sub: '성격 · 재능 · 흥미 · 가치관 · 업무 환경 종합',
    cols: { name: '직업', match: '매칭도', detail: '영역별 일치도', meta: '급여 중위 · 만족도' },
    // 화면 결과지와 같은 표기
    detail: { t1: '성격/기질', t2: '재능/흥미/가치관', t3: '업무환경' },
    salary: (n: number) => `${n.toLocaleString()}만원`,
    satisfaction: (n: number) => `만족도 ${n}%`,
    notes: [
      '매칭도는 다섯 영역의 일치도를 가중 합산한 값입니다(성격·재능·흥미·가치관·업무 환경).',
      '비슷한 직업이 묶인 경우 대표 직업명 아래에 함께 표시했습니다.',
      '급여·만족도는 고용24 직업정보 기준입니다.',
    ],
    guideHeading: '결과 활용 안내',
    guide:
      '이 결과는 진로 탐색을 돕기 위한 참고 자료이며, 특정 직업의 적합 여부를 단정하지 않습니다. ' +
      '라이트하우스 앱에서 추천 직업의 상세 정보(하는 일·준비 방법·전망)를 확인하고, 목표 진로를 정해 계획을 세워 보세요.',
  },

  // 나에게 맞는 직무 3가지 — 앱 전용(2026-11-09). 랜딩 정본에는 없다
  jobGroups: {
    heading: '나에게 맞는 직무 3가지',
    sub: '성격 · 재능 · 흥미 · 가치관 · 업무 환경 종합',
    cols: { name: '직무 · 대표 직업', detail: '영역별 일치도', why: '특히 잘 맞는 점' },
    reps: (titles: string[], rest: number) => `${titles.join(' · ')}${rest > 0 ? ` 외 ${rest}개` : ''}`,
    // 이유 항목의 영역 — 화면 직무 카드의 '지적 추구(가치관)'와 같다
    axis: { T1: '성격', T21: '재능', T22: '관심', T23: '가치관' } as Record<string, string>,
    notes: [
      '직무는 고용24 채용 직종 분류(중분류) 기준입니다. 영역별 일치도는 대표 직업 3개의 평균입니다.',
      '특히 잘 맞는 점은 이 결과지의 성격·재능·가치관·관심 분야 가운데 대표 직업들이 중요하게 요구하는 항목입니다.',
    ],
  },

  footer: [
    '© 라이트하우스 · www.lighthouse.career',
    '이 결과지는 연구 참여에 대한 감사의 의미로 제공되며, 상위 % 는 현재까지의 응답 표본 기준 참고값입니다.',
    '결과지의 일부 또는 전부를 무단으로 복제·배포하는 것을 금합니다.',
  ],
}

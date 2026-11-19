// 가입 뒤 소개 화면(/onboarding/intro) 4쪽 — 시안 2판(2026-11-20 오너 결정, workspace reviews/2026-11-19-intro-slides-mock.html).
// 서비스 네 단계(자기 이해 → 직업 탐색 → 진로 계획 → 진로 실현)와 한 쪽씩 맞춘다. 쪽마다 가입 질문 2번의 고민을
// '…모르겠다면' 한 줄로 받고, 가운데에 실제 화면을 닮게 그린 그림(IntroArt)을 둔다. 네 쪽 모두 '중·고등학교 교사' 한 사람의 이야기.
// 모두에게 같은 순서·같은 내용(개인화 없음) · 건너뛰기 없음 · 마지막 버튼 '확인했어요' → 환영 화면.
// 숫자는 537개·약 20분만 쓴다. 검사는 자기이해 검사 하나(3개 파트)다 — 예전 '5가지 검사'는 사실과 달랐다.

export type IntroArtKey = 'result' | 'job' | 'plan' | 'today'

export interface IntroSlide {
  step: string      // 쪽 맨 위 작은 단계 이름(JourneyIntro 와 같은 이름)
  worry: string     // 고민 한 줄(\n = 줄바꿈)
  art: IntroArtKey
  tone: 'y' | 'b' | 'p' | 'g' // 그림 상자 색
  artLabel: string  // 화면 읽기용 짧은 설명
  title: string     // \n = 줄바꿈
  body: string
}

export const INTRO_SLIDES: IntroSlide[] = [
  {
    step: '자기 이해',
    worry: '내가 무엇을 좋아하고 잘하는지\n모르겠다면',
    art: 'result',
    tone: 'y',
    artLabel: '예시 화면: 검사 결과지의 나에게 맞는 직무 3가지',
    title: '검사 한 번으로\n나에게 맞는 직무 3가지',
    body: '성격·재능·흥미·가치관·업무 환경을 3개 파트, 약 20분 검사로 알아보고 잘 맞는 직무를 이유와 함께 알려 드려요.',
  },
  {
    step: '직업 탐색',
    worry: '어떤 진로가 있는지, 정해도 될지\n모르겠다면',
    art: 'job',
    tone: 'b',
    artLabel: '예시 화면: 진로백과 중·고등학교교사 직업 상세',
    title: '537개 직업을\n미리 들여다봐요',
    body: '되는 길과 연봉, 전문가 전망을 직업마다 한 화면에서 봐요.',
  },
  {
    step: '진로 계획',
    worry: '목표는 있지만 무엇부터\n준비해야 할지 모르겠다면',
    art: 'plan',
    tone: 'p',
    artLabel: '예시 화면: 중·고등학교교사가 되는 준비 순서',
    title: '되는 길을\n순서대로 보여 드려요',
    body: '꼭 거쳐야 하는 자격·시험과 준비 순서를 직업마다 정리했어요. 내 상황에 맞춰 계획으로 옮겨요.',
  },
  {
    step: '진로 실현',
    worry: '노력하고 있지만 맞는 방법인지\n확신이 없다면',
    art: 'today',
    tone: 'g',
    artLabel: '예시 화면: 진로달성 홈의 오늘 할 일과 이번 주 목표',
    title: '계획을\n오늘 할 일로 나눠요',
    body: '오늘 할 일을 하나씩 해내고, 주간결산으로 한 주를 돌아보며 속도를 맞춰요.',
  },
]

export const INTRO_NEXT_PATH = '/onboarding/welcome'

/** 아래 버튼 — 마지막 쪽이면 '확인했어요'로 환영 화면, 아니면 '다음' */
export function introButton(index: number, total = INTRO_SLIDES.length): { label: string; finish: boolean } {
  const finish = index >= total - 1
  return { label: finish ? '확인했어요' : '다음', finish }
}

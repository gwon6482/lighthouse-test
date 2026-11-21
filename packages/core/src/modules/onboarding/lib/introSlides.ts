// 가입 뒤 소개 화면(/onboarding/intro) 6쪽 — 시안 4판(2026-11-22 오너 결정, workspace reviews/2026-11-22-intro-slides-v2.html).
// 1~4쪽은 서비스 네 단계(자기 이해 → 직업 탐색 → 진로 계획 → 진로 실현), 5·6쪽은 실천을 이어 가는 모습(한 주 돌아보기 · 성장 기록).
// 쪽마다 고민 한 줄('…다면')을 받고, 가운데에 실제 화면을 닮게 그린 그림(IntroArt)을 둔다. 여섯 쪽 모두 '중·고등학교 교사' 한 사람의 이야기.
// 2쪽: 연봉은 빼고 직무 정보(주요업무·업무수행능력·흥미)와 적합도(직업 상세의 '나의 추천 진로에 있어요' 배지)를 보인다(11-22 오너).
// 모두에게 같은 순서·같은 내용(개인화 없음) · 건너뛰기 없음 · 마지막(6쪽) 버튼 '확인했어요' → 환영 화면.
// 사실 숫자는 537개·약 20분만 쓴다. 그림 속 날짜·주차·% 는 예시다('예시 화면이에요'). 검사는 자기이해 검사 하나(3개 파트)다.

export type IntroArtKey = 'result' | 'job' | 'plan' | 'today' | 'review' | 'roadmap'

export interface IntroSlide {
  step: string      // 쪽 맨 위 작은 단계 이름(1~4쪽은 JourneyIntro 와 같은 이름)
  worry: string     // 고민 한 줄(\n = 줄바꿈)
  art: IntroArtKey
  tone: 'y' | 'b' | 'p' | 'g' | 'o' | 's' // 그림 상자 색(o 살구 · s 청록 — 5·6쪽)
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
    artLabel: '예시 화면: 진로백과 중·고등학교교사 직업 상세의 하는 일과 필요한 능력',
    title: '537개 직업을\n미리 들여다봐요',
    body: '하는 일과 필요한 능력을 직업마다 정리했어요. 검사 결과에 맞는 직업은 따로 알려 드려요.',
  },
  {
    step: '진로 계획',
    worry: '목표는 있지만 무엇부터\n준비해야 할지 모르겠다면',
    art: 'plan',
    tone: 'p',
    artLabel: '예시 화면: 중·고등학교교사가 되는 준비 순서',
    title: '목표 직업까지 가는 과정을\n순서대로 보여 드려요',
    body: '꼭 거쳐야 하는 자격·시험과 준비 순서를 직업마다 정리했어요. 내 상황에 맞춰 계획으로 옮겨요.',
  },
  {
    step: '진로 실현',
    worry: '무엇부터 할지 매일\n막막하다면',
    art: 'today',
    tone: 'g',
    artLabel: '예시 화면: 진로달성 홈의 오늘 할 일과 이번 주 목표',
    title: '계획을\n오늘 할 일로 나눠요',
    body: '오늘 할 일과 루틴을 하나씩 해내고, 이번 주 목표가 얼마나 찼는지 바로 봐요.',
  },
  {
    step: '한 주 돌아보기',
    worry: '노력하고 있지만 맞는 방법인지\n확신이 없다면',
    art: 'review',
    tone: 'o',
    artLabel: '예시 화면: 주간결산의 이번 주 성과와 끝낸 항목, 한 줄 메모',
    title: '스스로 피드백하며\n한 주를 돌아봐요',
    body: '한 주 동안 해낸 만큼을 보고 스스로 평가해요. 다음 주 속도도 내가 정해요.',
  },
  {
    step: '성장 기록',
    worry: '하루하루가 어디로 이어지는지\n보이지 않는다면',
    art: 'roadmap',
    tone: 's',
    artLabel: '예시 화면: 중·고등학교교사까지의 로드맵',
    title: '하루하루가 쌓여\n달라진 나를 만들어요',
    body: '해낸 일은 로드맵에 하나씩 쌓여요. 목표까지 어디쯤 왔는지 보며 꾸준히 나아가요.',
  },
]

export const INTRO_NEXT_PATH = '/onboarding/welcome'

/** 아래 버튼 — 마지막 쪽이면 '확인했어요'로 환영 화면, 아니면 '다음' */
export function introButton(index: number, total = INTRO_SLIDES.length): { label: string; finish: boolean } {
  const finish = index >= total - 1
  return { label: finish ? '확인했어요' : '다음', finish }
}

/**
 * 작은 폰에서 그림을 비율 그대로 줄이는 배율(2026-11-20 — 320×568 에서 쪽이 화면보다 길어 제목이 아래로 밀렸다).
 * slideH = 쪽 높이(보이는 곳), contentH = 그림을 원래 크기로 둘 때 쪽 내용 높이, artH = 그림 상자의 원래 높이.
 * 넘치는 만큼 그림만 줄인다. 너무 작아지지 않게 min 아래로는 줄이지 않는다(그때는 쪽 안에서 밀린다).
 */
export function introArtScale(slideH: number, contentH: number, artH: number, min = 0.5): number {
  if (!(artH > 0) || !(slideH > 0)) return 1
  const over = contentH - slideH
  if (over <= 0) return 1
  return Math.max(min, Math.min(1, (artH - over) / artH))
}

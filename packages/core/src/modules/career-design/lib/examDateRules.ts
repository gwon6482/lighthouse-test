// 시험일 역산(2026-11-22)의 기준선·화면 글 — 한 파일에 모은다(검토 뒤 고칠 값이 여기 다 있다).
// 시안: workspace reviews/2026-11-22-exam-date-backplan.html(오너 "이대로 가자"), 진로상담·데이터 평가 검토(같은 날짜의 -counselor.md · -data-evaluator.md).
// 오너 11-22 '1-5 권장대로'(검토 반영안): 큰 시험은 '어디까지 했나요'부터, 판정 세 칸, 낼 수 있는 시간·예시 분량 나란히,
// 모자랄 때 질문형 제목과 순서(이미 공부 → 이번 시험도 → 다른 날짜), 늦는 카드엔 줄 없음. 문구·기준선을 고칠 때는 여기만 고친다.

// ── 판정 기준선(데이터 평가 11-22 — 정한 값이지 데이터에서 나온 값이 아니다) ──
/** 시험 몇 주 전 이상에 끝나면 '여유'(그보다 늦지만 시험 주 안이면 '빠듯') */
export const AHEAD_WEEKS = 2
/** 큰 시험: 낼 수 있는 시간이 남은 분량의 이만큼 이상이면 늦게 끝나도 '빠듯'(아래면 '모자람') */
export const TIGHT_RATIO = 0.8
/** 한국사 → 9급 필기: 한국사 시험이 9급 필기보다 이 날수 안쪽이면 '등급 발표' 줄(제82회 시험 2.13 → 발표 2.26, 2차 자료 — 어림) */
export const GRADE_ANNOUNCE_DAYS = 21

// ── 등급이 필기 전날까지 발표돼야 인정되는 짝(진로상담 11-22 정할 것 6) ──
// 자료에 '이 걸음의 성적이 저 시험 전날까지 나와야 한다'는 칸이 없어 이름·라이브러리 id 로 알아본다(정책브리핑 2026-11-05).
// 자료에 칸이 생기면(예: gradeBefore) 이 표를 지운다
export const GRADE_BEFORE_RULES: { grade: RegExp; exam: RegExp }[] = [
  { grade: /cp\.korean-history|한국사능력검정/, exam: /9급/ },
]

/** 시험 뒤 다음 시험에 맞춰 다시 펼 때, 걸음이 끝난 뒤 이미 지난 주의 이름(할 일 없음) */
export const WAIT_WEEK_TITLE = '다음 시험 기다림'

// ── '이미 공부해 둔 것' 보기(데이터 평가 11-22 — 사용자 말로) ──
// done = 끝낸 단계 수(앞에서부터). 'last' = 마지막 단계만 남김
export const DONE_CHOICES: { key: 'none' | 'basic' | 'past'; label: string; done: number | 'last' }[] = [
  { key: 'none', label: '아직 시작 전이에요', done: 0 },
  { key: 'basic', label: '기본 강의를 한 번 다 들었어요', done: 1 },
  { key: 'past', label: '기출을 한 바퀴 이상 풀었어요', done: 'last' },
]

// ── 화면 글 ──
const josa = (word: string, withBatchim: string, without: string) => {
  const c = word.charCodeAt(word.length - 1)
  return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0 ? withBatchim : without
}
export const COPY = {
  // 속도 고르기 맨 위 묶음
  boxTitle: '시험 날짜',
  boxEmpty: '날짜 넣기',
  boxHint: '날짜는 시험을 여는 기관의 공고에서 확인해요',
  boxApply: '원서 접수는 시험보다 한두 달 먼저 끝나요. 공고에서 접수 기간도 함께 확인해요.',   // 진로상담 꼭 고칠 것 1
  // 사실 상자 — 낼 수 있는 시간과 예시 분량을 나란히(오너 11-22 '1-5 권장대로' 2). 시간은 백 단위 반올림, 실제 쓸 수 있는 주 기준
  headAvail: (md: string, avail: string, need: string) => `${md}까지 낼 수 있는 시간은 ${avail}이에요. 예시 분량은 ${need}이에요.`,
  headWeeks: (name: string, md: string, weeks: number) => (weeks > 0
    ? `${name} ${md}까지 공부할 수 있는 주는 ${weeks}주예요.`   // 분량이 없는 짧은 시험
    : `${name} ${md} 시험까지 공부할 주가 없어요.`),
  headNote: '예시 분량은 전업 1년으로 잡은 양이에요. 잰 값이 아니라서 사람마다 많이 달라요.',
  headShortNote: '걸음 기간은 예시예요.',
  headChoose: '어떻게 할지 고르기',
  // 판정 세 칸(데이터 평가 · 오너 2) — 늦는 카드에는 줄을 달지 않는다(오너 5). 마침표는 쓰는 곳에서 붙인다(띠에는 없음).
  // 분량이 없는 짧은 시험에는 '예시 분량'이라는 말을 쓰지 않는다(코드 검토 11-22)
  verdict: (x: { verdict: 'ahead' | 'tight' | 'short'; spare: number; need: number | null }) => {
    if (x.verdict === 'tight') return '시험 주에 겨우 마쳐요. 빠듯해요'
    if (x.need) return x.verdict === 'ahead' ? `예시 분량을 시험 ${x.spare}주 전에 마쳐요` : '예시 분량을 마치기엔 시험까지 시간이 모자라요'
    return x.verdict === 'ahead' ? `시험 ${x.spare}주 전에 마쳐요` : `시험보다 ${Math.max(1, -x.spare)}주 늦게 끝나요`
  },
  cardEnd: (name: string, ym: string) => `${name} 공부는 ${ym}에 끝나요.`,
  // 모자랄 때 고르기(오너 4) — 제목은 판정이 아니라 질문
  sheetTitle: (md: string, weeks: number) => `${md}까지 ${weeks}주, 어떻게 준비할까요?`,
  sheetOptions: [
    { key: 'studied', label: '이미 공부해 둔 게 있어요', again: '공부해 둔 만큼 다시 고르기', sub: '한 만큼 분량에서 빼요' },
    { key: 'keep', label: '이번 시험도 볼게요', again: '', sub: '시험장 경험도 준비가 돼요. 결과와 상관없이 계획은 이어져요' },
    { key: 'other', label: '다른 날짜에 맞출게요', again: '', sub: '다음 회차나 같은 과목을 보는 다른 시험 날짜를 넣어요. 모르면 비워 둬요' },
  ] as { key: 'studied' | 'keep' | 'other'; label: string; again: string; sub: string }[],
  sheetFaster: (title: string) => `‘${title}’${josa(title, '으로', '로')} 바꾸기`,
  sheetNext: '확인',
  // 이미 공부해 둔 것
  doneTitle: (name: string) => `${name}, 어디까지 했나요?`,
  doneLeft: (hoursLabel: string, rest: string) => (rest ? `남은 ${hoursLabel} · ${rest}` : hoursLabel),
  doneResult: (paceTitle: string, verdict: string) => `‘${paceTitle}’${josa(paceTitle, '이면', '면')} ${verdict}.`,
  doneNote: '스스로 고른 단계로 어림했어요. 첫 주간결산에서 다시 맞출 수 있어요.',   // 진로상담 정할 것 4
  doneApply: '이렇게 할게요',
  // 타임라인
  // 시험 날 표시 — 시험이 둘 이상이면 걸음 이름(괄호 뺀 것)을 앞에 붙여 필기·실기를 가른다
  pin: (md: string, head = '') => (head ? `${head} 시험 ${md}` : `시험 ${md}`),
  pinHead: (name: string) => name.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim(),
  editNote: '지금 배치는 그대로예요. 주간결산에서 속도를 바꾸면 그때 시험일에 맞춰 다시 놓여요.',   // 계획 고치는 중(범위 밖 — 안내만)
  gapWarn: (after: string, before: string, weeks: number) =>
    `${before}${josa(before, '과', '와')} ${after} 시험 사이가 ${after} 준비 기간(${weeks}주)보다 짧아요. ${after} 공부가 시험보다 늦게 끝나요.`,
  spareTitle: (name: string, weeks: number) => `${name} · 시험까지 ${weeks}주 남아요`,
  spareBody: (endMd: string, examMd: string) => `공부는 ${endMd}에 끝나요. 시험은 ${examMd}이에요.`,
  spareTip: '시험 전 주에 기출 한두 회 풀어 봐요.',   // 진로상담 정할 것 5
  spareMove: '시험 직전으로 옮기기',
  spareMoveEffect: (weeks: number, endYm: string, nowYm: string) => weeks > 0
    ? `옮기면 다른 걸음이 ${weeks}주 밀리고, 계획이 ${endYm}에 끝나요(지금 ${nowYm}).`
    : '옮겨도 계획이 끝나는 때는 그대로예요.',
  lateLine: (name: string, md: string, weeks: number) => `${name} 공부가 시험(${md})보다 ${weeks}주 늦게 끝나요.`,
  pairWarn: (after: string, before: string) => `${after}${josa(after, '은', '는')} ${before} 합격 뒤에 봐요. 날짜를 확인해 주세요.`,
  gradeWarn: '한국사 등급은 9급 필기 전날까지 발표돼야 인정돼요. 발표일은 공고에서 확인해요.',   // 진로상담 정할 것 6
  courseWarn: (course: string) => `${course}${josa(course, '이', '가')} 끝나기 전 시험이에요. 날짜를 확인해 주세요.`,
  // 주간결산 4단계(진로상담 정할 것 7)
  reviewLate: (paceTitle: string, name: string, md: string, weeks: number) =>
    `‘${paceTitle}’${josa(paceTitle, '으로', '로')} 바꾸면 ${name} 공부가 ${md} 시험보다 ${weeks}주 늦게 끝나요.`,
  reviewFit: (paceTitle: string, spare: number) => (spare > 0
    ? `‘${paceTitle}’${josa(paceTitle, '을', '를')} 그대로 두면 시험 ${spare}주 전에 끝나요.`
    : `‘${paceTitle}’${josa(paceTitle, '이면', '면')} 시험 주에 끝나요.`),
  // 홈
  ddayBadge: (days: number) => (days === 0 ? '오늘' : `D-${days}`),
  ddayTitle: (name: string) => `${name} 시험`,
  ddayToday: (name: string) => `오늘 ${name} 시험이에요`,
  // 시험 뒤 첫 주간결산(진로상담 정할 것 9 — 합격 여부는 묻지 않는다, '끝났어요'는 걸음을 완료 처리하지 않는다)
  afterTitle: (md: string, name: string) => `${md} ${name}, 수고했어요. 다음은 어떻게 할까요?`,
  afterDateLabel: '다음 시험 날짜',
  afterOptions: [
    { key: 'wait', label: '결과를 기다려요', sub: '그대로 두고 다음 주에 다시 물어요' },
    { key: 'next', label: '다음 시험 날짜 넣기', sub: '새 날짜에 맞춰 다시 놓아요' },
    { key: 'done', label: '이 시험은 끝났어요', sub: '시험 날 표시만 지워요' },
  ] as { key: 'wait' | 'next' | 'done'; label: string; sub: string }[],
}

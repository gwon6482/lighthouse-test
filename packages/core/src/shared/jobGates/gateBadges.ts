// 직업 진입 관문 배지 — 정의는 여기 한 곳(2026-10-27)
//
// 🎨 아이콘: 사용자 자체 아이콘(public/icons/gate-*.svg, 2026-10-28~) — icon = 아이콘 이름(AppIcon). 없으면 emoji 로 대신.
//    색: 아이콘 원본 배경색 계열. 글자로 읽혀야 해서 color 는 같은 계열의 진한 색, bg 는 옅은 색.
//    화면·데이터에서는 배지를 **키**로만 다룬다(이모지를 직접 쓰지 말 것).
export type GateBadgeKey = 'senior' | 'degree' | 'selection' | 'license' | 'experience'

export interface GateBadgeDef {
  key: GateBadgeKey
  label: string
  emoji: string
  icon?: string            // 자체 아이콘 이름(shared/icons — public/icons 파일 이름)
  desc: string             // 한 줄 설명(진로백과·도움말)
  guide: string            // 진로계획 세울 때 강조할 것
  color: string            // 글씨
  bg: string               // 바탕
}

// 순서 = 화면 우선순위(최대 2개 보일 때 앞의 것)
export const GATE_BADGES: GateBadgeDef[] = [
  { key: 'senior', label: '경력직', emoji: '🔝', icon: 'gate-senior', color: '#475569', bg: '#EEF1F5',
    desc: '바로 될 수 없고, 다른 직업에서 경력을 쌓거나 승진해야 해요',
    guide: '바로 될 수 없는 직업이에요. 먼저 시작할 직업을 정하고, 그 일을 하며 경력을 쌓는 계획을 세워 보세요' },
  { key: 'degree', label: '학위 필수', emoji: '🎓', icon: 'gate-degree', color: '#4F46E5', bg: '#EEF0FE',
    desc: '관련 학과(또는 대학원)를 졸업해야만 될 수 있어요',
    guide: '관련 학과 졸업이 먼저예요. 비전공이라면 진학(입시·편입) 준비부터, 재학 중이라면 국가시험 준비를 중심에 두세요' },
  { key: 'selection', label: '선발 시험', emoji: '📝', icon: 'gate-selection', color: '#0F8A7E', bg: '#E2F6F3',
    desc: '정원을 뽑는 경쟁 시험(공무원 공채·임용 등)에 합격해야 해요',
    guide: '선발 시험이 관문이에요. 시험일을 정하고 과목·기출·모의고사 중심으로 짜고, 포트폴리오나 경력 쌓기는 줄이세요' },
  { key: 'license', label: '면허·자격 필수', emoji: '🪪', icon: 'gate-license', color: '#0378B5', bg: '#E2F3FC',
    desc: '면허·자격이 없으면 그 일을 할 수 없어요(지정 교육 이수 포함)',
    guide: '면허·자격이 없으면 일할 수 없어요. 자격 준비(필수 교육·시험)를 계획 맨 앞에 두세요' },
  { key: 'experience', label: '경력 필요', emoji: '⏳', icon: 'gate-experience', color: '#B45309', bg: '#FEF3DC',
    desc: '응시하거나 시작하기 전에 정해진 실무 경력이 있어야 해요',
    guide: '정해진 실무 경력이 있어야 해요. 실무경험 프로젝트를 빼지 말고, 필요한 기간을 먼저 확인하세요' },
]
export const GATE_ORDER = GATE_BADGES.map((b) => b.key)
export const gateBadge = (k: GateBadgeKey) => GATE_BADGES.find((b) => b.key === k)!

export interface JobGateConditions {
  education: 'none' | 'major' | 'graduate'
  training: 'none' | 'designated' | 'residency'
  exam: 'none' | 'license' | 'selection'
  experience: boolean
  other: ('fitness' | 'physical' | 'age' | 'eligibility')[]
  entry: 'direct' | 'senior'
}
export interface JobGate {
  title: string
  badges: GateBadgeKey[]
  conditions: JobGateConditions
  weight: 'heavy' | 'light'   // light = 짧은 교육·시험이면 되는 면허(미용사·지게차 등)
  note: string                // 되는 길 한 줄
  evidence: string            // 근거 문장(고용24)
  source: string
}

export const CONDITION_LABELS = {
  education: { none: '', major: '관련 학과 졸업', graduate: '관련 대학원 졸업' },
  training: { none: '', designated: '지정 교육 이수', residency: '수련(인턴·레지던트 등)' },
  exam: { none: '', license: '면허·자격 시험 합격', selection: '선발 시험 합격' },
  other: { fitness: '체력 시험', physical: '신체검사', age: '연령 기준', eligibility: '응시 자격 제한' },
} as const

/** 배지를 우선순위대로 */
export const sortGateBadges = (b: GateBadgeKey[]) => [...b].sort((x, y) => GATE_ORDER.indexOf(x) - GATE_ORDER.indexOf(y))

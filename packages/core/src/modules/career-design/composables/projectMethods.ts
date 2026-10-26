// 프로젝트 '진행 방식' — 영역(무엇을) × 방식(어떻게). 🧪 시안(2026-10-26, feature/project-method)
//
// 왜: 영역만으로는 "분야지식 → 컴퓨터 구조 기초 학습"을 **어떻게** 하고 **언제 끝났다고 하는지**가 없다.
//   방식을 고르게 하면 물어볼 것(책 이름·시험일·기관…)과 완료 기준이 정해진다.
// 결정(사용자 2026-10-26):
//   - 학습 수단(책·인강·학원·스터디)은 여러 영역에 **중복해서** 나온다 — 정보처리기사도, 자료구조도, SQL 도 인강으로 한다
//   - 모든 영역에 '기타'
//   - 범위 (b): 방식 선택(필수) + 방식별 핵심 입력 1~2개. 진로달성의 완료 체크까지 바꾸는 (c)는 따로
// 직업인 진로과정 조사(랜딩 /career-path)의 11종은 여기로 흩어진다:
//   자격증·어학 → 자격요건 '대상'(방식 아님) / 과목 → 학교 수업 / 책·강의 → 책·교재·인강(지식·기술·자격 공용)
//   포트폴리오·콘텐츠·공모전 → 포트폴리오 / 인턴·동아리·봉사·대외활동 → 실무경험
import type { ProjectCategory } from '../types/career-design'

export type ProjectMethod =
  // 학습 수단 — 여러 영역 공용
  | 'book' | 'lecture' | 'academy' | 'study_group'
  // 영역 고유
  | 'required_course' | 'school' | 'practice'
  | 'personal_project' | 'team_project' | 'contest' | 'content'
  | 'internship' | 'field_practice' | 'parttime' | 'club' | 'activity'
  | 'etc'

/** 방식별로 더 받는 것(핵심 1~2개). 키는 Project.methodDetail 의 키 */
export type MethodField = 'title' | 'link' | 'org' | 'target' | 'deadline' | 'resultUrl' | 'note'

export interface MethodDef {
  value: ProjectMethod
  label: string
  emoji: string
  done: string                       // 완료 기준(사용자에게 보이는 한 줄)
  fields: { key: MethodField; label: string; placeholder: string; required?: boolean; type?: 'text' | 'url' | 'date' }[]
  namePlaceholder: string            // 프로젝트 이름 예시
}

const M: Record<ProjectMethod, MethodDef> = {
  book: {
    value: 'book', label: '책·교재', emoji: '📚', done: '마지막 장까지 읽고 정리하면 완료',
    fields: [{ key: 'title', label: '책 이름', placeholder: '예: 혼자 공부하는 컴퓨터 구조+운영체제', required: true }],
    namePlaceholder: '예: 컴퓨터 구조 책 한 권 끝내기',
  },
  lecture: {
    value: 'lecture', label: '인강', emoji: '🎬', done: '마지막 강까지 들으면 완료',
    fields: [
      { key: 'title', label: '강의 이름', placeholder: '예: 김영한의 스프링 입문', required: true },
      { key: 'link', label: '강의 링크 (선택)', placeholder: 'https://', type: 'url' },
    ],
    namePlaceholder: '예: 스프링 입문 강의 완강',
  },
  academy: {
    value: 'academy', label: '학원·교육과정', emoji: '🏫', done: '과정을 수료하면 완료',
    fields: [{ key: 'org', label: '기관·과정 이름', placeholder: '예: ○○ 국비 백엔드 부트캠프', required: true }],
    namePlaceholder: '예: 백엔드 부트캠프 수료',
  },
  study_group: {
    value: 'study_group', label: '스터디', emoji: '👥', done: '함께 정한 범위를 마치면 완료',
    fields: [{ key: 'target', label: '함께 볼 범위', placeholder: '예: 알고리즘 교재 1~8장', required: true }],
    namePlaceholder: '예: 알고리즘 스터디',
  },
  required_course: {
    value: 'required_course', label: '필수 교육·학점 이수', emoji: '🎓', done: '정해진 교육·학점을 이수하면 완료',
    fields: [{ key: 'org', label: '이수 기관', placeholder: '예: 학점은행제, ○○ 협회 보수교육', required: true }],
    namePlaceholder: '예: 사회복지사 2급 필수 교과목 이수',
  },
  school: {
    value: 'school', label: '학교 수업', emoji: '🏛️', done: '수업을 이수하면 완료',
    fields: [{ key: 'org', label: '학교·학기 (선택)', placeholder: '예: ○○대 2026-2학기' }],
    namePlaceholder: '예: 자료구조 수업 이수',
  },
  practice: {
    value: 'practice', label: '연습 과제', emoji: '🛠️', done: '정한 양을 채우면 완료',
    fields: [{ key: 'target', label: '목표량', placeholder: '예: SQL 문제 50개, 엑셀 실습 20개', required: true }],
    namePlaceholder: '예: SQL 문제 풀이',
  },
  personal_project: {
    value: 'personal_project', label: '개인 프로젝트', emoji: '🧩', done: '결과물을 공개하면 완료',
    fields: [{ key: 'resultUrl', label: '결과물 링크 (완성 후)', placeholder: '깃허브·배포 주소·노션 등', type: 'url' }],
    namePlaceholder: '예: 동네 맛집 지도 웹앱 만들기',
  },
  team_project: {
    value: 'team_project', label: '팀 프로젝트', emoji: '🤝', done: '결과물을 공개하면 완료',
    fields: [
      { key: 'note', label: '내 역할', placeholder: '예: 백엔드 API 담당' },
      { key: 'resultUrl', label: '결과물 링크 (완성 후)', placeholder: '깃허브·배포 주소 등', type: 'url' },
    ],
    namePlaceholder: '예: 사이드 프로젝트 팀 참여',
  },
  contest: {
    value: 'contest', label: '대회·공모전', emoji: '🏆', done: '출품하면 완료',
    fields: [
      { key: 'title', label: '대회 이름', placeholder: '예: 공공데이터 활용 공모전', required: true },
      { key: 'deadline', label: '제출 마감일 (선택)', placeholder: '', type: 'date' },
    ],
    namePlaceholder: '예: 공공데이터 공모전 출품',
  },
  content: {
    value: 'content', label: '콘텐츠 제작', emoji: '🎨', done: '정한 편수를 발행하면 완료',
    fields: [
      { key: 'target', label: '목표 편수', placeholder: '예: 직무 블로그 글 10편', required: true },
      { key: 'link', label: '채널 링크 (선택)', placeholder: '블로그·유튜브 주소', type: 'url' },
    ],
    namePlaceholder: '예: 직무 블로그 연재',
  },
  internship: {
    value: 'internship', label: '인턴십', emoji: '💼', done: '정한 기간을 채우면 완료',
    fields: [{ key: 'org', label: '회사·기관 (선택)', placeholder: '예: ○○ 스타트업' }],
    namePlaceholder: '예: 개발 인턴 3개월',
  },
  field_practice: {
    value: 'field_practice', label: '현장실습', emoji: '🏥', done: '정해진 실습 시간을 채우면 완료',
    fields: [{ key: 'org', label: '실습 기관 (선택)', placeholder: '예: ○○ 노인복지관' }],
    namePlaceholder: '예: 사회복지 현장실습 120시간',
  },
  parttime: {
    value: 'parttime', label: '아르바이트·계약직', emoji: '🧾', done: '정한 기간을 채우면 완료',
    fields: [{ key: 'org', label: '일하는 곳 (선택)', placeholder: '예: ○○ 세무사무소' }],
    namePlaceholder: '예: 세무사무소 신고 시즌 아르바이트',
  },
  club: {
    value: 'club', label: '동아리·커뮤니티', emoji: '🧑‍🤝‍🧑', done: '정한 활동 기간을 채우면 완료',
    fields: [{ key: 'org', label: '동아리·모임 이름 (선택)', placeholder: '예: 연합 개발 동아리' }],
    namePlaceholder: '예: 개발 동아리 한 학기 활동',
  },
  activity: {
    value: 'activity', label: '봉사·대외활동', emoji: '🌱', done: '정한 기간·시간을 채우면 완료',
    fields: [{ key: 'org', label: '단체·활동 이름 (선택)', placeholder: '예: ○○ 기업 서포터즈' }],
    namePlaceholder: '예: 기업 서포터즈 활동',
  },
  etc: {
    value: 'etc', label: '기타', emoji: '✨', done: '스스로 정한 기준을 채우면 완료',
    fields: [{ key: 'note', label: '어떻게 진행하나요?', placeholder: '예: 현직자 멘토링 4회', required: true }],
    namePlaceholder: '예: 현직자 멘토링 받기',
  },
}

/** 영역별 진행 방식 — 순서 = 화면 순서. 마지막은 항상 기타 */
export const METHODS_BY_CATEGORY: Record<ProjectCategory, ProjectMethod[]> = {
  qualification: ['book', 'lecture', 'academy', 'required_course', 'etc'],
  knowledge: ['book', 'lecture', 'school', 'academy', 'study_group', 'etc'],
  skill: ['lecture', 'book', 'academy', 'practice', 'study_group', 'etc'],
  portfolio: ['personal_project', 'team_project', 'contest', 'content', 'etc'],
  experience: ['internship', 'field_practice', 'parttime', 'club', 'activity', 'etc'],
}

export const methodDef = (m?: ProjectMethod | null) => (m ? M[m] : undefined)
export const methodsOf = (c?: ProjectCategory) => METHODS_BY_CATEGORY[c ?? 'knowledge'].map((m) => M[m])
export const methodFits = (c?: ProjectCategory, m?: ProjectMethod | null) => !!m && METHODS_BY_CATEGORY[c ?? 'knowledge'].includes(m)

// 자격요건은 방식과 상관없이 끝 = 시험(이수). 시험일을 받으면 타임라인을 시험일에서 거꾸로 맞출 수 있다(다음 단계)
export const QUALIFICATION_EXTRA = { key: 'deadline' as const, label: '시험일 (선택)', type: 'date' as const }

/** 완료 기준 한 줄 — 자격요건은 방식보다 '합격'이 우선 */
export function doneLabel(c?: ProjectCategory, m?: ProjectMethod | null): string {
  if (c === 'qualification' && m !== 'required_course') return '시험에 합격(목표 점수 달성)하면 완료'
  return methodDef(m)?.done ?? ''
}

/** 방식별 필수 입력이 비었는지 — 비었으면 그 칸의 이름 */
export function missingMethodField(m?: ProjectMethod | null, detail?: Partial<Record<MethodField, string>>): string | null {
  const def = methodDef(m)
  if (!def) return null
  const miss = def.fields.find((f) => f.required && !(detail?.[f.key] ?? '').trim())
  return miss ? miss.label : null
}

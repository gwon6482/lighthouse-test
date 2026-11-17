import type { ProjectMethod, MethodField } from '../composables/projectMethods'

// 'experience'(실무경험, 2026-10-25) — 인턴·현장실습·대외활동처럼 '기간·시간을 채우는' 준비물.
//   포트폴리오(결과물이 남음)에 억지로 넣던 것을 분리했다. API enum 에도 있다(lighthouse-api 6035c60)

export type ProjectCategory = 'qualification' | 'knowledge' | 'skill' | 'portfolio' | 'experience'
export type Priority = 'high' | 'normal' | 'low'
export type DayOfWeek = '월' | '화' | '수' | '목' | '금' | '토' | '일'

export interface WeekCurriculum {
  week: number
  title: string
  // 그 주차의 할 일 목록 — **표준**(2026-10-22 사용자 결정: 리스트).
  //   주 N회 실행과 맞물려 회차마다 하나씩 해 나가고, 진로달성의 주차 진행바·주간 리뷰 이월이 항목 단위로 돈다.
  items: string[]
  // 옛 형식. 2026-08-27 ~ 10-22 사이에는 '한 주 = 설명 글 한 덩어리'로 썼다. 읽을 때만 줄 단위로 나눠 항목처럼 쓴다.
  description?: string
  // 과정 프로젝트(2026-11-16)의 주 — items 는 비고 title 이 그 주 '오늘 할 일' 이름이다(lib/period.ts).
  checks?: string[]     // 그 주 주간결산에서 묻는 점검(점검 주에만)
  pause?: boolean       // 쉬는 주 — 오늘 할 일에 나오지 않는다(주간결산 '잠시 쉬어요')
}

export interface Project {
  id: string
  category: ProjectCategory
  name: string
  goal: string
  days: DayOfWeek[]
  duration: number
  priority: Priority
  notification: boolean
  missedNotification: boolean
  notificationTime: string
  memo: string
  source?: string
  field?: string
  level?: string
  weeks?: number
  description?: string
  tags?: string[]
  likes?: number
  views?: number
  curriculum?: WeekCurriculum[]
  // 진행 방식(영역 × 방식, 🧪 시안 2026-10-26) — composables/projectMethods.ts. 새로 만들 땐 필수, 예전·템플릿 프로젝트는 없을 수 있다(= 방식 미정)
  method?: ProjectMethod | null
  methodDetail?: Partial<Record<MethodField, string>>
  // 템플릿에서 온 표시(2026-11-16) — 자동 배치가 쓴다. 서버에는 저장하지 않는다(임시 계획 단계에서만 살아 있다)
  course?: boolean      // 대학·대학원·수련처럼 기간이 정해진 과정
  during?: boolean      // 앞의 과정 기간 안에 하는 프로젝트 — 과정 끝에 맞춰 겹쳐 놓는다
  // 프로젝트 종류 '과정'(2026-11-16, 진로설계 검토 정할 것 1번) — 정해진 곳에 다니는 기간(학교·실습·근무·수련).
  //   주간 할 일 없이 다니는 날 '완료' 한 번(집중모드 없음), 점검은 주간결산, 속도와 상관없이 기간 그대로. 없으면 '진도'(기본)
  period?: boolean
  stoppedAt?: string    // 과정을 그만둔 날('YYYY-MM-DD') — 주간결산 '그만뒀어요'
  // 큰 시험(2026-11-17, 정할 것 2·3 — lib/examPace.ts) — 진로계획 라이브러리의 '첫 시험까지(빠른 경우)' 공부 총량(시간).
  //   속도 고르기·주간결산 속도 바꾸기가 기간을 '분량 ÷ 주당 시간'으로 다시 잡는다. 0·없음 = 보통 프로젝트(사용자가 기간을 직접 고치면 끊는다)
  studyHours?: number
  minAge?: number       // 응시할 수 있는 나이(자료) — 시험 걸음을 그 해로 미룬다(설계 중에만 쓴다)
  firstPassRounds?: number   // 1차 합격 효력이 미치는 2차 회차 수(자료, 회계사·세무사 1차 = 2) — 속도 고르기 사실 한 줄(설계 중에만 쓴다)
  alongside?: string    // 나란히 공부하는 대상 프로젝트 id(7·5급 PSAT ↔ 전문·2차) — 같은 때 시작해 주당 시간을 나눠 쓴다
  examStat?: ExamStat   // 속도 고르기에 보여 줄 합격자 수치(설계 중에만 — 서버에 저장하지 않는다)
}

/** 속도 고르기에 보여 줄 합격자 수치 한 벌(2026-11-17) — 라이브러리 passStats 에서 만든다(lib/examPace.ts examStatOf) */
export interface ExamStat {
  headline: string                  // 요약 한 줄 — 앞에 시험 이름을 붙이지 않는다
  beyondWeeks: number | null        // 시험 기간이 이보다 길면 beyondLine 을 붙인다(7급처럼 근거가 맞지 않는 걸음은 null)
  beyondLine: string | null         // "합격한 사람 10명 중 7명은 2년 안에 붙었어요"
  allWeeks: number | null           // 분포의 끝(4년) — 이보다 길면 allLine
  allLine: string | null            // "합격한 사람 100명 중 97명은 4년 안에 붙었어요"
}

export interface Routine {
  id: string
  name: string
  days: DayOfWeek[]
  duration: number
  notificationTime: string
  notification: boolean
  memo: string
}

// 타임라인 슬롯 — week 는 프로젝트의 **시작 주차**(1-based).
// 주차 경계는 월요일~일요일 달력 주이고, startDate 가 속한 주가 1주차다(usePlanTimeline 이 정본).
// 점유 구간은 저장하지 않고 project.weeks 에서 파생한다(usePlanTimeline 참조).
export interface TimelineSlot {
  week: number
  projects: Project[]
}

export interface TimelineItem {
  projectId: string
  projectName: string
  category: ProjectCategory
  date: string
}

export interface TimelineMonth {
  label: string
  items: TimelineItem[]
}

export interface CareerPlan {
  id: string
  name: string
  targetJob: string
  author: string
  duration: string
  description: string
  tags: string[]
  likes: number
  views: number
  routineCount: number
  projects: Project[]
  timeline: TimelineMonth[]
}

// 수정 시작 시점의 계획(서버 원본) — useCareerDesign.loadPlanFromApi 가 채운다
export interface EditBase {
  name: string
  targetJob: string
  startDate: string
  endDate: string
  reviewDay: DayOfWeek | ''
  projects: Project[]
  routines: Routine[]
  timeline: TimelineSlot[]
}

export interface DraftPlan {
  planId: string | null
  name: string
  targetJob: string
  projects: Project[]
  routines: Routine[]
  startDate: string
  endDate: string
  reviewDay: DayOfWeek | ''  // 주간리뷰 요일. 일주일의 끝이자 시작. 미설정이면 ''
  weeklyHours?: number      // 타임라인 자동 배치 기준 '한 주에 쓸 수 있는 시간'(로컬 임시 계획에만, 서버 저장 안 함)
  paceKey?: string          // 고른 속도 카드(light·steady·focus·full·allin, 로컬만)
  dailyHours?: number       // 올인일 때 하루 시간(주 시간 = 하루 × 6, 로컬만)
  timelineManual?: boolean  // 자동 배치 뒤 타임라인을 직접 옮겼는가(속도를 다시 고를 때 덮어쓰기 안내용, 로컬만)
  editing?: boolean         // 이미 있는 계획을 고치는 중인가(계획 상세 '수정'으로 들어옴, 로컬만) — 단계 순서·완성 화면이 달라진다(useDesignSteps)
  editBase?: EditBase       // 수정을 시작할 때의 원본 — 마칠 때 바뀐 것만 서버에 반영하고(commitEdit), 취소하면 그냥 버린다
  targetJobCode?: string    // 목표 직업의 진로백과 코드(로컬만) — 예시 진로설계(템플릿·도우미 추천)를 이 코드로 찾는다. 직접 적은 목표면 비어 있다
  templateTrack?: string | null   // 템플릿 화면에서 고른 갈래(로컬만) — 도우미 추천이 같은 갈래의 프로젝트를 보여 준다
  timeline: TimelineMonth[]
}

// ── 진로 설계 도우미(베타) — 목표 직업의 예시 진로설계(진로계획 라이브러리)에서 꺼낸 프로젝트 예시 ──
export interface HelperExample {
  id: string
  name: string
  goal: string
  level: '입문' | '중급' | '심화'
  daysPerWeek: number
  minutesPerSession: number
  basis: string            // 왜 권하는지 한 줄(법령 대조 내용·'지원하는 곳에 따라' 같은 안내)
  curriculum: WeekCurriculum[]
  method?: ProjectMethod          // 진행 방식. 없으면 사용자가 고른다
  methodDetail?: Partial<Record<MethodField, string>>
  period?: boolean                // 프로젝트 종류 '과정'(2026-11-16) — 커리큘럼은 lib/period.ts 의 periodCurriculum
  studyHours?: number             // 큰 시험 분량(2026-11-17) — Project.studyHours 로 넘어간다
  minAge?: number
  firstPassRounds?: number
  examStat?: ExamStat
}

export interface HelperJobExamples {
  jobCode: string
  title: string            // 계획의 통칭(예: 마케터)
  examples: Partial<Record<ProjectCategory, HelperExample[]>>
}

// ── 내 진로상황(2026-11-16) — 진로계획을 세울 때 묻고 마이페이지에서 고친다. 서버 User.careerProfile(services/careerProfile.js) ──
//   school: high 고등학생 / hs_grad 고등학교 졸업 / college 대학생(휴학 포함) / college_grad 대학 졸업 / grad_school 대학원생 / grad_done 대학원 졸업
//   (중학생은 대상이 아니다 — 2026-11-16 오너)
export type CareerSchool = 'high' | 'hs_grad' | 'college' | 'college_grad' | 'grad_school' | 'grad_done'
export type CareerRecordKind = 'cert' | 'language' | 'work' | 'activity' | 'award' | 'education' | 'project' | 'etc'
/** 이용자가 적은 경력·성과 — 계획에는 반영하지 않는다(나중에 포트폴리오에 쓴다) */
export interface CareerRecord { id: string; kind: CareerRecordKind; title: string; start: string; end: string; detail: string }
export interface CareerProfile {
  school?: CareerSchool
  year?: number                                   // 대학생 학년 1~4(4 = 4학년 이상)
  major?: string                                  // 학과(선택)
  relatedJobs: { jobCode: string; name: string }[] // "관련 학과예요"라고 답한 목표 직업
  has: { ref: string; name: string }[]            // 이미 해 둔 것 — ref 는 'cp.번호' 또는 '계획 코드:p.번호'
  records: CareerRecord[]
  updatedAt?: string
}


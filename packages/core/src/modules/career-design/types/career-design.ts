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
  fullWeeks?: number       // 원래 길이(주) — 앱의 한 프로젝트 최대(52주)를 넘어 줄여 담았을 때만
}

export interface HelperJobExamples {
  jobCode: string
  title: string            // 계획의 통칭(예: 마케터)
  examples: Partial<Record<ProjectCategory, HelperExample[]>>
}

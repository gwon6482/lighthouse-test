import type { ProjectCategory } from '@/modules/career-design/types/career-design'
import type { ProjectMethod } from '@/modules/career-design/composables/projectMethods'

// ────────────────────────────────────────────────────────────────────────────
// 공통 타입
// ────────────────────────────────────────────────────────────────────────────

/** 순위 항목 — DB는 code만 저장, API 응답 시 name join */
export interface RankItem {
  code: string
  name: string
  score: number
}

/** 카테고리별 순위 데이터 (직업내/직업간 비교 × 중요도/수준) */
export interface CategoryRankings {
  중요도: { 직업내: RankItem[]; 직업간: RankItem[] }
  수준?: { 직업내: RankItem[]; 직업간: RankItem[] }
}

// ────────────────────────────────────────────────────────────────────────────
// 직업 상세 정보
// ────────────────────────────────────────────────────────────────────────────

export interface JobClassification {
  primary: string    // 대분류 (예: 경영·사무·금융·보험직)
  secondary: string  // 중분류 (예: 의회의원·고위공무원 및 기업 고위임원)
}

/** 직업 details — 플랫 구조, 각 카테고리별 중요도/수준 × 직업내/직업간 배열 */
export interface JobDetails {
  '업무수행능력': CategoryRankings
  '지식': CategoryRankings
  '업무환경': CategoryRankings
  '성격': CategoryRankings
  '흥미': CategoryRankings
  '가치관': CategoryRankings
  '업무활동': CategoryRankings
}

export interface JobSalary {
  lower: number   // 하위 25% 임금 (만원)
  median: number  // 중위 임금 (만원)
  upper: number   // 상위 25% 임금 (만원)
}

/** 관련 학과 — 고용24 가 코드+이름으로 준다 */
export interface RelatedMajor {
  code: string | null
  name: string
}

/** 비율 항목 (학력 분포·전공계열 분포). ratio 는 % */
export interface RatioItem {
  key: string
  label: string
  ratio: number
}

/** 일자리 전망 구간 (증가/다소증가/유지/다소감소/감소) */
export interface ProspectBucket {
  name: string
  ratio: number
  year: number | null
}

/**
 * 고용24 공식 API 에서 온 정보.
 * 2026-09-27 전환으로 신설. 크롤링본 시절엔 없던 필드들이다.
 * ⚠️ `dataSource: 'crawled'` 인 직업에는 이 객체가 없다(현재 경기심판 1건).
 */
export interface JobWork24 {
  jobCd: string
  jobNm: string | null
  classification: { large: string | null; middle: string | null; small: string | null }
  keco: { code: string | null; name: string | null } | null
  way: string | null                      // 되는길
  /**
   * '되는 길'을 라이트하우스가 직접 쓴 경우에만 온다(2026-11-14). 고용24 통합조사 묶음은 '되는 길'이 묶음 안 한 직업의 글이라
   * 다른 구성원 화면에 남의 글이 나왔다 — 그런 직업은 서버가 직접 쓴 글로 바꿔 주고 이 표시를 붙인다.
   * basis: law = 법령·국가자격 원문을 읽고 쓴 부분이 있다(sources) / general = 일반적인 경로(공식 자료와 대조하지 않음)
   */
  waySource?: { by: 'lighthouse'; basis: 'law' | 'general'; sources: string[]; caution: string | null; updatedAt: string; reviewed: boolean }
  education: RatioItem[]                  // 학력 분포
  schoolDepartments: RatioItem[]          // 전공 계열 분포
  prospect: { text: string | null; distribution: ProspectBucket[] }
  jobStatus: string | null
  relatedJobs: { jobCd: string | null; jobNm: string }[]
  salarySurveyYear: number | null
  collectedAt: string | null
}

/** 직업 데이터 */
export interface Job {
  _id: string
  jobCode: string
  classification: JobClassification
  title: string
  overview: string               // 직업 개요
  duties: string[]               // 수행직무 목록
  relatedMajors: RelatedMajor[]  // 관련학과 (고용24 는 코드+이름)
  relatedCertifications: string[] // 관련자격
  details: JobDetails            // 능력/지식/환경, 성격/흥미/가치관, 업무활동
  lastUpdated: string
  jobSatisfaction?: number       // 직업 만족도 (백점 기준)
  salary?: JobSalary             // 임금 정보 (만원)

  // ── 2026-09-27 고용24 전환으로 추가 ──
  work24?: JobWork24
  /** work24: 1:1 매핑 / work24-shared: 상위 직업 데이터 공유 / crawled: 전환 전 데이터 */
  dataSource?: 'work24' | 'work24-shared' | 'crawled'
  /** work24-shared 일 때 같은 원본을 쓰는 다른 직업들 */
  sharedWith?: string[]
}

/** GET /api/job/:jobCode 응답 */
export interface JobResponse {
  success: boolean
  data: Job
}

// ────────────────────────────────────────────────────────────────────────────
// 검색 / 추천 (추후 API 연동 시 스펙에 맞게 수정)
// ────────────────────────────────────────────────────────────────────────────

/** 목록에서 사용하는 직업 요약 정보 */
export interface JobSummary {
  jobCode: string
  title: string
  classification: JobClassification
}

/**
 * 검색어가 들어간 분류(2026-11-14 넓은 검색). 1차 분류는 직업이 많아 이름만 오고, 누르면 그 분류의 직업을 따로 받는다.
 * 2차 분류의 직업은 검색 결과(data)에도 이미 들어 있다.
 */
export interface JobSearchGroup {
  level: 'primary' | 'secondary'
  name: string
  primary?: string
  count: number
}

/** GET /api/job/search 응답. groups 는 넓은 검색(include=classification)에서만 온다 */
export interface JobSearchResponse {
  success: boolean
  data: JobSummary[]
  groups?: JobSearchGroup[]
}

/** 진로 둘러보기 항목 — 직업 + 그 직업의 직무(채용 직종 중분류) */
export interface JobExploreItem extends JobSummary {
  group: { code: string; name: string }
  /** 하는 일 요약(한두 문장) — 카드에 한 줄로 */
  overview?: string
}

/** GET /api/job/explore 응답 */
export interface JobExploreResponse {
  success: boolean
  data: JobExploreItem[]
}

/** GET /api/job/recommend 응답 */
export interface JobRecommendResponse {
  success: boolean
  data: JobRecommendItem[]
}

/**
 * 추천 목록 항목. `JobSummary` 에 **묶음 정보**가 붙는다.
 * 고용24가 한 직업으로 묶어 조사한 그룹(전문의 13종 등)은 점수가 완전히 같아서
 * 서버가 한 자리로 접고 `title` 에 그룹 대표명, `members` 에 세부 직업을 담아 준다.
 * ⚠️ `members` 가 2개 이상이면 **고르게 해야 한다** — 안 그러면 누른 이름과 열린 제목이 달라진다.
 */
export interface JobRecommendItem extends JobSummary {
  members?: { jobCode: string; title: string }[]
}

// ────────────────────────────────────────────────────────────────────────────
// 후기
// ────────────────────────────────────────────────────────────────────────────

export type T1GroupCode = 'E' | 'C' | 'S' | 'A' | 'I' | 'R' | 'G' | 'U' | 'T'

export interface JobReview {
  _id: string
  jobCode: string
  summary: string
  satisfaction: number        // 0~100
  pros: string
  cons: string
  recommendation: string
  personalityTags: T1GroupCode[]
  status: 'pending' | 'approved' | 'rejected'
  // 'research' = 랜딩 연구 설문의 현직자 후기(2026-10-15~)
  submittedBy: 'user' | 'admin' | 'research'
  // 공개 응답엔 오지 않는다(API 가 뺀다) — 타입 호환용으로 선택 처리
  submitterEmail?: string
  adminNote?: string
  /** 경력 연차 — 연구 설문 후기에만 있다 */
  careerYears?: 'lt1' | '1to3' | '3to5' | '5to10' | 'gte10'
  /** 선택 서술 — 비어 있을 수 있다 */
  preparation?: string
  dailyLife?: string
  createdAt: string
  updatedAt: string
}

export interface JobReviewResponse {
  success: boolean
  count: number
  data: JobReview[]
}


// ────────────────────────────────────────────────────────────────────────────
// 준비과정 — GET /api/job/:jobCode/preparation (진로계획 라이브러리, 2026-11-15)
// 라이트하우스가 직업 정보·법령·공식 자격 기준으로 정리한 예시 진로설계다(현직자 검토 전).
// 계획 하나가 비슷한 직업 여러 개를 함께 덮는다 — shared 면 plan 이 대표 직업의 것이다
// ────────────────────────────────────────────────────────────────────────────

/** 출처와 대조한 표시 — law: 법령 원문 / official: 기관 공고·과목표 / secondary: 보도·수험 안내 등 */
export interface PrepChecked {
  at: string | null
  level: 'law' | 'official' | 'secondary' | null
  source: string
  note: string | null
}

export interface PrepPhase {
  weeks: number
  title: string
  items: string[]
}

/** 프로젝트 하나 — 여러 직업이 함께 쓰는 보편 프로젝트(cp.*)와 직업 전용(p.*)이 같은 모양이다 */
export interface PrepProject {
  id: string
  name: string
  type: string
  typeName: string | null
  subtype: string | null
  subtypeName: string | null
  category: ProjectCategory
  method: ProjectMethod
  level: string
  daysPerWeek: number
  minutesPerSession: number
  goal: string
  phases: PrepPhase[]
  weeks: number                           // phases 의 주 수 합
  scope: 'all' | 'family' | 'job'         // 거의 모든 진로 / 같은 계열 / 이 직업만
  basis: 'law' | 'practice' | null        // 직업 전용 프로젝트의 근거 — 법령이 정한 요건 / 관행
  options?: string[]
  note?: string
  caution?: string
  checked?: PrepChecked
  course?: boolean                        // 대학·대학원·수련처럼 기간이 정해진 과정(2026-11-16)
  period?: boolean                        // 프로젝트 종류 '과정' — 정해진 곳에 다니는 기간(2026-11-16, 없으면 진도)
  mayHave?: boolean                       // 이미 가지고 있을 수 있는 것 — 운전면허·어학 성적 등(2026-11-16)
  haveLabel?: string                      // 내 진로상황 '이미 해 둔 것' 목록의 이름(토익 점수·운전면허)
  haveByNote?: boolean                    // 항목 메모가 실제 자격 이름이다(간호사 국가시험·지게차운전기능사) — 메모를 먼저 쓴다
  // 큰 시험(2026-11-17, 정할 것 2·3) — '첫 시험까지(빠른 경우)' 공부 총량(시간). 자료의 주 수는 전업(주 48시간) 기준이다.
  // 계획에서는 고른 속도(주당 시간)로 기간을 다시 잡는다(career-design/lib/examPace.ts). 옛 서버는 이 칸이 없다
  studyHours?: number
  minAge?: number       // 응시할 수 있는 나이(공무원 공채 18·교정 20·경위 21 — 시험을 보는 해 기준). 없으면 앱의 이름 규칙
  firstPassRounds?: number   // 1차 합격 효력이 미치는 2차 회차 수(회계사·세무사 1차 = 2 — 그 회와 다음 회)
}

/** 길 위의 한 걸음 — ref 로 projects 에서 프로젝트를 찾는다 */
export interface PrepItem {
  ref: string
  step: number
  major: boolean        // false = 관련 학과 전공자는 건너뛴다(skip 에 이유)
  optional: boolean     // 지원하는 곳에 따라 고른다
  fromTrack: boolean    // 고른 갈래에서만 하는 것
  skip?: string
  note?: string
  during?: boolean      // 앞의 과정 걸음(course) 기간 안에 하는 일 — 기간을 따로 더하지 않는다(2026-11-16)
  skipFor?: 'any'       // 학과와 상관없이 대학에 다니면 건너뛴다(법조). 없으면 관련 학과일 때만
  alongside?: string    // 이 걸음과 나란히 공부하는 걸음의 ref(7·5급 PSAT ↔ 전문과목·2차, 2026-11-17)
  passStat?: string     // 합격자 수치 id → JobPreparation.passStats(잰 시험·걸음에만, 2026-11-17)
}

/** 합격자 수치(2026-11-17) — 합격한 사람만 센 값. 분포가 있으면 평균보다 먼저 쓴다 */
export interface PrepPassStat {
  id: string
  headline: string                                  // 요약 한 줄(연도·대상이 들어 있다 — 앞에 시험 이름을 붙이지 않는다)
  detail: string | null
  measure: string | null                            // 잰 구간(시작 → 합격 등)
  dist: { weeks: number; label: string; pct: number }[] | null   // 누적 비율
  mean: { months: number; label: string } | null
  beyondWeeks: number | null                        // 근거 밖 안내 기준(누적 70%를 처음 넘는 구간)
  source: PrepStatSource
  headlineMean?: string | null                      // 평균만 쓰는 요약 — 7급처럼 분포가 맞지 않는 걸음(오너 결정 8 '평균·출처만')
  alsoSources?: PrepStatSource[]                    // 함께 적은 다른 조사(2017 정부 조사 등)
}
/** via = 기사로만 읽었을 때의 매체·날짜·제목 — 화면에는 매체·날짜만 그린다(기사 제목에 시안이 쓰지 않기로 한 숫자가 있다) */
export interface PrepStatSource { title: string | null; level: string | null; via: string | null; url: string | null; checkedAt: string | null; checkAgainAt: string | null }

/** 선택 항목을 뺀 것. 주 수는 하나씩 차례로 할 때의 합이고, 과정 중에 하는 걸음은 겹쳐 세지 않는다. courseWeeks = 그 가운데 학교·수련 과정 */
export interface PrepSum {
  count: number
  weeks: number
  courseWeeks?: number
  // 2026-11-17 두 칸 — weeks = selfWeeks + periodWeeks. 과정 = '과정' 꼬리표 걸음 전부(학교·수련 course + 과정 period)
  selfWeeks?: number
  periodWeeks?: number
  duringCount?: number      // 과정 안에서 하는 걸음 수(기간은 과정에 들어 있다)
  examHours?: number        // 큰 시험 분량 합(시간) — 있으면 selfWeeksPart 도 온다
  selfWeeksPart?: number    // 큰 시험을 하루 3시간·주 6일로 할 때의 스스로 준비 주 수
}
export interface PrepTotals {
  nonMajor: PrepSum
  major: PrepSum
  optional: number
}

/** 갈래(세부 분야) 하나의 길. 갈래가 없는 계획은 track: null 하나만 온다 */
export interface PrepPath {
  track: string | null
  items: PrepItem[]
  totals: PrepTotals
}

export interface PrepTrack {
  id: string
  name: string
  desc: string
}

export interface JobPreparation {
  jobCode: string
  title: string
  displayName: string   // 화면에 부를 이름 — 대표 직업은 통칭(마케터), 함께 덮는 직업은 제 이름(판사)
  shared: boolean       // 대표 직업의 계획을 통째로 빌려 보는 직업(제 갈래가 따로 없다) — '비슷한 직업의 계획'이라고 알린다
  plan: {
    jobCode: string
    title: string
    displayName: string
    family: string
    familyName: string | null
    status: string
    updatedAt: string | null
    summary: string
    gate: string | null
    caution: string | null
    checked: PrepChecked | null
    // 내 진로상황의 학과 질문에 쓰는 이름 — "간호학과에 다니고 있거나 졸업했나요?"(2026-11-16)
    relatedMajor?: string | null
    // 지원 자격(나이·신체·결격) — 준비를 시작하기 전에 알아야 하는 것(2026-11-16)
    eligibility?: { lines: string[]; checked: PrepChecked | null } | null
    // 먼저 알아 둘 것 — career: 경력을 쌓은 뒤에 가는 직업(via = 먼저 거치는 직업) / early: 대부분 일찍 시작하는 길(2026-11-16)
    reality?: { kind: 'career' | 'early'; text: string; via: { jobCode: string; name: string }[] } | null
  }
  tracks: PrepTrack[]   // 이 직업이 보여 줄 갈래만 온다(같은 계획에 묶인 다른 직업의 길은 빠진다). 하나뿐이면 고르는 단추를 그리지 않는다
  defaultTrack: string | null
  paths: PrepPath[]
  projects: Record<string, PrepProject>
  passStats?: Record<string, PrepPassStat>   // 보여 주는 길에 쓰인 합격자 수치만(2026-11-17 — 옛 서버는 없다)
}

/** 계획이 없는 직업은 data: null */
export interface JobPreparationResponse {
  success: boolean
  data: JobPreparation | null
}

// ────────────────────────────────────────────────────────────────────────────
// 채용 — GET /api/job/:jobCode/recruitment
// 출처(고용24·추후 사람인/잡코리아)를 서버가 같은 모양으로 맞춰 준다. 화면은 source 를 몰라도 그린다
// ────────────────────────────────────────────────────────────────────────────

export interface RecruitmentPosting {
  id: string              // '<source>:<공고번호>'
  source: string          // 'work24' | 'saramin' | 'jobkorea' ...
  sourceName: string      // '고용24'
  title: string
  company: string
  region: string
  salary: string
  career: string
  education: string
  employmentType: string  // 정규직·계약직 등(모르면 '')
  workSchedule?: string   // 주5일근무 등
  postedAt: string        // YYYY-MM-DD
  deadline: { date: string | null; untilFilled: boolean; label: string }
  url: string
  mobileUrl: string
}

export interface RecruitmentSource {
  id: string
  name: string
  ok: boolean
  total: number           // 출처 전체 공고 수(우리가 보여주는 건 일부)
  count: number
  moreUrl: string | null  // 출처 사이트에서 더 보기
  skipped?: string        // 이 직업은 이 출처와 연결할 수 없음
  error?: string
}

/** 기업 공개채용(공채) — 직업이 아니라 직종 '분야'(scope) 단위 */
export interface RecruitmentOpening {
  id: string
  company: string
  companyType: string     // 대기업·공기업·공공기관·중견기업·외국계기업 (빈 값 있음)
  title: string
  startDate: string | null
  endDate: string | null
  employmentTypes: string[]
  logoUrl: string | null
  url: string | null      // 기업 채용 사이트
}

export interface RecruitmentOpeningGroup {
  source: string
  sourceName: string
  total: number
  scope: { code: string; name: string }
  items: RecruitmentOpening[]
}

export interface JobRecruitmentResponse {
  success: boolean
  data: {
    postings: RecruitmentPosting[]
    sources: RecruitmentSource[]
    openings?: RecruitmentOpeningGroup[]
    cached: boolean
  }
}

/** 직무(고용24 채용 직종 중분류) 단위 — data 는 직업 단위와 같은 모양 */
export interface JobGroupRecruitmentResponse extends JobRecruitmentResponse {
  group: { code: string; name: string; fullName: string }
}

// ────────────────────────────────────────────────────────────────────────────
// 세부 진로 페이지 탭 타입
// ────────────────────────────────────────────────────────────────────────────

export type JobDetailTab = 'overview' | 'review' | 'preparation' | 'recruitment'

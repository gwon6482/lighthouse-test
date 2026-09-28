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

/** GET /api/job/search?q=... 응답 */
export interface JobSearchResponse {
  success: boolean
  data: JobSummary[]
}

/** GET /api/job/recommend 응답 */
export interface JobRecommendResponse {
  success: boolean
  data: JobSummary[]
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
  submittedBy: 'user' | 'admin'
  submitterEmail: string
  adminNote: string
  createdAt: string
  updatedAt: string
}

export interface JobReviewResponse {
  success: boolean
  count: number
  data: JobReview[]
}


// ────────────────────────────────────────────────────────────────────────────
// 준비과정 (추후 API 연동 시 스펙에 맞게 수정)
// ────────────────────────────────────────────────────────────────────────────

export interface PreparationCard {
  preparationId: string
  title: string
  description: string
}

export interface JobPreparationResponse {
  success: boolean
  data: PreparationCard[]
}

// ────────────────────────────────────────────────────────────────────────────
// 채용 (추후 API 연동 시 스펙에 맞게 수정)
// ────────────────────────────────────────────────────────────────────────────

export interface RecruitmentCard {
  recruitmentId: string
  companyName: string
  position: string
  deadline: string
}

export interface JobRecruitmentResponse {
  success: boolean
  data: RecruitmentCard[]
}

// ────────────────────────────────────────────────────────────────────────────
// 세부 진로 페이지 탭 타입
// ────────────────────────────────────────────────────────────────────────────

export type JobDetailTab = 'overview' | 'review' | 'preparation' | 'recruitment'

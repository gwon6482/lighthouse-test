import { req } from '@/shared/api'
import type {
  JobResponse,
  JobSearchResponse,
  JobExploreResponse,
  JobRecommendResponse,
  JobReviewResponse,
  JobPreparationResponse,
  JobRecruitmentResponse,
  JobGroupRecruitmentResponse,
} from './types/encyclopedia'
import type { BrowseAxesResponse, BrowseResult } from './types/browse'

/**
 * encyclopediaApi 서비스
 *
 * Lighthouse DB API와 통신하는 서비스 모듈
 * - 직업 상세 조회
 * - 직업 검색
 * - 추천 직업 조회
 * - 후기 / 준비과정 / 채용 조회 (추후 API 확정 시 경로 수정)
 */

/** 직업 상세 조회 GET /api/job/:jobCode */
export const fetchJob = (jobCode: string) =>
  req.get<JobResponse>(`/api/job/${jobCode}`)

/** 직업 이름 검색 GET /api/job/search?name=... — 이름만 본다. ⚠️ 결과가 없으면 404(예외) */
export const searchJobs = (query: string) =>
  req.get<JobSearchResponse>(`/api/job/search`, { params: { name: query } })

/**
 * 넓은 검색(2026-11-14) — 직업 이름 + 2차 분류명 + 일상어 사전(농부 → 작물재배 …), 맞는 1·2차 분류는 groups 로.
 * 결과가 없어도 200. (배포 전 서버는 include 를 몰라 옛 방식으로 답한다 — 결과 없으면 404, groups 없음. 부르는 쪽이 둘 다 받아야 한다)
 */
export const searchJobsWide = (query: string) =>
  req.get<JobSearchResponse>(`/api/job/search`, { params: { name: query, include: 'classification' } })

/** 한 분류의 직업 전체 GET /api/job/search?primary=… | ?secondary=… (이름 그대로) */
export const fetchJobsByClassification = (level: 'primary' | 'secondary', name: string) =>
  req.get<JobSearchResponse>(`/api/job/search`, { params: { [level]: name } })

/** 진로 둘러보기 GET /api/job/explore — 서로 다른 직무에서 직업 하나씩 무작위. 부를 때마다 달라진다 */
export const fetchExploreJobs = (count = 5) =>
  req.get<JobExploreResponse>(`/api/job/explore`, { params: { count } })

/** 분류로 찾기 — 축·보기·보기마다 줄 수 GET /api/job/browse/axes (2026-11-17) */
export const fetchBrowseAxes = () =>
  req.get<BrowseAxesResponse>(`/api/job/browse/axes`)

/**
 * 분류로 찾기 목록 GET /api/job/browse — 조건은 코드로만, 쉼표로 여럿(축끼리 '그리고', 한 축 안 '또는').
 * 모르는 코드는 서버가 버리고 applied.dropped 로 알린다
 */
export const fetchBrowseJobs = (params: Record<string, string | number>, signal?: AbortSignal) =>
  req.get<BrowseResult>(`/api/job/browse`, { params, signal })

/** 추천 진로 조회 GET /api/job/recommend/:survey_id */
export const fetchRecommendedJobs = (surveyId: string) =>
  req.get<JobRecommendResponse>(`/api/job/recommend/${surveyId}`)

/** 직업 후기 목록 조회 GET /api/job/:jobCode/reviews */
export const fetchJobReviews = (jobCode: string) =>
  req.get<JobReviewResponse>(`/api/job/${jobCode}/reviews`)

/** 직업 준비과정(예시 진로설계) GET /api/job/:jobCode/preparation — 진로계획 라이브러리. 계획이 없는 직업은 data: null */
export const fetchJobPreparation = (jobCode: string) =>
  req.get<JobPreparationResponse>(`/api/job/${jobCode}/preparation`)

/** 직업 채용정보 조회 GET /api/job/:jobCode/recruitment */
export const fetchJobRecruitments = (jobCode: string, limit = 10) =>
  req.get<JobRecruitmentResponse>(`/api/job/${jobCode}/recruitment`, { params: { limit } })

/** 직무 채용정보 조회 GET /api/job/groups/:code/recruitment — 결과지 직무 카드의 '채용 공고'(2026-11-09) */
export const fetchJobGroupRecruitments = (code: string, limit = 10) =>
  req.get<JobGroupRecruitmentResponse>(`/api/job/groups/${encodeURIComponent(code)}/recruitment`, { params: { limit } })

/** 진로 뉴스 GET /api/news/career — 진로엔뉴스 RSS 의 제목·날짜·출처·원문 링크만(저작권상 썸네일·요약 없음, 2026-10-29) */
export interface CareerNewsItem { title: string; url: string; publishedAt: string; source: string }
export const fetchCareerNews = (limit = 5) =>
  req.get<{ success: boolean; data: { items: CareerNewsItem[]; source: { name: string; url: string }; cached: boolean } }>('/api/news/career', { params: { limit } })

/** 북마크 목록 조회 GET /api/user/bookmarks (로그인 필요) */
export const fetchBookmarks = () =>
  req.get<{ success: boolean; bookmarkedJobs: { jobCode: string }[] }>('/api/user/bookmarks')

/** 북마크 추가 POST /api/user/bookmarks/:jobCode (로그인 필요) */
export const addBookmark = (jobCode: string) =>
  req.post<{ success: boolean; bookmarkedJobs: string[] }>(`/api/user/bookmarks/${jobCode}`)

/** 북마크 삭제 DELETE /api/user/bookmarks/:jobCode (로그인 필요) */
export const removeBookmark = (jobCode: string) =>
  req.delete<{ success: boolean; bookmarkedJobs: string[] }>(`/api/user/bookmarks/${jobCode}`)

/** 유저 설문 목록 조회 GET /api/user/survey-results (로그인 필요) */
export const fetchUserSurveyResults = () =>
  req.get<{ success: boolean; surveyResults: Array<{ survey_id: string; submitted_at: string }> }>('/api/user/survey-results')

export interface TargetCareer {
  refType: 'jobCode' | 'custom'
  ref: string
  title: string | null
  classification?: { primary: string; secondary: string } | null
}

/** 목표 진로 조회 GET /api/user/target-career (로그인 필요) */
export const fetchTargetCareer = () =>
  req.get<{ success: boolean; targetCareer: TargetCareer | null }>('/api/user/target-career')

/** 목표 진로 설정 PUT /api/user/target-career (로그인 필요) */
export const updateTargetCareer = (data: { refType: 'jobCode' | 'custom'; ref: string } | null) =>
  req.put<{ success: boolean; targetCareer: TargetCareer | null }>('/api/user/target-career', data)

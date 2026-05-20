import { req } from '@/shared/api'
import type {
  JobResponse,
  JobSearchResponse,
  JobRecommendResponse,
  JobReviewResponse,
  JobPreparationResponse,
  JobRecruitmentResponse,
} from './types/encyclopedia'

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

/** 직업 검색 GET /api/job/search?name=... */
export const searchJobs = (query: string) =>
  req.get<JobSearchResponse>(`/api/job/search`, { params: { name: query } })

/** 추천 진로 조회 GET /api/job/recommend/:survey_id */
export const fetchRecommendedJobs = (surveyId: string) =>
  req.get<JobRecommendResponse>(`/api/job/recommend/${surveyId}`)

/** 직업 후기 목록 조회 GET /api/job/:jobCode/reviews */
export const fetchJobReviews = (jobCode: string) =>
  req.get<JobReviewResponse>(`/api/job/${jobCode}/reviews`)

/** 직업 준비과정 조회 GET /api/job/:jobCode/preparation */
export const fetchJobPreparations = (jobCode: string) =>
  req.get<JobPreparationResponse>(`/api/job/${jobCode}/preparation`)

/** 직업 채용정보 조회 GET /api/job/:jobCode/recruitment */
export const fetchJobRecruitments = (jobCode: string) =>
  req.get<JobRecruitmentResponse>(`/api/job/${jobCode}/recruitment`)

/** 북마크 목록 조회 GET /api/user/bookmarks (로그인 필요) */
export const fetchBookmarks = () =>
  req.get<{ success: boolean; bookmarkedJobs: { jobCode: string }[] }>('/api/user/bookmarks')

/** 북마크 추가 POST /api/user/bookmarks/:jobCode (로그인 필요) */
export const addBookmark = (jobCode: string) =>
  req.post<{ success: boolean; bookmarkedJobs: string[] }>(`/api/user/bookmarks/${jobCode}`)

/** 북마크 삭제 DELETE /api/user/bookmarks/:jobCode (로그인 필요) */
export const removeBookmark = (jobCode: string) =>
  req.delete<{ success: boolean; bookmarkedJobs: string[] }>(`/api/user/bookmarks/${jobCode}`)

/** 유저 프로필 조회 GET /api/user/profile (로그인 필요) */
export const fetchUserProfile = () =>
  req.get<{ success: boolean; user: { recommendedJobs: string[] } }>('/api/user/profile')

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

import { req } from '@/shared/api'
import type { SurveyFormResponse, SurveySubmitRequest, SurveySubmitResponse, SurveyAnalysisResponse, T2RecommendResponse, ComprehensiveRecommendResponse } from './types/survey'

/**
 * surveyApi 서비스
 *
 * Lighthouse DB API와 통신하는 서비스 모듈
 * - 설문지 데이터 조회
 * - 설문 응답 제출
 *
 * 개발 환경: 프록시를 통해 http://localhost:3000 접근
 * 프로덕션: 환경변수 VITE_API_BASE_URL 사용
 */

// const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

// API 함수
// export async function fetchSurveyForm(): Promise<SurveyFormResponse> {
//   const res = await fetch(`${API_BASE}/api/survey/form`)
//   if (!res.ok) {
//     throw new Error('설문지를 불러오는데 실패했습니다.')
//   }
//   return res.json()
// }

export const fetchSurveyForm = () => req.get<SurveyFormResponse>(`/api/survey/form`)

// export async function submitSurveyResponse(data: SurveySubmitRequest): Promise<SurveySubmitResponse> {
//   const res = await fetch(`${API_BASE}/api/survey/response`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(data)
//   })
//   return res.json()
// }

export const submitSurveyResponse = (data: SurveySubmitRequest) =>
  req.post<SurveySubmitResponse>(`/api/survey/response`, data)

export const fetchSurveyAnalysis = (surveyId: string) =>
  req.get<SurveyAnalysisResponse>(`/api/survey/analysis/${surveyId}`)

export const fetchT2Recommend = (surveyId: string) =>
  req.get<T2RecommendResponse>(`/api/job/recommend-t2/${surveyId}`)

export const linkSurveyToUser = (survey_id: string) =>
  req.post<{ success: boolean; surveyResults: string[] }>(`/api/user/survey-results`, { survey_id })

export const fetchComprehensiveRecommend = (surveyId: string, limit = 5) =>
  req.get<ComprehensiveRecommendResponse>(`/api/job/recommend/${surveyId}`, { params: { limit } })

export const saveRecommendedJobs = (jobCodes: string[]) =>
  req.post<{ success: boolean; recommendedJobs: string[] }>('/api/user/recommended-jobs', { jobCodes })

/**
 * 회원 탈퇴 DELETE /api/user
 *
 * 🚨 **되돌릴 수 없다. 소프트 삭제가 아니다.**
 * 계정 문서와 함께 검사결과·진로계획·주간일정·진로달성기록·커리큘럼완료·S3 인증사진이
 * **영구 삭제**된다(직업 후기만 본문을 남기고 이메일을 비운다).
 * 개인정보처리방침에 '파기'를 명시했기 때문에 2026-09-25 에 하드 삭제로 전환했다.
 *
 * 응답 `deleted` 에 항목별 삭제 건수가 담겨 온다
 * (photos / surveyResults / reviewsAnonymized / achievementRecords /
 *  curriculumCompletions / weeklySchedules / careerPlans).
 */
export const deleteAccount = () =>
  req.delete<{
    success: boolean
    message: string
    deleted: Record<string, number>
  }>('/api/user')

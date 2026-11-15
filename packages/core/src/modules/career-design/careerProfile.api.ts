// 내 진로상황(2026-11-16) — 서버의 내 정보(User.careerProfile). 통째로 바꾸는 PUT 하나로 저장한다
import { req } from '@/shared/api'
import type { CareerProfile } from './types/career-design'

export interface CareerProfileResponse {
  success: boolean
  careerProfile: CareerProfile | null
  onboardingStatus?: number | null   // 가입 때 고른 지금 상황(1 중·고등학생 · 2 대학생 · 3 취업 준비 중 · 4 일하는 중)
}

export const fetchCareerProfile = () => req.get<CareerProfileResponse>('/api/user/career-profile')
export const putCareerProfile = (profile: CareerProfile) => req.put<CareerProfileResponse>('/api/user/career-profile', profile)
export const deleteCareerProfile = () => req.delete<CareerProfileResponse>('/api/user/career-profile')

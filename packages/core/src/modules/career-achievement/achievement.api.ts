import { req } from '@/shared/api'
import type { ProjectCategory } from '@/modules/career-design/types/career-design'

// 서버 AchievementRecord 1건 (user_data.achievement_records)
export interface AchievementRecordDto {
  date: string
  itemType: 'project' | 'routine'
  itemId: string
  done: boolean
  itemName?: string
  itemCategory?: ProjectCategory | ''
  duration?: number
  elapsedSec?: number
  doneAt?: string | null
  photoUrl?: string
  difficulty?: 1 | 2 | 3 | 4 | 5 | null
  note?: string
  curriculumWeek?: number | null
}

export interface CurriculumItemDto {
  projectId: string
  week: number
  idx: number
  done: boolean
}

// ── 달성 기록 ───────────────────────────────────────────
export async function fetchAchievements(
  planId: string, from?: string, to?: string,
): Promise<AchievementRecordDto[]> {
  const params: Record<string, string> = {}
  if (from) params.from = from
  if (to) params.to = to
  const res = await req.get(`/api/career-plan/${planId}/achievements`, { params })
  return res.data.records ?? []
}

export async function upsertAchievement(
  planId: string,
  date: string,
  itemType: 'project' | 'routine',
  itemId: string,
  body: Partial<AchievementRecordDto>,
): Promise<AchievementRecordDto | null> {
  const res = await req.put(
    `/api/career-plan/${planId}/achievements/${date}/${itemType}/${itemId}`,
    body,
  )
  return res.data.record ?? null
}

export async function deleteAchievement(
  planId: string,
  date: string,
  itemType: 'project' | 'routine',
  itemId: string,
): Promise<boolean> {
  await req.delete(`/api/career-plan/${planId}/achievements/${date}/${itemType}/${itemId}`)
  return true
}

// ── 커리큘럼 완료 ───────────────────────────────────────
export async function fetchCurriculum(planId: string): Promise<CurriculumItemDto[]> {
  const res = await req.get(`/api/career-plan/${planId}/curriculum`)
  return res.data.items ?? []
}

export async function upsertCurriculum(
  planId: string, projectId: string, week: number, idx: number, done: boolean,
): Promise<void> {
  await req.put(`/api/career-plan/${planId}/curriculum/${projectId}/${week}/${idx}`, { done })
}

// ── S3 presigned 업로드 ─────────────────────────────────
export interface PresignResult { uploadUrl: string; fileUrl: string; key: string }

export async function presignUpload(contentType = 'image/jpeg'): Promise<PresignResult> {
  const res = await req.post('/api/career-plan/uploads/presign', { contentType })
  return { uploadUrl: res.data.uploadUrl, fileUrl: res.data.fileUrl, key: res.data.key }
}

// presigned URL 로 Blob 업로드 후 공개 fileUrl 반환. axios 인스턴스(req)는 baseURL/Authorization
// 이 붙으므로 S3 PUT 에는 순수 fetch 사용.
export async function uploadPhoto(blob: Blob, contentType = 'image/jpeg'): Promise<string> {
  const { uploadUrl, fileUrl } = await presignUpload(contentType)
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: blob,
  })
  if (!putRes.ok) throw new Error(`S3 업로드 실패: ${putRes.status}`)
  return fileUrl
}

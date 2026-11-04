// 진로계획 휴지통(2026-11-04) — 삭제는 30일 보관, 그 안에 되돌릴 수 있다(API services/planTrash)
import { req } from '@/shared/api'

export interface DeletedPlan {
  planId: string
  name: string
  targetJob: string
  statusBeforeDelete: string
  deletedAt: string
  purgeAt: string
  projectCount: number
}

export async function deletePlan(planId: string): Promise<{ purgeAt: string; trashDays: number }> {
  const res = await req.delete(`/api/career-plan/${planId}`)
  return { purgeAt: res.data.purgeAt, trashDays: res.data.trashDays ?? 30 }
}

export async function fetchDeletedPlans(): Promise<{ trashDays: number; plans: DeletedPlan[] }> {
  const res = await req.get('/api/career-plan/deleted')
  return { trashDays: res.data.trashDays ?? 30, plans: res.data.plans ?? [] }
}

// 되돌리기 — 원래 진행 중이던 계획인데 다른 계획이 진행 중이면 서버가 409 로 묻는다 → 사용자에게 확인하고 makeActive 로 다시
export type RestoreResult = { ok: true; status: string } | { ok: false; conflict: { name: string; targetJob: string } }
export async function restorePlan(planId: string, makeActive?: boolean): Promise<RestoreResult> {
  try {
    const res = await req.post(`/api/career-plan/${planId}/restore`, makeActive === undefined ? {} : { makeActive })
    return { ok: true, status: res.data.plan?.status ?? 'draft' }
  } catch (e: any) {
    if (e?.response?.status === 409 && e.response.data?.conflict) return { ok: false, conflict: e.response.data.activePlan ?? { name: '', targetJob: '' } }
    throw e
  }
}

// 되돌리기 전체 흐름(충돌 확인 포함). 취소하면 null
export async function restoreWithConfirm(planId: string): Promise<string | null> {
  const first = await restorePlan(planId)
  if (first.ok) return first.status
  const cur = first.conflict.name || first.conflict.targetJob || '지금 계획'
  const makeActive = confirm(`지금 진행 중인 '${cur}' 대신 이 계획으로 진행할까요?\n\n취소를 누르면 이 계획은 초안으로 되돌려요.`)
  const second = await restorePlan(planId, makeActive)
  return second.ok ? second.status : null
}

// '11월 4일' · 남은 날
export const dateLabel = (iso: string) => { const d = new Date(iso); return `${d.getMonth() + 1}월 ${d.getDate()}일` }
export const daysLeft = (iso: string, now = Date.now()) => Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 86400000))

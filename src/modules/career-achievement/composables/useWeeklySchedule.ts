import { ref } from 'vue'
import { req } from '@/shared/api'

// 한 주의 확정된 일정 1건. BE WeeklySchedule.items 의 1요소.
export interface WeeklyScheduleItem {
  id: string
  itemType: 'project' | 'routine'
  itemId: string
  date: string                  // 'YYYY-MM-DD'
  curriculumWeek?: number | null
  note?: string
}

// 한 주의 확정된 일정 전체. planId + weekStart 로 식별.
export interface WeeklySchedule {
  scheduleId: string
  planId: string
  weekStart: string             // 'YYYY-MM-DD'
  weekEnd:   string             // 'YYYY-MM-DD'
  items: WeeklyScheduleItem[]
  reviewedAt: string | null
  reviewNote: string
  status: 'pending' | 'reviewed'
  createdAt?: string
  updatedAt?: string
}

// 모듈 단위 캐시 — 컴포저블이 여러 컴포넌트에서 사용돼도 같은 ref 공유
const schedules = ref<WeeklySchedule[]>([])

export function useWeeklySchedule() {
  // 그 plan 의 모든 주간 일정 목록 (weekStart desc)
  async function fetchSchedules(planId: string): Promise<WeeklySchedule[]> {
    try {
      const res = await req.get(`/api/career-plan/${planId}/weekly-schedule`)
      schedules.value = res.data.schedules ?? []
      return schedules.value
    } catch {
      return []
    }
  }

  // 특정 주 1건 조회. 없으면 null
  async function fetchScheduleByWeek(planId: string, weekStart: string): Promise<WeeklySchedule | null> {
    try {
      const res = await req.get(`/api/career-plan/${planId}/weekly-schedule/${weekStart}`)
      return res.data.schedule ?? null
    } catch {
      return null
    }
  }

  // 그 주의 일정 신규 생성. 이미 있으면 BE 가 409 와 함께 기존 schedule 을 반환 → 그걸 그대로 반환
  async function createSchedule(
    planId: string,
    weekStart: string,
    weekEnd: string,
    items: WeeklyScheduleItem[] = []
  ): Promise<WeeklySchedule | null> {
    try {
      const res = await req.post(`/api/career-plan/${planId}/weekly-schedule`, {
        weekStart, weekEnd, items
      })
      return res.data.schedule
    } catch (err: any) {
      if (err?.response?.status === 409 && err?.response?.data?.schedule) {
        return err.response.data.schedule
      }
      return null
    }
  }

  // 부분 업데이트 (items / weekEnd / reviewNote / status)
  async function updateSchedule(
    planId: string,
    weekStart: string,
    body: Partial<Pick<WeeklySchedule, 'weekEnd' | 'items' | 'reviewNote' | 'status'>>
  ): Promise<WeeklySchedule | null> {
    try {
      const res = await req.put(`/api/career-plan/${planId}/weekly-schedule/${weekStart}`, body)
      return res.data.schedule
    } catch {
      return null
    }
  }

  async function deleteSchedule(planId: string, weekStart: string): Promise<boolean> {
    try {
      await req.delete(`/api/career-plan/${planId}/weekly-schedule/${weekStart}`)
      return true
    } catch {
      return false
    }
  }

  // ── 헬퍼: weekStart 부터 weekEnd 까지의 날짜별 items 분류 (UI 렌더링 편의) ──
  function itemsByDate(schedule: WeeklySchedule | null): Record<string, WeeklyScheduleItem[]> {
    const map: Record<string, WeeklyScheduleItem[]> = {}
    if (!schedule) return map
    for (const it of schedule.items) {
      ;(map[it.date] ??= []).push(it)
    }
    return map
  }

  return {
    schedules,
    fetchSchedules,
    fetchScheduleByWeek,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    itemsByDate,
  }
}

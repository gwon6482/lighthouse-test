import { ref, watch } from 'vue'
import { fetchCurriculum, upsertCurriculum } from '@/modules/career-achievement/achievement.api'

const STORAGE_KEY = 'lh_curriculum_items_v1'

type ItemMap = Record<string, true>   // key: `${projectId}:${week}:${idx}`

function loadFromStorage(): ItemMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const items = ref<ItemMap>(loadFromStorage())

// localStorage 는 오프라인 캐시 (서버가 source of truth)
watch(items, (v) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)) } catch { /* quota */ }
}, { deep: true })

function itemKey(projectId: string, week: number, idx: number): string {
  return `${projectId}:${week}:${idx}`
}

// 서버 동기화 대상 planId
const activePlanId = ref<string | null>(null)

export function useCurriculumCompletion() {
  async function loadFromServer(planId: string): Promise<void> {
    activePlanId.value = planId
    try {
      const list = await fetchCurriculum(planId)
      const next: ItemMap = {}
      for (const it of list) {
        if (it.done) next[itemKey(it.projectId, it.week, it.idx)] = true
      }
      items.value = next
    } catch { /* 네트워크 실패 시 로컬 캐시 유지 */ }
  }

  function isItemDone(projectId: string, week: number, idx: number): boolean {
    return items.value[itemKey(projectId, week, idx)] === true
  }

  function toggleItem(projectId: string, week: number, idx: number) {
    const key = itemKey(projectId, week, idx)
    const next = { ...items.value }
    const nowDone = !next[key]
    if (next[key]) delete next[key]
    else next[key] = true
    items.value = next

    if (activePlanId.value) {
      upsertCurriculum(activePlanId.value, projectId, week, idx, nowDone).catch(() => {})
    }
  }

  function weekItemsDoneCount(projectId: string, week: number, total: number): number {
    let n = 0
    for (let i = 0; i < total; i++) {
      if (isItemDone(projectId, week, i)) n++
    }
    return n
  }

  return {
    items,
    isItemDone,
    toggleItem,
    weekItemsDoneCount,
    loadFromServer,
  }
}

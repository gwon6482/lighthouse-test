import { ref, watch } from 'vue'

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

watch(items, (v) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)) } catch { /* quota */ }
}, { deep: true })

function itemKey(projectId: string, week: number, idx: number): string {
  return `${projectId}:${week}:${idx}`
}

export function useCurriculumCompletion() {
  function isItemDone(projectId: string, week: number, idx: number): boolean {
    return items.value[itemKey(projectId, week, idx)] === true
  }

  function toggleItem(projectId: string, week: number, idx: number) {
    const key = itemKey(projectId, week, idx)
    const next = { ...items.value }
    if (next[key]) delete next[key]
    else next[key] = true
    items.value = next
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
  }
}

import { ref, watch } from 'vue'
import type { ProjectCategory } from '@/modules/career-design/types/career-design'

const STORAGE_KEY = 'lh_achievement_entries_v1'

export type AchievementItemType = 'project' | 'routine'

export interface AchievementEntry {
  date: string                 // 'YYYY-MM-DD'
  itemType: AchievementItemType
  itemId: string
  itemName: string
  itemCategory?: ProjectCategory
  duration: number             // 계획된 duration(분)
  elapsedSec: number           // 실제 소요시간(초)
  doneAt: string               // ISO timestamp
  photo?: string               // base64 dataURL (가로 1280px 리사이징)
  difficulty: 1 | 2 | 3 | 4 | 5
  note: string
  planId?: string
}

type EntryMap = Record<string, AchievementEntry>   // key: `${date}:${itemType}:${itemId}`

function entryKey(date: string, itemType: AchievementItemType, itemId: string): string {
  return `${date}:${itemType}:${itemId}`
}

function loadFromStorage(): EntryMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const entries = ref<EntryMap>(loadFromStorage())

watch(entries, (v) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)) } catch { /* quota */ }
}, { deep: true })

export function useAchievementEntries() {
  function saveEntry(entry: AchievementEntry) {
    const key = entryKey(entry.date, entry.itemType, entry.itemId)
    entries.value = { ...entries.value, [key]: entry }
  }

  function getEntry(date: string, itemType: AchievementItemType, itemId: string): AchievementEntry | null {
    return entries.value[entryKey(date, itemType, itemId)] ?? null
  }

  function removeEntry(date: string, itemType: AchievementItemType, itemId: string) {
    const key = entryKey(date, itemType, itemId)
    if (!(key in entries.value)) return
    const next = { ...entries.value }
    delete next[key]
    entries.value = next
  }

  function feedSorted(): AchievementEntry[] {
    return Object.values(entries.value).sort((a, b) => b.doneAt.localeCompare(a.doneAt))
  }

  return {
    entries,
    saveEntry,
    getEntry,
    removeEntry,
    feedSorted,
  }
}

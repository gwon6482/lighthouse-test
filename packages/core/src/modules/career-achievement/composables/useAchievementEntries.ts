import { ref, watch } from 'vue'
import type { ProjectCategory } from '@/modules/career-design/types/career-design'
import {
  fetchAchievements, upsertAchievement, deleteAchievement,
  type AchievementRecordDto,
} from '@/modules/career-achievement/achievement.api'

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
  photoUrl?: string            // S3 업로드 URL (이전 base64 → URL 로 교체)
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

// localStorage 는 오프라인 캐시 (서버가 source of truth)
watch(entries, (v) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)) } catch { /* quota */ }
}, { deep: true })

// 서버 동기화 대상 planId
const activePlanId = ref<string | null>(null)

// 서버 record → AchievementEntry 변환 (doneAt 있는 = 인증 기록만 entry 로 취급)
function recordToEntry(r: AchievementRecordDto): AchievementEntry | null {
  if (!r.doneAt) return null
  return {
    date: r.date,
    itemType: r.itemType,
    itemId: r.itemId,
    itemName: r.itemName ?? '',
    itemCategory: (r.itemCategory || undefined) as ProjectCategory | undefined,
    duration: r.duration ?? 0,
    elapsedSec: r.elapsedSec ?? 0,
    doneAt: r.doneAt,
    photoUrl: r.photoUrl || undefined,
    difficulty: (r.difficulty ?? 3) as 1 | 2 | 3 | 4 | 5,
    note: r.note ?? '',
  }
}

export function useAchievementEntries() {
  async function loadFromServer(planId: string): Promise<void> {
    activePlanId.value = planId
    try {
      const records = await fetchAchievements(planId)
      const next: EntryMap = {}
      for (const r of records) {
        const e = recordToEntry(r)
        if (e) next[entryKey(e.date, e.itemType, e.itemId)] = e
      }
      entries.value = next
    } catch { /* 네트워크 실패 시 로컬 캐시 유지 */ }
  }

  function saveEntry(entry: AchievementEntry) {
    const key = entryKey(entry.date, entry.itemType, entry.itemId)
    entries.value = { ...entries.value, [key]: entry }

    const planId = activePlanId.value ?? entry.planId
    if (planId) {
      upsertAchievement(planId, entry.date, entry.itemType, entry.itemId, {
        done: true,
        itemName: entry.itemName,
        itemCategory: entry.itemCategory ?? '',
        duration: entry.duration,
        elapsedSec: entry.elapsedSec,
        doneAt: entry.doneAt,
        photoUrl: entry.photoUrl ?? '',
        difficulty: entry.difficulty,
        note: entry.note,
      }).catch(() => {})
    }
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

    if (activePlanId.value) {
      deleteAchievement(activePlanId.value, date, itemType, itemId).catch(() => {})
    }
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
    loadFromServer,
  }
}

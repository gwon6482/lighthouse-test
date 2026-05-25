import { ref } from 'vue'

const STORAGE_KEY = 'lh_dev_today'

function readStored(): string | null {
  try { return localStorage.getItem(STORAGE_KEY) } catch { return null }
}

const devDate = ref<string | null>(readStored())

export function setDevDate(dateStr: string | null) {
  try {
    if (dateStr) localStorage.setItem(STORAGE_KEY, dateStr)
    else localStorage.removeItem(STORAGE_KEY)
  } catch { /* quota */ }
  devDate.value = dateStr
}

export function useDevDate() {
  return { devDate, setDevDate }
}

/**
 * 앱 전역에서 "오늘"을 가져올 때 사용.
 * dev date가 설정되어 있으면 그 날짜를, 아니면 실제 오늘을 반환.
 * 내부에서 devDate.value를 읽으므로 computed 안에서 사용하면 자동 추적된다.
 */
export function getToday(): Date {
  const stored = devDate.value
  if (stored) {
    const [y, m, d] = stored.split('-').map(Number)
    return new Date(y!, m! - 1, d!)
  }
  return new Date()
}

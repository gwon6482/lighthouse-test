import { ref } from 'vue'
import { appDayOf, dateKeyOf } from './appDay'

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
 * dev date가 설정되어 있으면 그 날짜를, 아니면 앱의 하루(appDay.ts — 하루 시작 시각 기준)를 반환.
 * 내부에서 devDate.value를 읽으므로 computed 안에서 사용하면 자동 추적된다.
 * ⚠️ 테스트 날짜(dev date)는 하루 시작 시각만큼 밀지 않는다 — 그 날 00:00 을 그대로 준다(밀면 전날이 된다).
 */
export function getToday(): Date {
  const stored = devDate.value
  if (stored) {
    const [y, m, d] = stored.split('-').map(Number)
    return new Date(y!, m! - 1, d!)
  }
  return appDayOf(new Date())
}

/** 오늘의 날짜 열쇠 'YYYY-MM-DD' — 주소에 날짜가 없을 때의 대체값 등(getToday 와 같은 하루) */
export function getTodayKey(): string {
  return dateKeyOf(getToday())
}

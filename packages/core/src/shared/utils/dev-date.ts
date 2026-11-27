import { ref, computed } from 'vue'
import { onAccountChange } from '@/shared/auth/accountScope'
import { appDayKeyOf, carriedOverLine, dateKeyOf, dateOfKey, type DayStartRule } from './appDay'

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

// ── 앱의 하루(2026-11-26 #102 하루 시작 시간 — 규칙은 appDay.ts) ──────────────
// 계정의 하루 시작 설정(user.settings.dayStart). 앱을 막 열어 계정 정보를 받기 전에도 같은 하루로 보이게 기기에 담아 둔다.
// 계정이 바뀌면 auth 스토어가 setDayStartRule(새 계정 값 또는 null)로 바꾼다.
const RULE_KEY = 'lh_day_start'
function readRule(): DayStartRule | null {
  try {
    const s = localStorage.getItem(RULE_KEY)
    return s ? JSON.parse(s) as DayStartRule : null
  } catch { return null }
}
const dayStartRule = ref<DayStartRule | null>(readRule())

// '오늘'은 정해 둔 때에만 다시 센다(오너 2026-11-26 정할 것 4): 앱을 열 때 · 앱으로 돌아올 때 · 홈으로 올 때 · 설정이 바뀔 때.
// 화면을 쓰는 도중에 하루 시작 시각을 넘겨도 할 일이 바뀌지 않는다(집중 중인 일은 시작한 날의 기록으로 남는다).
const appDayKey = ref(appDayKeyOf(new Date(), dayStartRule.value))
const calendarKey = ref(dateKeyOf(new Date()))

/** 지금 시각으로 앱의 하루를 다시 센다 — 하루가 바뀌었을 때만 화면이 따라 바뀐다 */
export function refreshAppDay(now: Date = new Date()) {
  const k = appDayKeyOf(now, dayStartRule.value)
  if (k !== appDayKey.value) appDayKey.value = k
  const c = dateKeyOf(now)
  if (c !== calendarKey.value) calendarKey.value = c
}

/** 계정의 하루 시작 설정을 바꾼다(auth 스토어가 부른다). null = 로그아웃·설정 없음(기본 시각) */
export function setDayStartRule(rule: DayStartRule | null | undefined) {
  const r = rule && typeof rule === 'object' ? { hour: rule.hour, from: rule.from, since: rule.since } : null
  try {
    if (r) localStorage.setItem(RULE_KEY, JSON.stringify(r))
    else localStorage.removeItem(RULE_KEY)
  } catch { /* 저장소를 못 쓰면 이번 실행 동안만 */ }
  dayStartRule.value = r
  refreshAppDay()
}

// 계정이 바뀌면(로그인·로그아웃·소셜 복귀) 앞 계정의 설정을 비운다 — 새 계정 값은 auth 스토어가 곧 넣는다
onAccountChange(() => setDayStartRule(null))

export function getDayStartRule(): DayStartRule | null {
  return dayStartRule.value
}

// 앱으로 돌아올 때(다른 앱·잠금 화면에서) 다시 센다
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshAppDay()
  })
}

/**
 * 앱 전역에서 "오늘"을 가져올 때 사용.
 * dev date가 설정되어 있으면 그 날짜를, 아니면 앱의 하루(하루 시작 시각 기준, appDay.ts)의 00:00 을 반환.
 * 내부에서 ref 를 읽으므로 computed 안에서 사용하면 자동 추적된다.
 * ⚠️ 테스트 날짜(dev date)는 하루 시작 시각만큼 밀지 않는다 — 그 날 00:00 을 그대로 준다(밀면 전날이 된다).
 */
export function getToday(): Date {
  const stored = devDate.value
  if (stored) {
    const [y, m, d] = stored.split('-').map(Number)
    return new Date(y!, m! - 1, d!)
  }
  return dateOfKey(appDayKey.value)
}

/** 오늘의 날짜 열쇠 'YYYY-MM-DD' — 주소에 날짜가 없을 때의 대체값 등(getToday 와 같은 하루) */
export function getTodayKey(): string {
  return dateKeyOf(getToday())
}

/** 홈의 '아직 11월 25일(수)의 하루예요' 한 줄 — 자정 ~ 하루 시작 시각에만. 테스트 날짜를 쓰는 동안은 보이지 않는다 */
export function useCarriedOverLine() {
  return computed(() => (devDate.value ? '' : carriedOverLine(appDayKey.value, calendarKey.value)))
}

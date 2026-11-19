// 멈춘 집중을 이 기기에만 적어 두는 곳(2026-11-19, 정할 것 8 — 서버로 보내지 않는다). 계산 규칙은 lib/focusSession.ts
// 저장소(localStorage)가 막혀 있으면(사생활 보호 창 등) 화면 안에서만 동작한다 — 읽기·쓰기 모두 조용히 넘긴다
import { ref } from 'vue'
import {
  FOCUS_SESSIONS_KEY, parseSessions, pruneSessions, settleForHome,
  type FocusSession, type FocusSessionMap, type PruneContext,
} from '../lib/focusSession'

function read(): FocusSessionMap {
  try { return parseSessions(localStorage.getItem(FOCUS_SESSIONS_KEY)) } catch { return {} }
}

const sessions = ref<FocusSessionMap>(read())

function write(next: FocusSessionMap) {
  sessions.value = next
  try {
    if (Object.keys(next).length) localStorage.setItem(FOCUS_SESSIONS_KEY, JSON.stringify(next))
    else localStorage.removeItem(FOCUS_SESSIONS_KEY)
  } catch { /* 저장소 없음·가득 참 */ }
}

// 다른 탭에서 바꾸면 다시 읽는다(같은 집중을 두 탭에서 돌리면 마지막에 쓴 쪽이 이긴다)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === FOCUS_SESSIONS_KEY || e.key === null) sessions.value = read()
  })
}

export function useFocusSessions() {
  return {
    sessions,
    get: (key: string): FocusSession | null => sessions.value[key] ?? null,
    put(key: string, s: FocusSession) { write({ ...sessions.value, [key]: s }) },
    remove(key: string) {
      if (!(key in sessions.value)) return
      const next = { ...sessions.value }
      delete next[key]
      write(next)
    },
    // 홈에 올 때 — 흐르던 것은 지금까지 세고 멈춤으로
    settleAll(now: number) {
      const cur = sessions.value
      if (!Object.values(cur).some((s) => s.state === 'running')) return
      const next: FocusSessionMap = {}
      for (const [k, s] of Object.entries(cur)) next[k] = settleForHome(s, now)
      write(next)
    },
    // ⚠️ 계획을 제대로 불러온 경우에만(연결 실패 = 계획 null 이라 그때 지우면 안 된다)
    prune(ctx: PruneContext) {
      const cur = sessions.value
      const next = pruneSessions(cur, ctx)
      if (Object.keys(next).length !== Object.keys(cur).length) write(next)
    },
    clear() { write({}) },
  }
}

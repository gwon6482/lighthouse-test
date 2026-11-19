// 직업 상세 — 다른 화면(관련 직업·비슷한 직업 칩·채용 공고 등)에 갔다가 뒤로 오면 읽던 탭과 자리를 되살린다(2026-11-19 다듬기 3차, 사용성 QA).
// 라우터는 모든 이동에서 맨 위로 간다(createRouter scrollBehavior). 직업 상세는 같은 화면을 다시 쓰고 자료를 새로 읽어서
// 돌아오는 순간엔 화면이 짧다 — 자료를 다 그린 뒤 자리를 되살린다.
// 떠날 때의 스크롤은 vue-router 가 history.state.scroll 에 남긴다(push 할 때 지금 항목에 적는다). 탭은 우리가 이 탭(sessionStorage)에 남긴다.
import type { JobDetailTab } from '../types/encyclopedia'

const KEY = 'lh_job_detail_return'
const TTL_MS = 30 * 60 * 1000
const TABS: JobDetailTab[] = ['overview', 'review', 'preparation', 'recruitment']

type Saved = Record<string, { tab: JobDetailTab; y: number; at: number }>

function readAll(): Saved {
  try { return JSON.parse(sessionStorage.getItem(KEY) || '{}') ?? {} } catch { return {} }
}

/** 떠날 때 — 이 주소(직업)의 탭과 스크롤. 몇 개만 둔다 */
export function saveDetailReturn(path: string, tab: JobDetailTab, y: number, now = Date.now()) {
  const all = readAll()
  all[path] = { tab, y: Math.max(0, Math.round(y)), at: now }
  const keep = Object.entries(all).sort((a, b) => b[1].at - a[1].at).slice(0, 10)
  try { sessionStorage.setItem(KEY, JSON.stringify(Object.fromEntries(keep))) } catch { /* 저장이 막히면 지키지 못할 뿐 */ }
}

/**
 * 돌아왔을 때 되살릴 것 — 뒤로·앞으로 가기(브라우저 기록을 거슬러 온 것)일 때만. 새로 눌러 들어온 것이면 null(맨 위에서 시작)
 * @param state history.state — vue-router 가 기록 항목마다 { back, current, forward, scroll } 을 둔다. forward 가 있으면 기록을 거슬러 온 것
 */
export function takeDetailReturn(path: string, state: unknown, now = Date.now()): { tab: JobDetailTab; y: number } | null {
  const st = (state ?? {}) as { forward?: unknown; scroll?: { top?: unknown } | null }
  if (!st.forward) return null
  const all = readAll()
  const saved = all[path]
  if (saved) {
    delete all[path]
    try { sessionStorage.setItem(KEY, JSON.stringify(all)) } catch { /* 없음 */ }
  }
  const fresh = saved && now - saved.at <= TTL_MS ? saved : null
  const y = Number(st.scroll?.top ?? fresh?.y ?? 0) || 0
  const tab = fresh && TABS.includes(fresh.tab) ? fresh.tab : 'overview'
  if (!y && tab === 'overview') return null
  return { tab, y: Math.max(0, y) }
}

/**
 * 화면이 그만큼 길어지면 그 자리로 — 탭 안 자료(준비과정·채용)는 늦게 그려질 수 있어 잠깐 기다린다.
 * 사용자가 먼저 스크롤하면(손가락·휠·키) 그만둔다. 끝까지 안 길어지면 갈 수 있는 데까지
 */
export function restoreScrollWhenReady(y: number, timeoutMs = 3000): () => void {
  let done = false
  const stop = () => {
    done = true
    for (const ev of ['touchstart', 'wheel', 'keydown'] as const) window.removeEventListener(ev, stop)
  }
  for (const ev of ['touchstart', 'wheel', 'keydown'] as const) window.addEventListener(ev, stop, { passive: true })
  const started = Date.now()
  const tick = () => {
    if (done) return
    const max = document.documentElement.scrollHeight - window.innerHeight
    if (max >= y || Date.now() - started > timeoutMs) {
      window.scrollTo(0, Math.min(y, Math.max(0, max)))
      stop()
      return
    }
    window.setTimeout(tick, 80)
  }
  tick()
  return stop
}

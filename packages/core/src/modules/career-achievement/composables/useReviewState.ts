// 주간결산 상태(한 주 단위) — 팝업을 띄웠는지, 결산을 마쳤는지. 서버 weekly_reviews 가 정본(2026-10-30~)
// (시안 때는 기기 localStorage 에 뒀다)
import { ref, type Ref } from 'vue'
import { fetchWeeklyReview, putWeeklyReview } from '../achievement.api'

interface State { loaded: Ref<boolean>; prompted: Ref<boolean>; done: Ref<boolean>; markPrompted: (extra?: Record<string, unknown>) => void; markDone: () => void }
const cache = new Map<string, State>()

export function reviewState(planId: string, weekStart: string): State {
  const key = `${planId}:${weekStart}`
  let s = cache.get(key)
  if (!s) {
    const loaded = ref(false), prompted = ref(false), done = ref(false)
    fetchWeeklyReview(planId, weekStart)
      .then((r) => { prompted.value = !!r?.promptedAt; done.value = !!r?.completedAt })
      .catch(() => { /* 못 읽으면 안 띄운다 — 아래 loaded 를 true 로 두지 않는다 */ })
      .finally(() => { loaded.value = true })
    s = {
      loaded, prompted, done,
      markPrompted: (extra = {}) => { prompted.value = true; putWeeklyReview(planId, weekStart, { prompted: true, ...extra }).catch(() => {}) },
      markDone: () => { done.value = true },
    }
    cache.set(key, s)
  }
  return s
}

// 주간결산 상태(한 주 단위) — 팝업을 띄웠는지, 결산을 마쳤는지.
// ⚠️ 임시로 이 기기(localStorage)에만 둔다(2026-10-30 시안). 4단계 API 작업에서 서버(그 주 weekly-schedule 의 결산 기록)로 옮긴다
import { ref, type Ref } from 'vue'

const cache = new Map<string, { prompted: Ref<boolean>; done: Ref<boolean>; markPrompted: () => void; markDone: () => void }>()
const read = (k: string) => { try { return localStorage.getItem(k) === '1' } catch { return false } }
const write = (k: string) => { try { localStorage.setItem(k, '1') } catch { /* 저장 못 해도 화면은 된다 */ } }

export function reviewState(planId: string, weekStart: string) {
  const key = `${planId}:${weekStart}`
  let s = cache.get(key)
  if (!s) {
    const pk = `lh_review_prompted_${key}`, dk = `lh_review_done_${key}`
    const prompted = ref(read(pk)), done = ref(read(dk))
    s = { prompted, done, markPrompted: () => { prompted.value = true; write(pk) }, markDone: () => { done.value = true; write(dk) } }
    cache.set(key, s)
  }
  return s
}

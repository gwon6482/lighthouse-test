// 탈퇴 직후 가입 첫 화면에 '탈퇴했어요' 띠를 한 번 보이기(2026-11-21 진로달성·탈퇴 다듬기 A6).
// 기기에 적지 않고 메모리에만 둔다 — 새로 고침하거나 다시 들어오면 보이지 않는다(정한 것)
let pending = false

export function markAccountDeleted() { pending = true }
// 한 번 꺼내면 지운다
export function takeAccountDeleted(): boolean {
  const p = pending
  pending = false
  return p
}

// 화면 아래 잠깐 뜨는 알림 한 줄(2026-11-21 진로달성 다듬기 A4 '기록을 저장했어요').
// 화면을 옮겨도 남도록 App.vue 가 그린다. 모양·자리는 하드웨어 뒤로 두 번의 앱 종료 안내(.exit-toast)와 같다
// action(2026-11-26 #101 '되돌렸어요 · 다시 완료') — 알림 오른쪽 버튼 하나. 누르면 run 을 부르고 알림을 닫는다
import { ref } from 'vue'

export interface ToastAction { label: string; run: () => void }
export const appToast = ref<string | null>(null)
export const appToastAction = ref<ToastAction | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined

export function showToast(text: string, ms = 2000, action?: ToastAction) {
  if (timer) clearTimeout(timer)
  appToast.value = text
  appToastAction.value = action ?? null
  timer = setTimeout(hideToast, ms)
}

export function hideToast() {
  if (timer) clearTimeout(timer)
  timer = undefined
  appToast.value = null
  appToastAction.value = null
}

/** 알림의 버튼을 눌렀다 — 알림을 먼저 닫고 할 일을 한다(두 번 눌리지 않게) */
export function runToastAction() {
  const a = appToastAction.value
  hideToast()
  a?.run()
}

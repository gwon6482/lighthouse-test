// 화면 아래 잠깐 뜨는 알림 한 줄(2026-11-21 진로달성 다듬기 A4 '기록을 저장했어요').
// 화면을 옮겨도 남도록 App.vue 가 그린다. 모양·자리는 하드웨어 뒤로 두 번의 앱 종료 안내(.exit-toast)와 같다
import { ref } from 'vue'

export const appToast = ref<string | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined

export function showToast(text: string, ms = 2000) {
  if (timer) clearTimeout(timer)
  appToast.value = text
  timer = setTimeout(() => { appToast.value = null }, ms)
}

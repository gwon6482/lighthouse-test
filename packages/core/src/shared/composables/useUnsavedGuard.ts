import { onMounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

// 미저장 이탈 가드 — 기준 R2.
// snapshot()으로 "마운트 시점" 폼 상태를 캡처하고, 화면을 떠날 때 값이 바뀌었으면 confirm.
// '이전' 버튼·하드웨어 백·브라우저 백 등 이탈 경로와 무관하게 한 곳에서 잡는다.
// 저장/전진 등 정상 이탈은 bypass()로 통과시킨다.
//
// ⚠️ 컴포넌트 자체 onMounted에서 폼을 초기화한다면, 그 onMounted 등록 "이후"에
//    이 훅을 호출해야 초기화 결과가 기준선(baseline)에 포함된다(등록 순서 = 실행 순서).
export function useUnsavedGuard(
  snapshot: () => string,
  message = '작성 중인 내용이 저장되지 않았어요.\n정말 나가시겠어요?',
) {
  let baseline = ''
  let bypassed = false

  onMounted(() => { baseline = snapshot() })

  onBeforeRouteLeave(() => {
    if (bypassed) return true
    if (snapshot() !== baseline) return confirm(message)
    return true
  })

  return {
    bypass: () => { bypassed = true },
    resync: () => { baseline = snapshot() },
  }
}

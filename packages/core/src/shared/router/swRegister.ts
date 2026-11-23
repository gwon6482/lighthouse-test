// 서비스 워커 등록(vite-plugin-pwa 의 virtual:pwa-register) — swUpdate.ts 가 동적으로 불러 쓴다(2026-11-23).
// 'autoUpdate' 에서 이 함수는 새 서비스 워커가 활성화되면 기본으로 **바로 새로 고친다.** onNeedReload 를 넘겨
// 그 대신 '준비됨'만 표시하고, 실제 새로 열기는 다음 화면 이동 때 swUpdate.ts 가 한다(입력 중인 화면을 지키려고).
// 개발 서버(devOptions)·운영 빌드의 서비스 워커 주소·종류는 플러그인이 맞춘다.
// ⚠️ 이 모듈을 import 하면 플러그인이 index.html 에 registerSW.js 를 넣지 않는다(injectRegister auto → 끔).
//    배포된 옛 index.html(서비스 워커에 담겨 있음)이 부르는 /registerSW.js 는 public/registerSW.js 로 계속 둔다.
import { registerSW } from 'virtual:pwa-register'

export function registerAppSw(h: { onNeedReload: () => void; onRegistered: (r: ServiceWorkerRegistration | undefined) => void; onError: () => void }) {
  registerSW({
    immediate: true,
    onNeedReload: h.onNeedReload,
    onRegisteredSW: (_url, r) => h.onRegistered(r),
    onRegisterError: () => h.onError(),
  })
}

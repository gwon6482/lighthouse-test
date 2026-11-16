// 배포 직후 옛 화면이 지워진 화면 파일(청크)을 부를 때 — 그 주소로 새로 불러와 최신 버전을 받는다(2026-11-03).
//
// 배포는 S3 를 --delete 로 맞추므로 이전 버전 청크가 사라진다. 그런데 CloudFront 는 없는 파일에 index.html 을 200 으로
// 돌려줘서, 이미 열려 있던 옛 화면이 다음 화면 청크를 import 하면 실패하고 **이동이 소리 없이 멈춘다.**
// 홈 화면 앱(PWA)은 서비스워커 때문에 배포 직후 첫 실행이 옛 버전이라 특히 잘 걸렸다(스테이징 2026-11-03, 바로가기 전부 무반응).
//
// ⚠️ 2026-11-17 핫픽스 — 아이폰 사파리에서는 이 복구가 한 번도 돌지 않았다.
//    사파리(WebKit)는 HTML 을 받은 청크를 "'text/html' is not a valid JavaScript MIME type for module script …" 로
//    실패시키는데, 이 문구가 아래 목록에 없었다. 그래서 구글 신규 가입의 '가입 완료'(운영)·'확인했어요'·'검사 시작하기'(스테이징)가
//    눌러도 아무 일이 없었다 — 서버에는 가입 저장이 12번 모두 성공으로 남았다.
//    또 서비스 워커가 옛 화면을 계속 내주면 새로 불러와도 같은 데서 다시 막힌다 →
//    같은 주소에서 곧바로 또 실패하면 앱 캐시를 비우고(서비스 워커 해제 + 캐시 삭제) 한 번 더 새로 불러온다.
//    로그인 토큰은 localStorage 에 있어 앱 캐시를 비워도 남는다.
//
// 판정·반복 방지는 순수 함수로 두고(테스트), 실제 연결은 createRouter.ts 가 한다.

// 브라우저별 동적 import 실패 문구 — Chrome/Edge · Safari(네트워크) · Firefox · MIME(서버가 HTML 을 줌: Chrome · Safari) · Vite 미리 불러오기
const CHUNK_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Expected a JavaScript.*module script|is not a valid JavaScript MIME type|Unable to preload CSS/i

export function isChunkLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '')
  return CHUNK_ERROR.test(msg)
}

export const CHUNK_RELOAD_KEY = 'lh_chunk_reload'
// 새로 불러온 뒤 같은 주소에서 '곧바로 또' 실패했는지 보는 시간. 휴대폰 망에서 다시 불러오기가 느려도 잡히게 넉넉히 둔다(예전 10초)
const RETRY_WINDOW_MS = 60_000

export type ChunkRecovery = 'reload' | 'reset-and-reload' | 'stop'

/**
 * 청크를 못 불러왔을 때 할 일 — 같은 주소에서 곧바로 되풀이되면 한 단계씩 올린다.
 *   1번째: 그 주소로 새로 불러온다(새 버전 index.html 을 받는다)
 *   2번째: 앱 캐시(서비스 워커·캐시)를 비우고 새로 불러온다 — 서비스 워커가 옛 화면을 계속 내주는 경우
 *   3번째: 멈춘다(새 버전에도 파일이 없으면 무한 반복이 된다)
 * 할 일을 정하면 기록을 남긴다. 저장소를 못 쓰면 반복을 막을 수 없으니 멈춘다.
 */
export function nextChunkRecovery(storage: Pick<Storage, 'getItem' | 'setItem'>, path: string, now: number): ChunkRecovery {
  try {
    const prev = JSON.parse(storage.getItem(CHUNK_RELOAD_KEY) ?? 'null') as { path: string; at: number; step?: number } | null
    const step = prev && prev.path === path && now - prev.at < RETRY_WINDOW_MS ? (prev.step ?? 1) + 1 : 1
    if (step > 2) return 'stop'
    storage.setItem(CHUNK_RELOAD_KEY, JSON.stringify({ path, at: now, step }))
    return step === 1 ? 'reload' : 'reset-and-reload'
  } catch {
    return 'stop'
  }
}

/** 앱 캐시 비우기 — 서비스 워커를 해제하고 Cache Storage 를 지운다. 실패해도 부른 쪽은 이어서 새로 불러온다 */
export async function resetAppCache(): Promise<void> {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations()) ?? []
    await Promise.all(regs.map((r) => r.unregister()))
  } catch { /* 지원 안 함·막힘 */ }
  try {
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
  } catch { /* 지원 안 함·막힘 */ }
}

// 배포 직후 옛 화면이 지워진 화면 파일(청크)을 부를 때 — 그 주소로 새로 불러와 최신 버전을 받는다(2026-11-03).
//
// 배포는 S3 를 --delete 로 맞추므로 이전 버전 청크가 사라진다. 그런데 CloudFront 는 없는 파일에 index.html 을 200 으로
// 돌려줘서, 이미 열려 있던 옛 화면이 다음 화면 청크를 import 하면 실패하고 **이동이 소리 없이 멈춘다.**
// 홈 화면 앱(PWA)은 서비스워커 때문에 배포 직후 첫 실행이 옛 버전이라 특히 잘 걸렸다(스테이징 2026-11-03, 바로가기 전부 무반응).
//
// 판정·반복 방지는 순수 함수로 두고(테스트), 실제 연결은 createRouter.ts 가 한다.

// 브라우저별 동적 import 실패 문구 — Chrome/Edge · Safari · Firefox · MIME(서버가 HTML 을 줌) · Vite 미리 불러오기
const CHUNK_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Expected a JavaScript.*module script|Unable to preload CSS/i

export function isChunkLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? '')
  return CHUNK_ERROR.test(msg)
}

export const CHUNK_RELOAD_KEY = 'lh_chunk_reload'
const RETRY_WINDOW_MS = 10_000

/**
 * 새로 고칠지 — 같은 주소로 10초 안에 이미 한 번 새로 고쳤다면 하지 않는다(새 버전에도 파일이 없으면 무한 반복이 된다).
 * 고칠 거면 기록을 남긴다.
 */
export function shouldReloadForChunk(storage: Pick<Storage, 'getItem' | 'setItem'>, path: string, now: number): boolean {
  try {
    const prev = JSON.parse(storage.getItem(CHUNK_RELOAD_KEY) ?? 'null') as { path: string; at: number } | null
    if (prev && prev.path === path && now - prev.at < RETRY_WINDOW_MS) return false
    storage.setItem(CHUNK_RELOAD_KEY, JSON.stringify({ path, at: now }))
    return true
  } catch {
    return false // 저장소를 못 쓰면 반복을 막을 수 없으니 새로 고치지 않는다
  }
}

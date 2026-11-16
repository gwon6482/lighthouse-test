import { describe, it, expect } from 'vitest'
import { isChunkLoadError, nextChunkRecovery } from '../chunkReload'

// 2026-11-03: 배포 직후 홈 화면 앱(옛 버전)에서 바로가기가 전부 무반응 — 지워진 청크를 import 하다 실패했다
// 2026-11-17: 아이폰 사파리는 복구가 아예 안 돌았다 — HTML 을 받은 청크의 사파리 문구를 몰랐다
const memory = () => {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}

describe('isChunkLoadError', () => {
  it('브라우저별 동적 import 실패를 알아본다', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://x/assets/A.js'))).toBe(true)
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true) // iOS Safari(네트워크)
    expect(isChunkLoadError(new TypeError('error loading dynamically imported module'))).toBe(true)
    expect(isChunkLoadError(new Error('Unable to preload CSS for /assets/A.css'))).toBe(true)
  })
  it('서버가 HTML 을 준 청크 — 사파리(WebKit) 문구도 알아본다', () => {
    // WebKit 에서 실측한 문구 그대로(2026-11-17, CloudFront 가 없는 청크에 index.html 을 200 으로 줌)
    expect(isChunkLoadError(new TypeError("'text/html' is not a valid JavaScript MIME type for module script 'https://x/assets/A.js'."))).toBe(true)
  })
  it('다른 오류는 아니다', () => {
    expect(isChunkLoadError(new Error('Network Error'))).toBe(false)
    expect(isChunkLoadError(undefined)).toBe(false)
  })
})

describe('nextChunkRecovery', () => {
  it('처음엔 그 주소로 새로 불러온다', () => {
    expect(nextChunkRecovery(memory(), '/self-understanding/select', 1000)).toBe('reload')
  })
  it('곧바로 또 실패하면 앱 캐시를 비우고, 그래도 실패하면 멈춘다', () => {
    const s = memory()
    expect(nextChunkRecovery(s, '/a', 1000)).toBe('reload')
    expect(nextChunkRecovery(s, '/a', 6000)).toBe('reset-and-reload')
    expect(nextChunkRecovery(s, '/a', 12000)).toBe('stop')
  })
  it('시간이 지나면 처음부터 다시 한다', () => {
    const s = memory()
    nextChunkRecovery(s, '/a', 1000)
    expect(nextChunkRecovery(s, '/a', 1000 + 61_000)).toBe('reload')
  })
  it('다른 주소면 처음부터 다시 한다', () => {
    const s = memory()
    nextChunkRecovery(s, '/a', 1000)
    expect(nextChunkRecovery(s, '/b', 2000)).toBe('reload')
  })
  it('저장소를 못 쓰면 반복을 막을 수 없으니 멈춘다', () => {
    const broken = { getItem: () => { throw new Error('denied') }, setItem: () => {} }
    expect(nextChunkRecovery(broken, '/a', 1000)).toBe('stop')
  })
})

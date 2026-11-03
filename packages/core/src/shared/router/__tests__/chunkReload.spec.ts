import { describe, it, expect } from 'vitest'
import { isChunkLoadError, shouldReloadForChunk } from '../chunkReload'

// 2026-11-03: 배포 직후 홈 화면 앱(옛 버전)에서 바로가기가 전부 무반응 — 지워진 청크를 import 하다 실패했다
const memory = () => {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}

describe('isChunkLoadError', () => {
  it('브라우저별 동적 import 실패를 알아본다', () => {
    expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://x/assets/A.js'))).toBe(true)
    expect(isChunkLoadError(new TypeError('Importing a module script failed.'))).toBe(true) // iOS Safari
    expect(isChunkLoadError(new TypeError('error loading dynamically imported module'))).toBe(true)
  })
  it('다른 오류는 아니다', () => {
    expect(isChunkLoadError(new Error('Network Error'))).toBe(false)
    expect(isChunkLoadError(undefined)).toBe(false)
  })
})

describe('shouldReloadForChunk', () => {
  it('처음엔 새로 고친다', () => {
    expect(shouldReloadForChunk(memory(), '/self-understanding', 1000)).toBe(true)
  })
  it('같은 주소로 10초 안에 또 실패하면 반복하지 않는다', () => {
    const s = memory()
    shouldReloadForChunk(s, '/a', 1000)
    expect(shouldReloadForChunk(s, '/a', 5000)).toBe(false)
    expect(shouldReloadForChunk(s, '/a', 12000)).toBe(true)
  })
  it('다른 주소면 다시 시도한다', () => {
    const s = memory()
    shouldReloadForChunk(s, '/a', 1000)
    expect(shouldReloadForChunk(s, '/b', 2000)).toBe(true)
  })
})

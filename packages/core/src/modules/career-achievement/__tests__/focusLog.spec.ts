import { describe, it, expect } from 'vitest'
import { entryMinutes, minutesByKind, minutesSplitLine, cardName } from '../lib/focusLog'

describe('쌓은 시간(2026-11-26 집중모드 넓히기)', () => {
  it('프로젝트는 집중한 시간, 없으면 계획 시간 — 루틴·바로 집중은 집중한 시간만', () => {
    expect(entryMinutes({ itemType: 'project', elapsedSec: 5520, duration: 90 })).toBe(92)
    expect(entryMinutes({ itemType: 'project', elapsedSec: 0, duration: 90 })).toBe(90)
    expect(entryMinutes({ itemType: 'routine', elapsedSec: 0, duration: 60 })).toBe(0)
    expect(entryMinutes({ itemType: 'free', elapsedSec: 2538, duration: 25 })).toBeCloseTo(42.3, 1)
  })
  it('시안 예시 — 프로젝트 5시간 40분 + 루틴 58·60분 + 바로 집중 42분 = 8시간 20분', () => {
    const by = minutesByKind([
      { itemType: 'project', elapsedSec: 340 * 60, duration: 90 },
      { itemType: 'routine', elapsedSec: 58 * 60, duration: 60 },
      { itemType: 'routine', elapsedSec: 60 * 60, duration: 60 },
      { itemType: 'free', elapsedSec: 42 * 60, duration: 0 },
    ])
    expect(Math.round(by.total)).toBe(500)
    expect(minutesSplitLine(by)).toBe('프로젝트 5시간 40분 · 루틴 1시간 58분 · 바로 집중 42분')
  })
  it('한 종류뿐이면 나눠 보이지 않는다', () => {
    expect(minutesSplitLine(minutesByKind([{ itemType: 'project', elapsedSec: 600, duration: 30 }]))).toBeNull()
    expect(minutesSplitLine(minutesByKind([]))).toBeNull()
    // 1분이 안 되는 것은 종류로 세지 않는다
    expect(minutesSplitLine(minutesByKind([{ itemType: 'project', elapsedSec: 600, duration: 30 }, { itemType: 'free', elapsedSec: 20, duration: 0 }]))).toBeNull()
  })
  it('카드 이름 — 바로 집중을 비우면 바로 집중', () => {
    expect(cardName({ itemType: 'free', itemName: '  ' })).toBe('바로 집중')
    expect(cardName({ itemType: 'free', itemName: 'README 정리' })).toBe('README 정리')
    expect(cardName({ itemType: 'routine', itemName: '코딩 문제 풀기' })).toBe('코딩 문제 풀기')
  })
})

import { describe, expect, it } from 'vitest'
import { lastCheckedIndex, lossLine, moveAheadBack, opensDoneMenu, recordSummary } from '../lib/undoDone'
import { formatMinutes } from '@/modules/encyclopedia/lib/preparation'

describe('끝낸 줄을 누르면(#101)', () => {
  it('메뉴는 기록이 있는 줄 — 프로젝트(진도)는 늘, 루틴·과정은 기록이 있을 때만', () => {
    expect(opensDoneMenu({ type: 'project' }, false)).toBe(true)
    expect(opensDoneMenu({ type: 'routine' }, false)).toBe(false)
    expect(opensDoneMenu({ type: 'period' }, false)).toBe(false)
    // 집중으로 끝낸 루틴(집중모드 넓히기)이 기록을 남기면 같은 메뉴
    expect(opensDoneMenu({ type: 'routine' }, true)).toBe(true)
  })

  it('되돌릴 할 일 칸 = 체크된 마지막 칸', () => {
    expect(lastCheckedIndex(3, (i) => i === 0 || i === 1)).toBe(1)
    expect(lastCheckedIndex(3, (i) => i === 0 || i === 2)).toBe(2)
    expect(lastCheckedIndex(3, () => false)).toBe(-1)
    expect(lastCheckedIndex(0, () => true)).toBe(-1)
  })

  const items = [
    { id: 'a', itemType: 'project' as const, itemId: 'pA', date: '2026-11-26', note: '' },
    { id: 'b', itemType: 'project' as const, itemId: 'pB', date: '2026-11-26', note: 'ahead:2026-11-28' },
    { id: 'c', itemType: 'routine' as const, itemId: 'r1', date: '2026-11-26' },
  ]
  it('미리 하기로 당겨 온 칸 — 원래 요일이 아직 안 지났으면 그 요일로', () => {
    const r = moveAheadBack(items, { itemId: 'pB', today: '2026-11-26', weekEnd: '2026-12-01' })
    expect(r?.to).toBe('2026-11-28')
    expect(r?.items.find((x) => x.id === 'b')).toMatchObject({ date: '2026-11-28', note: '' })
    expect(r?.items).toHaveLength(3)
  })
  it('당겨 온 칸이 아니거나, 원래 요일이 지났거나 주 밖이면 그대로(null)', () => {
    expect(moveAheadBack(items, { itemId: 'pA', today: '2026-11-26', weekEnd: '2026-12-01' })).toBeNull()
    const past = items.map((x) => (x.id === 'b' ? { ...x, note: 'ahead:2026-11-25' } : x))
    expect(moveAheadBack(past, { itemId: 'pB', today: '2026-11-26', weekEnd: '2026-12-01' })).toBeNull()
    expect(moveAheadBack(items, { itemId: 'pB', today: '2026-11-26', weekEnd: '2026-11-27' })).toBeNull()
  })
  it('원래 요일에 이미 그 프로젝트 칸이 있으면(일정이 다시 만들어짐) 오늘 칸만 뺀다', () => {
    const dup = [...items, { id: 'd', itemType: 'project' as const, itemId: 'pB', date: '2026-11-28', note: '' }]
    const r = moveAheadBack(dup, { itemId: 'pB', today: '2026-11-26', weekEnd: '2026-12-01' })
    expect(r?.items.map((x) => x.id)).toEqual(['a', 'c', 'd'])
  })

  it('확인 판 글 — 지워지는 것과 요약(조사 맞춤)', () => {
    expect(lossLine({ minutes: 48, photo: true, note: true }, formatMinutes)).toBe('48분 기록과 사진·메모가 지워져요')
    expect(lossLine({ minutes: 62, photo: true, note: false }, formatMinutes)).toBe('1시간 2분 기록과 사진이 지워져요')
    expect(lossLine({ minutes: 48, photo: false, note: false }, formatMinutes)).toBe('48분 기록이 지워져요')
    expect(lossLine({ minutes: 0, photo: false, note: true }, formatMinutes)).toBe('메모가 지워져요')
    expect(lossLine({ minutes: 0, photo: false, note: false }, formatMinutes)).toBe('')
    expect(recordSummary({ minutes: 48, photo: true, note: true }, formatMinutes)).toBe('오늘 · 48분 · 사진·메모 있음')
    expect(recordSummary({ minutes: 0, photo: false, note: false }, formatMinutes)).toBe('오늘')
  })
})

import { describe, it, expect } from 'vitest'
import { METHODS_BY_CATEGORY, methodsOf, methodFits, doneLabel, missingMethodField } from '../composables/projectMethods'

describe('projectMethods — 영역 × 진행 방식', () => {
  it('모든 영역의 마지막은 기타다(우리가 모르는 방식)', () => {
    for (const list of Object.values(METHODS_BY_CATEGORY)) expect(list[list.length - 1]).toBe('etc')
  })

  it('학습 수단은 여러 영역에 함께 나온다(사용자 결정: 중복 OK)', () => {
    for (const c of ['qualification', 'knowledge', 'skill'] as const) {
      expect(METHODS_BY_CATEGORY[c]).toContain('lecture')
      expect(METHODS_BY_CATEGORY[c]).toContain('book')
    }
  })

  it('영역에 없는 방식은 맞지 않는다고 본다', () => {
    expect(methodFits('portfolio', 'book')).toBe(false)
    expect(methodFits('knowledge', 'book')).toBe(true)
    expect(methodFits('experience', null)).toBe(false)
  })

  it('자격요건은 방식과 상관없이 합격이 완료 기준(필수 교육 이수는 예외)', () => {
    expect(doneLabel('qualification', 'lecture')).toContain('합격')
    expect(doneLabel('qualification', 'required_course')).toContain('이수')
    expect(doneLabel('knowledge', 'book')).toContain('마지막 장')
  })

  it('필수 입력이 비면 그 칸 이름을 돌려준다', () => {
    expect(missingMethodField('book', {})).toBe('책 이름')
    expect(missingMethodField('book', { title: '  ' })).toBe('책 이름')
    expect(missingMethodField('book', { title: '컴퓨터 구조' })).toBeNull()
    expect(missingMethodField('internship', {})).toBeNull()   // 기관은 선택
    expect(missingMethodField('etc', {})).toBe('어떻게 진행하나요?')
  })

  it('목록은 정의된 방식만 담는다', () => {
    for (const c of Object.keys(METHODS_BY_CATEGORY) as (keyof typeof METHODS_BY_CATEGORY)[]) {
      expect(methodsOf(c).every((m) => m && m.label)).toBe(true)
    }
  })
})

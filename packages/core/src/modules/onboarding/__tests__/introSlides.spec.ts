import { describe, expect, it } from 'vitest'
import { INTRO_SLIDES, INTRO_NEXT_PATH, introButton } from '../lib/introSlides'

// 가입 뒤 소개 4쪽(2026-11-20 시안 2판)
describe('소개 쪽', () => {
  it('서비스 네 단계와 한 쪽씩, 4쪽', () => {
    expect(INTRO_SLIDES.map((s) => s.step)).toEqual(['자기 이해', '직업 탐색', '진로 계획', '진로 실현'])
    expect(new Set(INTRO_SLIDES.map((s) => s.art)).size).toBe(4)
  })

  it('고민 문장은 조건문(…다면), 그림마다 화면 읽기 설명이 있다', () => {
    for (const s of INTRO_SLIDES) {
      expect(s.worry.replace(/\n/g, ' ')).toMatch(/다면$/)
      expect(s.artLabel.length).toBeGreaterThan(0)
    }
  })

  it("검사는 하나다 — '5가지 검사' 같은 말을 쓰지 않는다", () => {
    const all = INTRO_SLIDES.map((s) => `${s.title} ${s.body}`).join(' ')
    expect(all).not.toMatch(/5가지|다섯 가지/)
    expect(INTRO_SLIDES[0]!.body).toContain('3개 파트, 약 20분')
  })

  it("1~3쪽은 '다음', 마지막 쪽은 '확인했어요'로 환영 화면", () => {
    expect([0, 1, 2].map((i) => introButton(i))).toEqual(Array(3).fill({ label: '다음', finish: false }))
    expect(introButton(3)).toEqual({ label: '확인했어요', finish: true })
    expect(INTRO_NEXT_PATH).toBe('/onboarding/welcome')
  })
})

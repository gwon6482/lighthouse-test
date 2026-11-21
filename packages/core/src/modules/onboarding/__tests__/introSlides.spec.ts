import { describe, expect, it } from 'vitest'
import { INTRO_SLIDES, INTRO_NEXT_PATH, introArtScale, introButton } from '../lib/introSlides'

// 가입 뒤 소개 6쪽(2026-11-22 시안 4판)
describe('소개 쪽', () => {
  it('서비스 네 단계 + 한 주 돌아보기·성장 기록, 6쪽', () => {
    expect(INTRO_SLIDES.map((s) => s.step)).toEqual(['자기 이해', '직업 탐색', '진로 계획', '진로 실현', '한 주 돌아보기', '성장 기록'])
    expect(INTRO_SLIDES.map((s) => s.art)).toEqual(['result', 'job', 'plan', 'today', 'review', 'roadmap'])
    expect(new Set(INTRO_SLIDES.map((s) => s.tone)).size).toBe(6)
  })

  it("2쪽은 연봉을 말하지 않는다(11-22 오너 — 직무 정보와 적합도가 주인공)", () => {
    const job = INTRO_SLIDES[1]!
    expect(`${job.title} ${job.body}`).not.toMatch(/연봉|만족도/)
    expect(INTRO_SLIDES[2]!.title).not.toContain('되는 길')
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

  it("1~5쪽은 '다음', 마지막 6쪽은 '확인했어요'로 환영 화면", () => {
    expect([0, 1, 2, 3, 4].map((i) => introButton(i))).toEqual(Array(5).fill({ label: '다음', finish: false }))
    expect(introButton(5)).toEqual({ label: '확인했어요', finish: true })
    expect(INTRO_NEXT_PATH).toBe('/onboarding/welcome')
  })
})

describe('작은 폰 그림 배율', () => {
  it('넘치지 않으면 1, 넘치면 넘친 만큼 그림만 줄인다', () => {
    expect(introArtScale(700, 650, 400)).toBe(1)
    expect(introArtScale(500, 600, 400)).toBe(0.75)
  })
  it('최소 배율 아래로는 줄이지 않고, 값이 이상하면 1', () => {
    expect(introArtScale(300, 700, 400)).toBe(0.5)
    expect(introArtScale(0, 700, 400)).toBe(1)
    expect(introArtScale(500, 600, 0)).toBe(1)
  })
})

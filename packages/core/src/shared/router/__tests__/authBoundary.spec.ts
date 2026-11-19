import { describe, it, expect } from 'vitest'
import { authBoundaryAction } from '../authBoundary'

// R5(인증 경계) 회귀 테스트.
// 2026-09-17: 카카오 가입 직후 브라우저 뒤로가기 한 번에 로그아웃되는 사고가 있었다.
// 로그인 화면이 히스토리 바로 뒤에 남는 흐름이 생겼는데 가드가 '뒤로 = 로그아웃'으로
// 단정하고 있었기 때문이다. 아래 케이스가 그 판정을 고정한다.
describe('authBoundaryAction — 로그인 화면에 닿았을 때', () => {
  it('토큰이 없으면 그냥 통과한다 (정상적인 로그인 화면 진입)', () => {
    expect(authBoundaryAction(false, false)).toBe('pass')
  })

  it('토큰이 없으면 logout 표시가 있어도 통과한다 (로그아웃할 것이 없다)', () => {
    expect(authBoundaryAction(false, true)).toBe('pass')
  })

  it('로그인 상태에서 표시 없이 닿으면 로그아웃하지 않고 앱으로 되돌린다', () => {
    // ⚠️ 이게 이번 사고의 핵심이다. 여기서 confirm-logout 이 나오면 회귀다 —
    //    가입 직후 뒤로가기 한 번으로 로그아웃된다.
    expect(authBoundaryAction(true, false)).toBe('bounce')
  })

  it('로그인 상태에서 의도적 이탈(?logout=1)이면 확인 후 로그아웃한다', () => {
    expect(authBoundaryAction(true, true)).toBe('confirm-logout')
  })

  it('로그아웃은 표시가 있을 때만 일어난다 (되돌릴 수 없는 쪽을 기본값으로 두지 않는다)', () => {
    const logoutCases = ([false, true] as const)
      .flatMap((token) => ([false, true] as const).map((wants) => ({
        token, wants, action: authBoundaryAction(token, wants),
      })))
      .filter((c) => c.action === 'confirm-logout')

    expect(logoutCases).toEqual([{ token: true, wants: true, action: 'confirm-logout' }])
  })
})

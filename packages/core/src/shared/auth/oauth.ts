// 소셜 로그인 시작 — 로그인 화면(AuthPage)과 비회원 결과지 잠금 상자가 같이 쓴다
import { req } from '@/shared/api'

export type Provider = 'kakao' | 'google'
export const PROVIDER_LABEL: Record<Provider, string> = { kakao: '카카오', google: '구글' }

/** 서버에서 켜 둔 소셜 로그인. 조회 실패면 모두 끈다 — 눌러도 안 되는 버튼보다 '준비 중'이 낫다 */
export async function fetchProviders(): Promise<Record<Provider, boolean>> {
  try {
    const res = await req.get('/api/auth/providers')
    const data = res.data?.data ?? {}
    return { kakao: !!data.kakao, google: !!data.google }
  } catch {
    return { kakao: false, google: false }
  }
}

/**
 * 서버 302 로 제공자 인가 페이지에 간다. SPA 라우팅이 아니라 **문서 이동**이어야 한다.
 * 복귀 URL 은 서버가 허용목록(OAUTH_ALLOWED_ORIGINS)으로 다시 검사하므로 목록 밖이면 무시된다.
 */
export function startOAuth(provider: Provider) {
  const returnTo = `${window.location.origin}/onboarding/oauth`
  const base = import.meta.env.VITE_API ?? ''
  window.location.href = `${base}/api/auth/${provider}?redirect=${encodeURIComponent(returnTo)}`
}

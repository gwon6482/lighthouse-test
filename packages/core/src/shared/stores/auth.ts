import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { req } from '@/shared/api'

export interface AuthUser {
  uid: string
  email: string
  name?: string
  age?: number
  gender?: 'M' | 'F'
  isActive: boolean
  createdAt: string
  // 가입 위저드에서 받는 진로답변 Q1~Q3. 소셜 가입자는 콜백 시점에 계정만 만들어지므로
  // 이 필드 유무가 곧 '가입 위저드를 마쳤는가'의 판단 기준이 된다.
  onboarding?: {
    status?: number
    concerns?: number[]
    selfAwareness?: number
    answeredAt?: string
  }
  // 소셜 전용 계정에는 provider: 'local' 항목이 없다.
  authProviders?: { provider: string; providerId: string }[]
}

const TOKEN_KEY = 'lh_token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<AuthUser | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  function _applyToken(t: string) {
    token.value = t
    localStorage.setItem(TOKEN_KEY, t)
    req.defaults.headers.common['Authorization'] = `Bearer ${t}`
  }

  async function login(email: string, password: string) {
    const res = await req.post('/api/auth/login', { email, password })
    _applyToken(res.data.token)
    user.value = res.data.user
  }

  // 자동로그인(2026-11-04): 토큰은 90일, 앱이 열릴 때마다 여기서 연장된다(서버가 하루 지난 토큰이면 새 토큰을 준다).
  // ⚠️ 로그아웃은 서버가 '이 토큰은 아니다'라고 할 때만(401 만료·위조, 404 탈퇴한 계정).
  //    예전엔 어떤 에러든 로그아웃해서, 인터넷이 잠깐 끊기거나 배포 중에 앱을 열면 멀쩡한 토큰을 버렸다.
  async function fetchMe(): Promise<'ok' | 'invalid' | 'offline' | 'none'> {
    if (!token.value) return 'none'
    req.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    try {
      const res = await req.get('/api/auth/me')
      user.value = res.data.user
      if (typeof res.data.token === 'string' && res.data.token) _applyToken(res.data.token)
      return 'ok'
    } catch (e: any) {
      const status = e?.response?.status
      if (status === 401 || status === 404) {
        logout()
        return 'invalid'
      }
      return 'offline' // 토큰은 지키고, 다음에 열 때 다시 확인
    }
  }

  function setAuth(t: string, u: AuthUser) {
    _applyToken(t)
    user.value = u
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    delete req.defaults.headers.common['Authorization']
  }

  // 소셜 로그인 복귀(OAuthReturnPage)처럼 유저 정보 없이 토큰만 먼저 받는 경우.
  // 이어서 fetchMe() 로 유저를 채운다.
  function applyToken(t: string) {
    _applyToken(t)
  }

  return { token, user, isLoggedIn, login, logout, fetchMe, setAuth, applyToken }
})

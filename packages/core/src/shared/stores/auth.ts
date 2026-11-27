import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { req } from '@/shared/api'
import { clearAccountScope } from '@/shared/auth/accountScope'
import { setDayStartRule } from '@/shared/utils/dev-date'
import type { DayStartRule } from '@/shared/utils/appDay'

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
  // 계정 설정 — 하루 시작 시각(2026-11-26 #102, 고른 적이 없으면 없음 → 기본 새벽 4시)만 읽는다
  settings?: { dayStart?: DayStartRule }
}

const TOKEN_KEY = 'lh_token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<AuthUser | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  // 계정 정보를 받으면 그 계정의 하루 시작 시각으로 '오늘'을 센다(dev-date.ts). 로그아웃이면 기본 시각
  function _applyUser(u: AuthUser | null) {
    user.value = u
    setDayStartRule(u?.settings?.dayStart ?? null)
  }

  function _applyToken(t: string) {
    token.value = t
    localStorage.setItem(TOKEN_KEY, t)
    req.defaults.headers.common['Authorization'] = `Bearer ${t}`
  }

  async function login(email: string, password: string) {
    const res = await req.post('/api/auth/login', { email, password })
    clearAccountScope() // 계정이 바뀐다 — 앞 계정의 검사 id·담아 둔 추천을 비운다(accountScope.ts)
    _applyToken(res.data.token)
    _applyUser(res.data.user)
  }

  // 자동로그인(2026-11-04): 토큰은 90일, 앱이 열릴 때마다 여기서 연장된다(서버가 하루 지난 토큰이면 새 토큰을 준다).
  // ⚠️ 로그아웃은 서버가 '이 토큰은 아니다'라고 할 때만(401 만료·위조, 404 탈퇴한 계정).
  //    예전엔 어떤 에러든 로그아웃해서, 인터넷이 잠깐 끊기거나 배포 중에 앱을 열면 멀쩡한 토큰을 버렸다.
  async function fetchMe(): Promise<'ok' | 'invalid' | 'offline' | 'none'> {
    if (!token.value) return 'none'
    req.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    try {
      const res = await req.get('/api/auth/me')
      _applyUser(res.data.user)
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
    clearAccountScope()
    _applyToken(t)
    _applyUser(u)
  }

  function logout() {
    clearAccountScope()
    token.value = null
    _applyUser(null)
    localStorage.removeItem(TOKEN_KEY)
    delete req.defaults.headers.common['Authorization']
  }

  // 소셜 로그인 복귀(OAuthReturnPage)처럼 유저 정보 없이 토큰만 먼저 받는 경우.
  // 이어서 fetchMe() 로 유저를 채운다.
  function applyToken(t: string) {
    clearAccountScope()
    _applyToken(t)
  }

  // 하루 시작 시각 바꾸기(마이페이지) — 다음 하루부터 적용. 서버가 적용 시점(from·since)을 정해 돌려준다
  async function updateDayStart(hour: number) {
    const res = await req.put('/api/user/profile', { settings: { dayStartHour: hour } })
    // 옛 서버는 모르는 칸을 버리고 200 을 준다 — 저장되지 않았으면 실패로 알린다(배포 사이 잠깐)
    if (res.data?.user?.settings?.dayStart?.hour !== hour) throw new Error('day start not saved')
    _applyUser(res.data.user)
  }

  return { token, user, isLoggedIn, login, logout, fetchMe, setAuth, applyToken, updateDayStart }
})

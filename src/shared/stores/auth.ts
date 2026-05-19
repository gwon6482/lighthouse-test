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

  async function fetchMe() {
    if (!token.value) return
    req.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
    try {
      const res = await req.get('/api/auth/me')
      user.value = res.data.user
    } catch {
      // 토큰 만료 등
      logout()
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

  return { token, user, isLoggedIn, login, logout, fetchMe, setAuth }
})

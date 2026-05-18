<template>
  <div class="home">
    <h1 class="title">라이트하우스 테스트 페이지</h1>

    <section class="login-panel mb-8 p-6 bg-white rounded-3xl shadow-sm border border-slate-200">
      <p class="text-sm text-slate-600 mb-4">
        아래 아이디/비밀번호를 입력한 뒤 로그인하거나 회원가입 버튼을 눌러주세요.
      </p>
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">아이디</label>
          <input
            type="email"
            v-model="email"
            placeholder="admin@lighthouse.com"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">비밀번호</label>
          <input
            type="password"
            v-model="password"
            placeholder="••••••••"
            class="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

        <div class="grid gap-3 sm:grid-cols-2">
          <button
            type="submit"
            class="rounded-2xl bg-blue-600 px-4 py-3 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            로그인
          </button>
          <button
            type="button"
            @click="handleSignUp"
            class="rounded-2xl border border-slate-300 px-4 py-3 text-slate-700 font-semibold hover:border-slate-400 hover:bg-slate-50 transition-colors"
          >
            회원가입
          </button>
        </div>
      </form>
    </section>

    <HomeButtonContainer :menus="menus" />
    <button @click="lastPage" style="display: none;">마지막 페이지</button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import HomeButtonContainer from '../components/page/HomeButtonContainer.vue'
import { useSurvey } from '../composables/useSurvey';
import { ref } from 'vue'

const router = useRouter()
const { currentPageIndex, totalPages } = useSurvey()

const email = ref('')
const password = ref('')
const error = ref('')

const menus = [
  { name: '자기이해', icon: '🔍', route: '/self-understanding' },
  { name: '진로백과', icon: '📚', route: '/career-encyclopedia' },
  { name: '진로설계', icon: '🗺️', route: '/career-design' },
  { name: '진로달성', icon: '🏆', route: '/career-achievement' },
  { name: '메인 페이지', icon: '🏠', route: '/main' },
  { name: '자기이해 랜딩페이지', icon: '🌟', route: '/self-understanding/intro' },
]

const lastPage = () => {
  currentPageIndex.value = totalPages.value - 1
  router.push('/self-understanding/test')
}

const handleLogin = () => {
  error.value = ''

  if (!email.value || !password.value) {
    error.value = '아이디와 비밀번호를 모두 입력해주세요.'
    return
  }

  // TODO: 회원 DB 연동 작업 후 실제 로그인 처리
  alert(`로그인 시도: ${email.value}`)
}

const handleSignUp = () => {
  alert('회원가입 기능은 준비 중입니다.')
}
</script>

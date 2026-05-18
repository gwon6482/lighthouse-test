<template>
  <div class="home">
    <h1 class="title">라이트하우스 테스트 페이지</h1>

    <section class="login-panel">
      <p class="login-panel__desc">아이디/비밀번호를 입력한 뒤 로그인하거나 회원가입 버튼을 눌러주세요.</p>
      <form @submit.prevent="handleLogin" class="login-panel__form">
        <div class="login-panel__field">
          <label class="login-panel__label">아이디</label>
          <input
            type="email"
            v-model="email"
            placeholder="admin@lighthouse.com"
            class="login-panel__input"
          />
        </div>

        <div class="login-panel__field">
          <label class="login-panel__label">비밀번호</label>
          <input
            type="password"
            v-model="password"
            placeholder="••••••••"
            class="login-panel__input"
          />
        </div>

        <p v-if="error" class="login-panel__error">{{ error }}</p>

        <div class="login-panel__actions">
          <button type="submit" class="login-panel__btn login-panel__btn--primary">로그인</button>
          <button type="button" @click="showSignUp = true" class="login-panel__btn login-panel__btn--secondary">회원가입</button>
        </div>
      </form>
    </section>

    <HomeButtonContainer :menus="menus" />
    <button @click="lastPage" style="display: none;">마지막 페이지</button>

    <SignUpModal v-model="showSignUp" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import HomeButtonContainer from '../components/page/HomeButtonContainer.vue'
import SignUpModal from '../components/SignUpModal.vue'
import { useSurvey } from '../composables/useSurvey';
import { ref } from 'vue'

const router = useRouter()
const { currentPageIndex, totalPages } = useSurvey()

const email = ref('')
const password = ref('')
const error = ref('')

const showSignUp = ref(false)

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
  // TODO: 실제 로그인 처리 연동
  alert(`로그인 시도: ${email.value}`)
}
</script>

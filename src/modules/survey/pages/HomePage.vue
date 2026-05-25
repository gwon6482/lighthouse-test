<template>
  <div class="home">
    <h1 class="title">라이트하우스 테스트 페이지</h1>

    <!-- 로그인 전 -->
    <section v-if="!authStore.isLoggedIn" class="login-panel">
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
          <button type="submit" class="login-panel__btn login-panel__btn--primary" :disabled="loading">
            {{ loading ? '로그인 중...' : '로그인' }}
          </button>
          <button type="button" @click="showSignUp = true" class="login-panel__btn login-panel__btn--secondary">회원가입</button>
        </div>
      </form>
    </section>

    <!-- 로그인 후 -->
    <section v-else class="user-panel">
      <div class="user-panel__avatar">{{ avatarLetter }}</div>
      <div class="user-panel__info">
        <p class="user-panel__name">{{ authStore.user?.name ?? authStore.user?.email }}</p>
        <p class="user-panel__email">{{ authStore.user?.email }}</p>
        <div class="user-panel__meta" v-if="authStore.user?.age || authStore.user?.gender">
          <span v-if="authStore.user?.age">{{ authStore.user.age }}세</span>
          <span v-if="authStore.user?.gender">{{ authStore.user.gender === 'M' ? '남성' : '여성' }}</span>
        </div>
      </div>
      <div class="user-panel__actions">
        <RouterLink to="/mypage" class="user-panel__mypage">마이페이지</RouterLink>
        <button class="user-panel__logout" @click="handleLogout">로그아웃</button>
      </div>
    </section>

    <HomeButtonContainer :menus="menus" />
    <button @click="lastPage" style="display: none;">마지막 페이지</button>

    <!-- 개발 도구: 오늘 날짜 시뮬레이션 -->
    <section class="dev-tools">
      <div class="dev-tools__head">
        <span class="dev-tools__badge">DEV</span>
        <h2 class="dev-tools__title">오늘 날짜 시뮬레이션</h2>
      </div>
      <p class="dev-tools__desc">
        진로달성 페이지가 "오늘"을 인식하는 날짜를 임의로 바꿔서 테스트할 수 있어요.
        <strong v-if="devDate">현재 시뮬레이션: {{ devDate }}</strong>
        <strong v-else>현재: 실제 오늘 사용 중</strong>
      </p>
      <div class="dev-tools__row">
        <input v-model="devDateInput" type="date" class="dev-tools__input" />
        <button class="dev-tools__btn dev-tools__btn--primary" @click="applyDevDate">적용</button>
        <button class="dev-tools__btn" @click="clearDevDate">실제 오늘로</button>
      </div>
    </section>

    <SignUpModal v-model="showSignUp" @registered="onRegistered" />
  </div>
</template>

<script setup lang="ts">
import { useRouter, RouterLink } from 'vue-router'
import { ref, computed } from 'vue'
import HomeButtonContainer from '../components/page/HomeButtonContainer.vue'
import SignUpModal from '../components/SignUpModal.vue'
import { useSurvey } from '../composables/useSurvey'
import { useAuthStore } from '@/shared/stores/auth'
import { useDevDate } from '@/shared/utils/dev-date'

const router = useRouter()
const { currentPageIndex, totalPages } = useSurvey()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const showSignUp = ref(false)

const avatarLetter = computed(() => {
  const src = authStore.user?.name ?? authStore.user?.email ?? '?'
  return src.charAt(0).toUpperCase()
})

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

const handleLogin = async () => {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = '아이디와 비밀번호를 모두 입력해주세요.'
    return
  }
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    email.value = ''
    password.value = ''
  } catch (e: any) {
    error.value = e.response?.data?.error ?? '로그인 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
}

const handleLogout = () => {
  authStore.logout()
}

const onRegistered = (token: string, user: any) => {
  authStore.setAuth(token, user)
}

// ── 개발 도구: 오늘 날짜 시뮬레이션 ───────────────
const { devDate, setDevDate } = useDevDate()
const devDateInput = ref(devDate.value ?? '')

function applyDevDate() {
  const v = devDateInput.value.trim()
  if (!v) return
  setDevDate(v)
}

function clearDevDate() {
  devDateInput.value = ''
  setDevDate(null)
}
</script>

<style scoped lang="scss">
.dev-tools {
  margin: 20px 16px 24px;
  background: #1a1a1a;
  color: #fff;
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__badge {
    background: #FFC700;
    color: #1a1a1a;
    font-size: 10px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 6px;
    letter-spacing: 0.5px;
  }

  &__title {
    font-size: 14px;
    font-weight: 700;
    margin: 0;
  }

  &__desc {
    font-size: 12px;
    color: #bbb;
    line-height: 1.5;
    margin: 0;

    strong { color: #FFC700; font-weight: 700; margin-left: 6px; }
  }

  &__row {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  &__input {
    flex: 1;
    min-width: 0;
    background: #2a2a2a;
    color: #fff;
    border: 1px solid #3a3a3a;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    outline: none;

    &:focus { border-color: #FFC700; }
    &::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.5); cursor: pointer; }
  }

  &__btn {
    background: #2a2a2a;
    color: #fff;
    border: 1px solid #3a3a3a;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;

    &:hover { background: #3a3a3a; }

    &--primary {
      background: #FFC700;
      color: #1a1a1a;
      border-color: #FFC700;
      font-weight: 800;

      &:hover { background: #FFB300; }
    }
  }
}
</style>

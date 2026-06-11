<template>
  <div class="auth">
    <div class="auth__inner">
      <!-- 브랜드 헤더 -->
      <div class="auth__brand">
        <img class="auth__logo" src="/Symbol.svg" width="64" height="76" alt="라이트하우스" />
        <h1 class="auth__headline">
          {{ mode === 'signup' ? '라이트하우스 시작하기' : '다시 만나서 반가워요' }}
        </h1>
        <p class="auth__sub">
          {{ mode === 'signup'
            ? '나에게 꼭 맞는 진로를 찾아가요.'
            : '이메일로 로그인해 주세요.' }}
        </p>
      </div>

      <!-- ── 회원가입 모드 ── -->
      <template v-if="mode === 'signup'">
        <div class="auth__socials">
          <button class="auth__social auth__social--kakao" @click="comingSoon('카카오')">
            <span class="auth__social-icon">💬</span>
            카카오로 시작하기
          </button>
          <button class="auth__social auth__social--apple" @click="comingSoon('Apple')">
            <span class="auth__social-icon"></span>
            Apple로 시작하기
          </button>
          <button class="auth__social auth__social--google" @click="comingSoon('구글')">
            <span class="auth__social-icon">G</span>
            구글로 시작하기
          </button>
        </div>

        <div class="auth__divider"><span>또는</span></div>

        <button class="auth__primary" @click="goEmailSignup">이메일로 가입하기</button>

        <p class="auth__switch">
          이미 계정이 있으신가요?
          <button class="auth__switch-btn" @click="mode = 'login'">로그인</button>
        </p>
      </template>

      <!-- ── 로그인 모드 ── -->
      <template v-else>
        <form class="auth__form" @submit.prevent="handleLogin">
          <div class="auth__field">
            <label class="auth__label">이메일</label>
            <input
              v-model="email"
              type="email"
              class="auth__input"
              placeholder="user@example.com"
              autocomplete="email"
            />
          </div>
          <div class="auth__field">
            <label class="auth__label">비밀번호</label>
            <input
              v-model="password"
              type="password"
              class="auth__input"
              placeholder="••••••••"
              autocomplete="current-password"
            />
          </div>

          <p v-if="error" class="auth__error">{{ error }}</p>

          <button type="submit" class="auth__primary" :disabled="loading">
            {{ loading ? '로그인 중...' : '로그인' }}
          </button>
        </form>

        <p class="auth__switch">
          아직 회원이 아니신가요?
          <button class="auth__switch-btn" @click="mode = 'signup'">회원가입</button>
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import { useAchievementStore } from '@/shared/stores/achievement'

const router = useRouter()
const authStore = useAuthStore()
const achievementStore = useAchievementStore()

const mode = ref<'signup' | 'login'>('signup')   // 회원가입이 기본

// ── 회원가입 ──
function goEmailSignup() {
  router.push('/onboarding/signup')
}

function comingSoon(provider: string) {
  // SNS 연동(OAuth)은 백엔드 준비 후 2차 연동 예정
  alert(`${provider} 연동은 준비 중이에요. 이메일로 가입해 주세요.`)
}

// ── 로그인 (기존 사용자) ──
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  if (!email.value || !password.value) {
    error.value = '이메일과 비밀번호를 모두 입력해 주세요.'
    return
  }
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    await achievementStore.loadActivePlan()
    // 활성 진로계획 유무에 따라 설계 전/후 메인으로
    router.replace(achievementStore.hasActivePlan ? '/main' : '/main/before')
  } catch (e: any) {
    error.value = e.response?.data?.error ?? '로그인 중 오류가 발생했어요.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.auth {
  position: fixed;
  inset: 0;
  background: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow-y: auto;
  z-index: 1400;
}

.auth__inner {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
}

/* ── 브랜드 ── */
.auth__brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 36px;
}

.auth__logo {
  margin-bottom: 16px;
}

.auth__headline {
  font-size: 22px;
  font-weight: 900;
  letter-spacing: -0.4px;
  color: #1A1A1A;
  margin: 0 0 8px;
}

.auth__sub {
  font-size: 14px;
  font-weight: 500;
  color: #888;
  margin: 0;
}

/* ── SNS ── */
.auth__socials {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.auth__social {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  font-size: 15px;
  font-weight: 700;
  font-family: inherit;
  border: 1px solid #EAEAEA;
  border-radius: 12px;
  background: #fff;
  color: #1A1A1A;
  cursor: pointer;
  transition: filter 0.15s, transform 0.08s, background 0.15s;

  &:active { transform: scale(0.99); }

  &-icon {
    font-size: 17px;
    font-weight: 800;
    line-height: 1;
  }

  &--kakao {
    background: #FEE500;
    border-color: #FEE500;
    &:hover { filter: brightness(0.97); }
  }
  &--apple {
    background: #1A1A1A;
    border-color: #1A1A1A;
    color: #fff;
    &:hover { background: #000; }
  }
  &--google {
    &:hover { background: #FAFAFA; }
    .auth__social-icon { color: #4285F4; }
  }
}

/* ── 구분선 ── */
.auth__divider {
  display: flex;
  align-items: center;
  margin: 22px 0;
  color: #BBB;
  font-size: 12px;

  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #EEE;
  }
  span { padding: 0 12px; }
}

/* ── 폼 ── */
.auth__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.auth__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.auth__label {
  font-size: 13px;
  font-weight: 600;
  color: #1A1A1A;
}

.auth__input {
  width: 100%;
  padding: 13px 14px;
  font-size: 14px;
  font-family: inherit;
  border: 1px solid #EAEAEA;
  border-radius: 12px;
  background: #FAFAF8;
  color: #1A1A1A;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;

  &::placeholder { color: #CCC; }
  &:focus {
    border-color: #FFD100;
    box-shadow: 0 0 0 3px rgba(255, 209, 0, 0.15);
  }
}

.auth__error {
  font-size: 12px;
  font-weight: 600;
  color: #E53E3E;
  margin: 0;
}

/* ── 주요 버튼 ── */
.auth__primary {
  width: 100%;
  padding: 15px;
  margin-top: 4px;
  font-size: 16px;
  font-weight: 800;
  font-family: inherit;
  letter-spacing: -0.2px;
  color: #1A1A1A;
  background: #FFD100;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.15s, transform 0.08s;

  &:hover:not(:disabled) { background: #F0C400; }
  &:active:not(:disabled) { transform: scale(0.98); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

/* ── 모드 전환 ── */
.auth__switch {
  margin-top: 22px;
  text-align: center;
  font-size: 13px;
  color: #999;
}

.auth__switch-btn {
  border: none;
  background: transparent;
  color: #1A1A1A;
  font-size: 13px;
  font-weight: 800;
  font-family: inherit;
  cursor: pointer;
  text-decoration: underline;
  padding: 2px;
}
</style>

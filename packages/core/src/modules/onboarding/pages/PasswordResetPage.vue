<template>
  <div class="wiz pwreset">
    <header v-if="stage !== 'done'" class="wiz__header">
      <button class="wiz__back" aria-label="뒤로" @click="back">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M15 5l-7 7 7 7" stroke="#1A1A1A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </header>

    <div class="wiz__body">
      <!-- 1 메일 적기 -->
      <section v-if="stage === 'request'" class="wiz__step">
        <h2 class="wiz__title">비밀번호 찾기</h2>
        <p class="wiz__desc">가입할 때 쓴 메일을 적어 주세요. 새 비밀번호를 정할 코드를 보내 드려요.</p>
        <div class="wiz__field">
          <label class="wiz__label" for="pwreset-email">이메일</label>
          <input id="pwreset-email" v-model="email" type="email" class="wiz__input" placeholder="user@example.com" autocomplete="email" @keydown.enter="request" />
        </div>
        <p v-if="error" class="wiz__error" role="alert">{{ error }}</p>
      </section>

      <!-- 2 코드 적기 -->
      <EmailCodeStep
        v-else-if="stage === 'code'"
        purpose="reset"
        :email="email.trim()"
        :sent-at="sentAt"
        :resend-after="resendAfter"
        @verified="onVerified"
        @edit-email="stage = 'request'"
        @resent="(at: number) => (sentAt = at)"
      />

      <!-- 3 새 비밀번호 -->
      <section v-else-if="stage === 'newpw'" class="wiz__step">
        <h2 class="wiz__title">새 비밀번호를<br />정해 주세요</h2>
        <p class="wiz__desc">바꾸면 다른 기기에서는 로그아웃돼요.</p>
        <!-- 비밀번호 관리자가 어느 계정 것인지 알게 메일 칸을 숨겨 둔다 -->
        <input type="email" :value="email.trim()" autocomplete="username" hidden readonly />
        <div class="wiz__field">
          <label class="wiz__label" for="pwreset-new">새 비밀번호</label>
          <input id="pwreset-new" v-model="pw" type="password" class="wiz__input" :placeholder="`${NEW_PASSWORD_MIN}자 이상`" autocomplete="new-password" />
        </div>
        <div class="wiz__field">
          <label class="wiz__label" for="pwreset-again">한 번 더</label>
          <input id="pwreset-again" v-model="pw2" type="password" class="wiz__input" :placeholder="`${NEW_PASSWORD_MIN}자 이상`" autocomplete="new-password" @keydown.enter="save" />
        </div>
        <p v-if="error" class="wiz__error" role="alert">{{ error }}</p>
      </section>

      <!-- 4 끝 -->
      <section v-else class="pwreset__done">
        <span class="pwreset__done-icon"><AppIcon name="ui-check" /></span>
        <h2 class="wiz__title">비밀번호를 바꿨어요</h2>
        <p class="wiz__desc">이 기기에서는 바로 이어서 쓸 수 있어요. 다른 기기에서는 새 비밀번호로 다시 로그인해 주세요.</p>
      </section>
    </div>

    <footer v-if="stage !== 'code'" class="wiz__footer">
      <button v-if="stage === 'request'" class="wiz__next" :disabled="!emailOk || busy" @click="request">
        {{ busy ? '보내는 중...' : '코드 받기' }}
      </button>
      <button v-else-if="stage === 'newpw'" class="wiz__next" :disabled="!pwReady || busy" @click="save">
        {{ busy ? '바꾸는 중...' : '비밀번호 바꾸기' }}
      </button>
      <button v-else class="wiz__next" :disabled="busy" @click="goOn">계속하기</button>
    </footer>
  </div>
</template>

<script setup lang="ts">
// 비밀번호 찾기(2026-11-22 시안 2판, 정할 것 1·4·5·6·7 권장대로)
// 메일 적기 → 6자리 코드 → 새 비밀번호(8자 이상) → 끝(이 기기는 바로 로그인, 다른 기기는 서버가 끊는다).
// 화면은 가입 여부와 상관없이 같다 — 서버도 늘 같은 응답을 준다(카카오·구글 가입 메일엔 로그인 방법 안내 메일이 간다).
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { req } from '@/shared/api'
import AppIcon from '@/shared/components/AppIcon.vue'
import { useAuthStore } from '@/shared/stores/auth'
import { useAchievementStore } from '@/shared/stores/achievement'
import { linkPendingGuestSurvey } from '@/shared/guest/guestSurvey'
import { takeAfterLogin } from '@/shared/auth/afterLogin'
import EmailCodeStep from '../components/EmailCodeStep.vue'
import { NEW_PASSWORD_MIN, newPasswordError, sendErrorMessage } from '../lib/emailCode'

const router = useRouter()
const authStore = useAuthStore()
const achievementStore = useAchievementStore()

type Stage = 'request' | 'code' | 'newpw' | 'done'
const stage = ref<Stage>('request')

// 로그인 화면에 적던 메일을 채워 둔다(주소창이 아니라 이동 상태로 받는다 — 메일이 주소·기록에 남지 않게)
const email = ref<string>(typeof window !== 'undefined' && typeof window.history.state?.email === 'string' ? window.history.state.email : '')
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const emailOk = computed(() => EMAIL_RE.test(email.value.trim()))

const busy = ref(false)
const error = ref('')
const sentAt = ref(0)
const resendAfter = ref(60)
const ticket = ref('')
const pw = ref('')
const pw2 = ref('')
const pwReady = computed(() => pw.value.length >= NEW_PASSWORD_MIN && pw2.value.length >= NEW_PASSWORD_MIN)

async function request() {
  if (!emailOk.value || busy.value) return
  error.value = ''
  busy.value = true
  try {
    const res = await req.post('/api/auth/password/forgot', { email: email.value.trim() })
    resendAfter.value = Number(res.data?.resendAfter) || 60
    sentAt.value = Date.now()
    stage.value = 'code'
  } catch (e: any) {
    error.value = sendErrorMessage(e?.response?.status, e?.response?.data)
  } finally {
    busy.value = false
  }
}

function onVerified(t: string) {
  ticket.value = t
  error.value = ''
  stage.value = 'newpw'
}

async function save() {
  if (busy.value) return
  const problem = newPasswordError(pw.value, pw2.value)
  if (problem) { error.value = problem; return }
  error.value = ''
  busy.value = true
  try {
    const res = await req.post('/api/auth/password/reset', { email: email.value.trim(), ticket: ticket.value, newPassword: pw.value })
    authStore.setAuth(res.data.token, res.data.user)
    pw.value = ''; pw2.value = ''
    stage.value = 'done'
  } catch (e: any) {
    const code = e?.response?.data?.code
    if (code === 'expired') {
      // 표(10분)가 지났다 — 코드부터 다시
      error.value = ''
      ticket.value = ''
      stage.value = 'request'
      error.value = '시간이 지났어요. 코드를 다시 받아 주세요.'
    } else {
      error.value = e?.response?.data?.error ?? '바꾸지 못했어요. 잠시 뒤 다시 해 주세요.'
    }
  } finally {
    busy.value = false
  }
}

// '계속하기' — 로그인 뒤와 같은 곳으로(계획이 있으면 진로달성, 없으면 진로 여정 시작)
async function goOn() {
  busy.value = true
  try {
    await linkPendingGuestSurvey()
    await achievementStore.loadActivePlan()
    router.replace(takeAfterLogin() ?? (achievementStore.hasActivePlan ? '/career-achievement' : '/main/before'))
  } finally {
    busy.value = false
  }
}

function back() {
  error.value = ''
  if (stage.value === 'newpw') { stage.value = 'request'; ticket.value = ''; pw.value = ''; pw2.value = ''; return }
  if (stage.value === 'code') { stage.value = 'request'; return }
  router.replace({ path: '/onboarding/auth', query: { mode: 'login' } })
}
</script>

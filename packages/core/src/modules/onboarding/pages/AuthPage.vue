<template>
  <div class="auth">
    <div class="auth__inner">
      <!-- 브랜드 헤더 -->
      <div class="auth__brand">
        <img class="auth__logo" src="/Symbol.svg" width="64" height="76" alt="라이트하우스" />
        <h1 class="auth__headline">
          {{ mode === 'signup' ? '라이트하우스 시작하기' : '다시 만나서 반가워요' }}
        </h1>
        <p class="auth__sub">{{ subCopy }}</p>
      </div>

      <!-- ── 회원가입 모드 ── -->
      <template v-if="mode === 'signup'">
        <div class="auth__socials">
          <button
            class="auth__social auth__social--kakao"
            @click="providers.kakao ? startOAuth('kakao') : comingSoon('카카오')"
          >
            <span class="auth__social-icon">💬</span>
            카카오로 시작하기
          </button>
          <button class="auth__social auth__social--apple" @click="comingSoon('Apple')">
            <span class="auth__social-icon"></span>
            Apple로 시작하기
          </button>
          <button
            class="auth__social auth__social--google"
            @click="providers.google ? startOAuth('google') : comingSoon('구글')"
          >
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
        <!-- ⚠️ 로그인 화면에도 소셜 진입점이 있어야 한다.
             카카오 전용 계정은 passwordHash 가 아예 없어서 **이메일 폼으로는 영원히 로그인할 수 없다.**
             예전에는 소셜 버튼이 회원가입 모드에만 있어서, 돌아온 카카오 사용자가 '로그인'을 누르면
             비밀번호를 요구받고 막다른 길에 갇혔다.
             ⚠️ 여기에는 **켜진 제공자만** 놓는다. 회원가입 탭의 '준비 중' 버튼은 티저로 의미가 있지만,
             로그인 화면에서는 아니다 — 구현된 적 없는 방법으로 가입한 계정은 존재할 수 없으므로
             눌러도 '준비 중'만 뜨는 버튼은 순수한 방해물이다(그래서 Apple 은 여기 없다). -->
        <template v-if="hasEnabledProvider">
          <div class="auth__socials">
            <button
              v-if="providers.kakao"
              class="auth__social auth__social--kakao"
              @click="startOAuth('kakao')"
            >
              <span class="auth__social-icon">💬</span>
              카카오로 로그인
            </button>
            <button
              v-if="providers.google"
              class="auth__social auth__social--google"
              @click="startOAuth('google')"
            >
              <span class="auth__social-icon">G</span>
              구글로 로그인
            </button>
          </div>

          <div class="auth__divider"><span>또는</span></div>
        </template>

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

          <!-- 로그인이 한 번 실패한 뒤에만 띄운다. 처음부터 깔아두면 이메일 사용자에게는 잡음이고,
               실패한 순간에는 카카오 계정인 사람에게 정확히 필요한 안내다.
               ⚠️ 서버는 '카카오 계정입니다' 라고 알려주지 않는다(계정 존재 여부가 새어나간다).
                  그래서 이 힌트를 FE 가 대신 놓는다. -->
          <p v-if="showSocialHint" class="auth__hint">
            {{ socialHint }}
          </p>

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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import { useAchievementStore } from '@/shared/stores/achievement'
import { req } from '@/shared/api'

const router = useRouter()
const authStore = useAuthStore()
const achievementStore = useAchievementStore()

const mode = ref<'signup' | 'login'>('signup')   // 회원가입이 기본

// ── 회원가입 ──
function goEmailSignup() {
  router.push('/onboarding/signup')
}

function comingSoon(provider: string) {
  // 아직 열지 않은 SNS. 켜진 제공자는 startOAuth 로 간다.
  alert(`${provider} 연동은 준비 중이에요. 이메일로 가입해 주세요.`)
}

// ── 소셜 로그인 ──
// ⚠️ "어떤 제공자를 켤지"의 진실은 **API env 하나**다(GET /api/auth/providers).
//    FE 에도 플래그를 두면 키가 없는데 버튼만 켜지거나 그 반대가 반드시 생긴다.
//    제공자가 늘어도 이 객체에 키가 하나 늘 뿐, 판단 위치는 그대로 API 다.
type Provider = 'kakao' | 'google'
const providers = ref<Record<Provider, boolean>>({ kakao: false, google: false })

const enabledProviders = computed(
  () => (Object.keys(providers.value) as Provider[]).filter((p) => providers.value[p]),
)
const hasEnabledProvider = computed(() => enabledProviders.value.length > 0)

const PROVIDER_LABEL: Record<Provider, string> = { kakao: '카카오', google: '구글' }

onMounted(async () => {
  try {
    const res = await req.get('/api/auth/providers')
    const data = res.data?.data ?? {}
    providers.value = { kakao: !!data.kakao, google: !!data.google }
  } catch {
    // 조회 실패 시엔 켜지 않는다 — 눌러도 안 되는 버튼보다 '준비 중'이 낫다
    providers.value = { kakao: false, google: false }
  }
})

// 로그인 안내 문구는 **실제로 고를 수 있는 방법**에 따라 달라진다.
// 소셜이 전부 꺼져 있는데 "가입할 때 쓴 방법으로"라고 하면 있지도 않은 선택지를 가리키게 된다.
const subCopy = computed(() => {
  if (mode.value === 'signup') return '나에게 꼭 맞는 진로를 찾아가요.'
  return hasEnabledProvider.value
    ? '가입할 때 사용한 방법으로 로그인해 주세요.'
    : '이메일로 로그인해 주세요.'
})

// 로그인 실패 뒤 안내. 켜진 제공자 이름을 그대로 읽어 만든다 —
// 문구에 '카카오'를 박아두면 구글만 켠 상황에서 엉뚱한 안내가 된다.
const socialHint = computed(() => {
  const names = enabledProviders.value.map((p) => PROVIDER_LABEL[p]).join('·')
  return `${names}로 가입하셨다면 위 버튼으로 로그인해 주세요.`
})

function startOAuth(provider: Provider) {
  // 서버 302 로 제공자 인가 페이지에 간다. SPA 라우팅이 아니라 **문서 이동**이어야 한다.
  // 복귀 URL 은 서버가 허용목록(OAUTH_ALLOWED_ORIGINS)으로 다시 검사하므로
  // 여기서 무엇을 보내든 목록 밖이면 무시된다.
  const returnTo = `${window.location.origin}/onboarding/oauth`
  const base = import.meta.env.VITE_API ?? ''
  window.location.href = `${base}/api/auth/${provider}?redirect=${encodeURIComponent(returnTo)}`
}

// ── 로그인 (기존 사용자) ──
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const showSocialHint = ref(false)

async function handleLogin() {
  error.value = ''
  showSocialHint.value = false
  if (!email.value || !password.value) {
    error.value = '이메일과 비밀번호를 모두 입력해 주세요.'
    return
  }
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    await achievementStore.loadActivePlan()
    // 활성 진로계획 유무에 따라 설계 전/후 메인으로 (설계 후 메인 = 진로달성)
    router.replace(achievementStore.hasActivePlan ? '/career-achievement' : '/main/before')
  } catch (e: any) {
    error.value = e.response?.data?.error ?? '로그인 중 오류가 발생했어요.'
    // 401 = 이메일/비번이 안 맞는다. 소셜 전용 계정이면 **영원히 안 맞는다**(passwordHash 가 없다).
    // 서버는 어느 쪽인지 알려주지 않으므로(계정 존재 여부 노출) 여기서 가능성을 짚어준다.
    if (e.response?.status === 401 && hasEnabledProvider.value) showSocialHint.value = true
  } finally {
    loading.value = false
  }
}
</script>

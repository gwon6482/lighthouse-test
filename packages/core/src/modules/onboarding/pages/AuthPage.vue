<template>
  <div class="auth">
    <!-- 돌아갈 곳(?next=)이 있을 때만 — 진로백과 '분류로 찾기'의 '가입하고 연봉 보기'처럼 앱 안에서 넘어온 경우(2026-11-18) -->
    <button v-if="nextPath" type="button" class="auth__back" aria-label="뒤로" @click="safeBack(router, nextPath)"><AppIcon name="ui-back" /></button>
    <div class="auth__inner">
      <!-- 탈퇴 직후 한 번(2026-11-21 A6). ✕로 닫고, 다시 들어오면 보이지 않는다 -->
      <div v-if="farewell" class="auth__farewell" role="status">
        <AppIcon name="ui-check" class="auth__farewell-icon" />
        <p><b>탈퇴했어요</b><span>계정과 기록을 모두 지웠어요. 그동안 함께해 주셔서 고마워요.</span></p>
        <button type="button" class="auth__farewell-x" aria-label="닫기" @click="farewell = false"><AppIcon name="ui-close" /></button>
      </div>
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

        <!-- 가입 전에 둘러보기(2026-11-19 다듬기 2차 1·2) — 진로단계 0·1이 가입 전에 무엇인지 보게.
             회원가입 화면에서만. 앱 안에서 가입하러 넘어와 돌아갈 곳(?next=)이 있으면 숨긴다.
             2026-11-21 오너: 버튼 둘까지 보이면 복잡하다 → 기본은 접고 한 줄 토글로 편다 -->
        <nav v-if="showExplore" class="auth__explore" aria-label="가입 전에 둘러보기">
          <button
            type="button"
            class="auth__explore-toggle"
            :aria-expanded="exploreOpen"
            aria-controls="auth-explore-list"
            @click="exploreOpen = !exploreOpen"
          >
            가입 전에 둘러봐도 돼요
            <AppIcon name="ui-chevron-down" :size="14" class="auth__explore-chevron" :class="{ 'is-open': exploreOpen }" />
          </button>
          <div v-show="exploreOpen" id="auth-explore-list" class="auth__explore-list">
            <RouterLink to="/self-understanding" class="auth__explore-row">
              <span class="auth__explore-text"><b>자기이해 검사 해 보기</b><span>가입 없이 · 약 20분</span></span>
              <AppIcon name="ui-chevron-right" :size="16" />
            </RouterLink>
            <RouterLink to="/career-encyclopedia" class="auth__explore-row">
              <span class="auth__explore-text"><b>진로백과 둘러보기</b><span>{{ jobsCount ? `직업 ${jobsCount}개의 하는 일` : '여러 직업의 하는 일' }}</span></span>
              <AppIcon name="ui-chevron-right" :size="16" />
            </RouterLink>
          </div>
        </nav>
      </template>

      <!-- ── 로그인 모드 ── -->
      <template v-else>
        <!-- ⚠️ 로그인 화면에도 소셜 진입점이 있어야 한다.
             카카오 전용 계정은 passwordHash 가 아예 없어서 **이메일 폼으로는 영원히 로그인할 수 없다.**
             예전에는 소셜 버튼이 회원가입 모드에만 있어서, 돌아온 카카오 사용자가 '로그인'을 누르면
             비밀번호를 요구받고 막다른 길에 갇혔다.
             ⚠️ 여기에는 **켜진 제공자만** 놓는다. 회원가입 탭의 '준비 중' 버튼은 티저로 의미가 있지만,
             로그인 화면에서는 아니다 — 구현된 적 없는 방법으로 가입한 계정은 존재할 수 없으므로
             눌러도 '준비 중'만 뜨는 버튼은 순수한 방해물이다. (Apple 은 연동하지 않기로 해 회원가입 탭에서도 뺐다, 2026-11-11) -->
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

        <!-- 비밀번호 찾기(2026-11-22) — 서버 스위치가 켜졌을 때만(providers.emailCode === 'on'). 적던 메일을 이동 상태로 넘긴다 -->
        <button v-if="emailCodeOn" type="button" class="auth__forgot" @click="goForgot">비밀번호를 잊었어요</button>

        <p class="auth__switch">
          아직 회원이 아니신가요?
          <button class="auth__switch-btn" @click="mode = 'signup'">회원가입</button>
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { linkPendingGuestSurvey, markLoginRedirect } from '@/shared/guest/guestSurvey'
import { startOAuth as startOAuthShared } from '@/shared/auth/oauth'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import { useAchievementStore } from '@/shared/stores/achievement'
import { req } from '@/shared/api'
import AppIcon from '@/shared/components/AppIcon.vue'
import { safeBack } from '@/shared/utils/navigation'
import { dropAfterLogin, rememberAfterLogin, takeAfterLogin } from '@/shared/auth/afterLogin'
import { loadBrowseAxes } from '@/modules/encyclopedia/composables/useJobBrowse'
import { takeAccountDeleted } from '@/shared/auth/farewell'

const router = useRouter()
const route = useRoute()
// 로그인 뒤 돌아갈 곳(?next=, 앱 안 경로만). 소셜 로그인은 OAuthReturnPage 가 이 탭에 둔 값을 꺼낸다
const nextPath = rememberAfterLogin(route.query.next)
const authStore = useAuthStore()
const achievementStore = useAchievementStore()

// 회원가입이 기본. ?mode=login 이면 로그인부터(카카오·구글 가입자 안내 메일의 '로그인 화면 열기', 비밀번호 찾기의 뒤로)
const mode = ref<'signup' | 'login'>(route.query.mode === 'login' ? 'login' : 'signup')
const farewell = ref(takeAccountDeleted())

// ── 회원가입 ──
function goEmailSignup() {
  dropAfterLogin()   // 새로 가입하는 사람은 지금처럼 가입·온보딩 흐름을 탄다
  router.push('/onboarding/signup')
}

function comingSoon(provider: string) {
  // 아직 열지 않은 SNS. 켜진 제공자는 startOAuth 로 간다.
  alert(`${provider} 연동은 준비 중이에요. 이메일로 가입해 주세요.`)
}

// ── 가입 전에 둘러보기 ──
// 비회원 검사(결과 1위만 공개, 나머지는 가입하면)와 진로백과 홈으로 가는 길. 직업 수는 서버 값(분류로 찾기 축 응답, 10분 캐시)
const showExplore = computed(() => mode.value === 'signup' && !nextPath)
const exploreOpen = ref(false)   // 기본은 접힘(2026-11-21)
const jobsCount = ref<number | null>(null)
onMounted(() => {
  if (!showExplore.value) return
  loadBrowseAxes().then((a) => { jobsCount.value = a.jobs || null }).catch(() => { /* 숫자 없이 보인다 */ })
})

// ── 소셜 로그인 ──
// ⚠️ "어떤 제공자를 켤지"의 진실은 **API env 하나**다(GET /api/auth/providers).
//    FE 에도 플래그를 두면 키가 없는데 버튼만 켜지거나 그 반대가 반드시 생긴다.
//    제공자가 늘어도 이 객체에 키가 하나 늘 뿐, 판단 위치는 그대로 API 다.
type Provider = 'kakao' | 'google'
const providers = ref<Record<Provider, boolean>>({ kakao: false, google: false })
const emailCodeOn = ref(false)   // 메일 확인·비밀번호 찾기 스위치(서버 EMAIL_CODE = on)

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
    emailCodeOn.value = data.emailCode === 'on'
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
  markLoginRedirect()   // 비회원 결과지에서 넘어왔을 수 있다 — 돌아와서 연결한다
  startOAuthShared(provider)
}

function goForgot() {
  router.push({ path: '/onboarding/password', state: { email: email.value.trim() } })
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
    await linkPendingGuestSurvey()   // 비회원 검사가 있으면 계정에 연결(2026-11-09) — 기존 회원은 지금 단계로
    await achievementStore.loadActivePlan()
    // 활성 진로계획 유무에 따라 설계 전/후 메인으로 (설계 후 메인 = 진로달성)
    // 넘어온 곳(?next=)이 있으면 그리로 돌아간다 — 없으면 예전처럼 설계 전/후 메인
    router.replace(takeAfterLogin() ?? (achievementStore.hasActivePlan ? '/career-achievement' : '/main/before'))
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

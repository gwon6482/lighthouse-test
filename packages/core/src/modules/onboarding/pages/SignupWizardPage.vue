<template>
  <div class="wiz">
    <!-- 헤더: 뒤로 + 진행바 -->
    <header class="wiz__header">
      <button class="wiz__back" @click="back" aria-label="뒤로">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M15 5l-7 7 7 7" stroke="#1A1A1A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="wiz__progress">
        <div class="wiz__progress-fill" :style="{ width: `${progressPct}%` }" />
      </div>
    </header>

    <div class="wiz__body">
      <!-- step 0: 계정 -->
      <section v-if="step === 0" class="wiz__step">
        <h2 class="wiz__title">계정을 만들어요</h2>
        <p class="wiz__desc">로그인에 사용할 이메일과 비밀번호를 입력해 주세요.</p>
        <div class="wiz__field">
          <label class="wiz__label">이메일</label>
          <input v-model="form.email" type="email" class="wiz__input" placeholder="user@example.com" autocomplete="email" />
        </div>
        <div class="wiz__field">
          <label class="wiz__label">비밀번호</label>
          <input v-model="form.password" type="password" class="wiz__input" placeholder="6자 이상" autocomplete="new-password" />
        </div>
        <div class="wiz__field">
          <label class="wiz__label">비밀번호 확인</label>
          <input v-model="form.passwordConfirm" type="password" class="wiz__input" placeholder="••••••••" autocomplete="new-password" />
        </div>
      </section>

      <!-- step 1: 이름 -->
      <section v-else-if="step === 1" class="wiz__step">
        <h2 class="wiz__title">이름을 알려주세요</h2>
        <p class="wiz__desc">서비스에서 이렇게 불러드릴게요.</p>
        <div class="wiz__field">
          <label class="wiz__label">이름</label>
          <input v-model="form.name" type="text" class="wiz__input" placeholder="홍길동" autocomplete="name" />
        </div>
      </section>

      <!-- step 2: 나이/성별 -->
      <section v-else-if="step === 2" class="wiz__step">
        <h2 class="wiz__title">기본 정보를 입력해요</h2>
        <p class="wiz__desc">진로 추천을 더 정확하게 해드릴 수 있어요.</p>
        <div class="wiz__field">
          <label class="wiz__label">나이</label>
          <input v-model.number="form.age" type="number" min="1" max="120" class="wiz__input" placeholder="25" />
        </div>
        <div class="wiz__field">
          <label class="wiz__label">성별</label>
          <div class="wiz__gender">
            <button
              type="button"
              class="wiz__gender-btn"
              :class="{ 'wiz__gender-btn--active': form.gender === 'M' }"
              @click="form.gender = 'M'"
            >남성</button>
            <button
              type="button"
              class="wiz__gender-btn"
              :class="{ 'wiz__gender-btn--active': form.gender === 'F' }"
              @click="form.gender = 'F'"
            >여성</button>
          </div>
        </div>
        <!-- 만 14세 이상만 가입(이용약관, 2026-11-09 위저드에 추가) — 14세 미만은 법정대리인 동의가 필요해 받지 않는다 -->
        <p v-if="form.age != null && form.age > 0 && form.age < 14" class="wiz__underage">
          만 14세 미만은 가입할 수 없어요. 회원 가입 없이 검사는 해 볼 수 있어요.
        </p>
        <label class="wiz__consent">
          <input v-model="form.agreed" type="checkbox" />
          <span>
            만 14세 이상이며,
            <a href="https://www.lighthouse.career/terms" target="_blank" rel="noopener">이용약관</a>과
            <a href="https://www.lighthouse.career/privacy" target="_blank" rel="noopener">개인정보처리방침</a>에 동의해요. (필수)
          </span>
        </label>
      </section>

      <!-- step 3: Q1 (단일) -->
      <section v-else-if="step === 3" class="wiz__step">
        <h2 class="wiz__title">지금 어떤 상황이신가요?</h2>
        <p class="wiz__desc">하나만 골라주세요.</p>
        <div class="wiz__options">
          <button
            v-for="opt in Q1"
            :key="opt.value"
            class="wiz__option"
            :class="{ 'wiz__option--active': form.q1 === opt.value }"
            @click="form.q1 = opt.value"
          >{{ opt.label }}</button>
        </div>
      </section>

      <!-- step 4: Q2 (중복) -->
      <section v-else-if="step === 4" class="wiz__step">
        <h2 class="wiz__title">요즘 진로에 대해<br/>어떤 고민이 있나요?</h2>
        <p class="wiz__desc">여러 개 골라도 돼요.</p>
        <div class="wiz__options">
          <button
            v-for="opt in Q2"
            :key="opt.value"
            class="wiz__option"
            :class="{ 'wiz__option--active': form.q2.includes(opt.value) }"
            @click="toggleQ2(opt.value)"
          >
            <span class="wiz__check" aria-hidden="true" />
            <span>{{ opt.label }}</span>
          </button>
        </div>
      </section>

      <!-- step 5: Q3 (단일) -->
      <section v-else-if="step === 5" class="wiz__step">
        <h2 class="wiz__title">나 자신에 대해<br/>얼마나 알고 있다고 생각하세요?</h2>
        <p class="wiz__desc">하나만 골라주세요.</p>
        <div class="wiz__options">
          <button
            v-for="opt in Q3"
            :key="opt.value"
            class="wiz__option"
            :class="{ 'wiz__option--active': form.q3 === opt.value }"
            @click="form.q3 = opt.value"
          >{{ opt.label }}</button>
        </div>
      </section>

      <p v-if="error" class="wiz__error">{{ error }}</p>
    </div>

    <footer class="wiz__footer">
      <button class="wiz__next" :disabled="!canNext || loading || checking" @click="next">
        {{ checking ? '확인 중...' : loading ? '가입 중...' : (isLast ? '가입 완료' : '다음') }}
      </button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { linkPendingGuestSurvey } from '@/shared/guest/guestSurvey'
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { req } from '@/shared/api'
import { useAuthStore } from '@/shared/stores/auth'
import {
  Q1, Q2, Q2_NONE, Q3, SIGNUP_STEPS,
  emptySignupForm, isStepComplete, resumeStep,
  saveSignupDraft, loadSignupDraft, clearSignupDraft, mergeSignupDraft,
  type SignupForm, type SignupMode,
} from '../lib/signupWizard'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// ── social 모드 ───────────────────────────────────────────
// 소셜 로그인은 콜백에서 **계정이 이미 만들어진다.** 그래서 계정 단계(step 0)는 건너뛰고,
// 카카오가 준 이름·나이를 채워둔 채 나머지를 이메일 가입과 똑같이 받는다.
// 제출도 register 가 아니라 complete-profile 로 간다(register 는 409 가 난다).
const isSocial = route.query.social === '1'

const TOTAL = SIGNUP_STEPS
const FIRST_STEP = isSocial ? 1 : 0
const step = ref(FIRST_STEP)
const isLast = computed(() => step.value === TOTAL - 1)

// 진행바는 '보이는 구간' 기준으로 센다 — social 은 5단계라 0/6 부터 시작하면 어긋난다.
const progressPct = computed(() =>
  Math.max(10, ((step.value - FIRST_STEP) / (TOTAL - FIRST_STEP)) * 100),
)

const form = reactive<SignupForm>(emptySignupForm())

// ── 입력 임시 보관(2026-11-17) ─────────────────────────────
// 브라우저 뒤로·앞으로·새로고침 때 처음부터 다시 시작하고 입력이 사라졌다(가입 흐름 시험 E3·E4).
// 이 탭의 sessionStorage 에 비밀번호를 뺀 입력과 단계를 두고, 다시 들어오면 채운다. 규칙은 lib/signupWizard.ts
const draftMode: SignupMode = isSocial ? 'social' : 'email'
let draftUid: string | null = null
let keepDraft = false // 되살리기를 마친 뒤부터 남긴다 — 되살리기 전의 빈 칸으로 보관분을 덮지 않게

function draftStorage(): Storage | null {
  try { return window.sessionStorage } catch { return null } // 막힌 환경
}

function restoreDraft(uid: string | null) {
  draftUid = uid
  const store = draftStorage()
  const draft = store ? loadSignupDraft(store, { mode: draftMode, uid }, Date.now()) : null
  if (draft) Object.assign(form, mergeSignupDraft(form, draft.fields))
  // 이메일 가입은 비밀번호를 보관하지 않아 0단계에서 다시 시작한다(나머지 칸은 채워져 있다)
  step.value = resumeStep(draft?.step ?? FIRST_STEP, FIRST_STEP, form)
  keepDraft = true
}

function dropDraft() {
  keepDraft = false
  const store = draftStorage()
  if (store) clearSignupDraft(store)
}

watch([form, step], () => {
  if (!keepDraft) return
  const store = draftStorage()
  if (store) saveSignupDraft(store, { mode: draftMode, uid: draftUid, step: step.value, form }, Date.now())
}, { deep: true })

onMounted(async () => {
  if (!isSocial) {
    restoreDraft(null)
    return
  }
  // 이 경로로 직접 들어왔거나 새로고침해서 유저가 비어 있을 수 있다.
  if (!authStore.token) {
    router.replace('/onboarding/auth')
    return
  }
  if (!authStore.user) await authStore.fetchMe()
  // 서버가 토큰을 거절했다(fetchMe 가 로그아웃함) — 위저드를 보여도 제출할 수 없다
  if (!authStore.token) {
    router.replace('/onboarding/auth')
    return
  }

  // 가입을 이미 마친 계정 — 새로고침·주소 직접 입력·옛 기록으로 위저드에 다시 닿아도 질문을 다시 보이지 않는다(시험 S12, 2026-11-17).
  // '/' 의 진입 가드가 계획 유무에 맞는 자리로 보낸다
  if (authStore.user?.onboarding?.answeredAt) {
    dropDraft()
    router.replace('/')
    return
  }

  // 카카오가 주는 건 이메일·닉네임뿐이다. 이메일은 위저드에서 묻지 않으므로 이름만 채운다.
  // ⚠️ 나이는 프리필하지 않는다 — 사용자가 직접 입력한다(2026-09-11 결정).
  //    출생연도 동의항목이 승인되면 서버가 age 를 채우게 되고, 그때는 아래 한 줄이 그대로 산다.
  form.name = authStore.user?.name ?? ''
  form.age = authStore.user?.age ?? null

  // 같은 계정이 보관해 둔 입력이 있으면 그 위에 덮고 그 단계에서 이어간다.
  // 계정을 못 알아보면(연결 끊김) 되살리지도 남기지도 않는다 — 지금처럼 1단계부터
  if (authStore.user?.uid) restoreDraft(authStore.user.uid)
})

function toggleQ2(value: number) {
  if (value === Q2_NONE) {
    form.q2 = form.q2.includes(Q2_NONE) ? [] : [Q2_NONE]
    return
  }
  // 다른 항목 선택 시 "아직 잘 모르겠어요" 해제
  const without = form.q2.filter((v) => v !== Q2_NONE)
  form.q2 = without.includes(value)
    ? without.filter((v) => v !== value)
    : [...without, value]
}

const error = ref('')

const canNext = computed(() => isStepComplete(step.value, form))

async function back() {
  error.value = ''
  if (step.value > FIRST_STEP) {
    step.value--
    return
  }
  // 첫 화면에서 더 뒤로 = 가입을 그만두겠다는 뜻.
  // social 은 **계정이 이미 만들어진 상태**라 그냥 나가면 로그인된 채 로그인 화면에 서게 된다.
  // 그래서 `logout=1` 을 달아 "이건 의도적인 이탈"이라고 전역 가드에 알린다
  // (가드는 이 표시가 없으면 브라우저 뒤로가기로 본다 — 2026-09-17 R5 수정).
  // 이메일 가입은 아직 토큰이 없어 가드가 걸리지 않으므로 표시가 필요 없다.
  const failure = await router.replace(isSocial ? { path: '/onboarding/auth', query: { logout: '1' } } : '/onboarding/auth')
  // 그만뒀으니 보관해 둔 입력도 지운다. 소셜에서 로그아웃 확인을 취소하면(이동이 취소됨) 남긴다
  if (!failure) dropDraft()
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const checking = ref(false)

async function next() {
  error.value = ''
  if (!canNext.value || loading.value || checking.value) return

  // step 0: 이메일 형식 + 비번 일치 + 중복체크
  if (step.value === 0) {
    if (!EMAIL_RE.test(form.email.trim())) {
      error.value = '올바른 이메일 형식을 입력해 주세요.'
      return
    }
    if (form.password !== form.passwordConfirm) {
      error.value = '비밀번호가 일치하지 않습니다.'
      return
    }
    checking.value = true
    try {
      const res = await req.get('/api/auth/check-email', { params: { email: form.email.trim() } })
      if (!res.data.available) {
        error.value = '이미 사용 중인 이메일이에요.'
        return
      }
    } catch (e: any) {
      error.value = e.response?.data?.error ?? '이메일 확인 중 오류가 발생했어요.'
      return
    } finally {
      checking.value = false
    }
  }

  if (isLast.value) submit()
  else step.value++
}

const loading = ref(false)

async function submit() {
  loading.value = true
  error.value = ''
  try {
    // 진로 온보딩 답변(Q1~Q3)은 가입 요청에 함께 실어 보낸다.
    // 2026-09-09 이전에는 localStorage 에만 넣었고 그 키를 읽는 코드가 어디에도 없어
    // 모든 가입자의 답이 그대로 버려졌다. 이제 서버가 source of truth 다.
    // 필드명은 API 스키마(User.onboarding)를 따른다 — q1/q2/q3 가 아니다.
    const profile = {
      name: form.name,
      age: form.age,
      gender: form.gender,
      onboarding: {
        status: form.q1,
        concerns: form.q2,
        selfAwareness: form.q3,
      },
    }

    if (isSocial) {
      // 계정은 소셜 콜백에서 이미 만들어졌다. 토큰도 이미 있으므로 나머지만 채운다.
      const res = await req.post('/api/auth/complete-profile', profile)
      authStore.user = res.data.user
    } else {
      const res = await req.post('/api/auth/register', { email: form.email, password: form.password, ...profile })
      authStore.setAuth(res.data.token, res.data.user)
    }
    dropDraft() // 가입을 마쳤다 — 임시 보관 지움

    // localStorage 는 오프라인 캐시로만 유지한다(다른 화면과 같은 방침).
    // 저장 실패가 가입 자체를 막으면 안 되므로 삼켜준다.
    try {
      localStorage.setItem(
        'lh_onboarding_v1',
        JSON.stringify({ q1: form.q1, q2: form.q2, q3: form.q3, at: new Date().toISOString() }),
      )
    } catch { /* quota */ }

    // 비회원 검사 → 가입이면 그 검사를 계정에 연결하고 결과지 전체로 돌아간다(소개 슬라이드·환영은 건너뜀, 2026-11-09).
    // 결과지의 [다음 단계로]가 3단계(/main/before)로 이어 준다
    const linked = await linkPendingGuestSurvey()
    router.replace(linked ? `${linked}?next=1` : '/onboarding/intro')
  } catch (e: any) {
    error.value = e.response?.data?.error ?? '회원가입 중 오류가 발생했어요.'
  } finally {
    loading.value = false
  }
}
</script>

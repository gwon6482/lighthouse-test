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
        <div class="wiz__progress-fill" :style="{ width: `${((step + 1) / TOTAL) * 100}%` }" />
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
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { req } from '@/shared/api'
import { useAuthStore } from '@/shared/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const TOTAL = 6
const step = ref(0)
const isLast = computed(() => step.value === TOTAL - 1)

const form = reactive({
  email: '',
  password: '',
  passwordConfirm: '',
  name: '',
  age: null as number | null,
  gender: '' as '' | 'M' | 'F',
  q1: null as number | null,
  q2: [] as number[],
  q3: null as number | null,
})

const Q1 = [
  { value: 1, label: '중·고등학생이에요' },
  { value: 2, label: '대학생(휴학 포함)이에요' },
  { value: 3, label: '취업을 준비하고 있어요' },
  { value: 4, label: '일하고 있지만 진로를 다시 고민 중이에요' },
]

const Q2 = [
  { value: 1, label: '내가 무엇을 좋아하고 잘하는지 모르겠어요' },
  { value: 2, label: '내가 선택할 수 있는 진로 분야에 어떤 것들이 있는지 잘 모르겠어요' },
  { value: 3, label: '관심 있는 분야는 있지만, 진로로 정해도 될지 모르겠어요' },
  { value: 4, label: '목표하는 진로는 있지만, 무엇부터 준비해야 할지 모르겠어요' },
  { value: 5, label: '목표를 향해 노력 중이지만, 맞는 방법인지 확신이 없어요' },
  { value: 6, label: '아직 잘 모르겠어요' },
]
const Q2_NONE = 6   // "아직 잘 모르겠어요" — 단독 선택

const Q3 = [
  { value: 1, label: '내가 무엇을 잘하고 좋아하는지 잘 알고 있어요' },
  { value: 2, label: '조금 알고 있어요' },
  { value: 3, label: '거의 모르는 것 같아요' },
]

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

const canNext = computed(() => {
  switch (step.value) {
    case 0: return !!form.email && form.password.length >= 6 && form.password === form.passwordConfirm
    case 1: return form.name.trim().length > 0
    case 2: return !!form.age && form.age > 0 && !!form.gender
    case 3: return form.q1 !== null
    case 4: return form.q2.length > 0
    case 5: return form.q3 !== null
    default: return false
  }
})

function back() {
  error.value = ''
  if (step.value > 0) step.value--
  else router.replace('/onboarding/auth')
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
    const res = await req.post('/api/auth/register', {
      email: form.email,
      password: form.password,
      name: form.name,
      age: form.age,
      gender: form.gender,
    })
    authStore.setAuth(res.data.token, res.data.user)

    // 진로 온보딩 답변은 아직 백엔드 스키마에 없어 로컬 저장 (2차: API 연동)
    localStorage.setItem(
      'lh_onboarding_v1',
      JSON.stringify({ q1: form.q1, q2: form.q2, q3: form.q3, at: new Date().toISOString() }),
    )

    router.replace('/onboarding/intro')
  } catch (e: any) {
    error.value = e.response?.data?.error ?? '회원가입 중 오류가 발생했어요.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.wiz {
  position: fixed;
  inset: 0;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  z-index: 1400;
}

/* ── 헤더 ── */
.wiz__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: max(12px, env(safe-area-inset-top)) 18px 12px;
}

.wiz__back {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: -8px;
}

.wiz__progress {
  flex: 1;
  height: 6px;
  background: #EFEFEF;
  border-radius: 999px;
  overflow: hidden;
}

.wiz__progress-fill {
  height: 100%;
  background: #FFD100;
  border-radius: 999px;
  transition: width 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* ── 본문 ── */
.wiz__body {
  flex: 1;
  overflow-y: auto;
  padding: 18px 24px 8px;
}

.wiz__step {
  display: flex;
  flex-direction: column;
}

.wiz__title {
  font-size: 23px;
  font-weight: 900;
  line-height: 1.35;
  letter-spacing: -0.5px;
  color: #1A1A1A;
  margin: 8px 0 10px;
}

.wiz__desc {
  font-size: 14px;
  font-weight: 500;
  color: #888;
  margin: 0 0 28px;
}

/* 입력 필드 */
.wiz__field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 18px;
}

.wiz__label {
  font-size: 13px;
  font-weight: 600;
  color: #1A1A1A;
}

.wiz__input {
  width: 100%;
  padding: 14px;
  font-size: 15px;
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

.wiz__gender {
  display: flex;
  gap: 10px;
}

.wiz__gender-btn {
  flex: 1;
  padding: 14px 0;
  font-size: 15px;
  font-weight: 700;
  font-family: inherit;
  border: 1px solid #EAEAEA;
  border-radius: 12px;
  background: #FAFAF8;
  color: #888;
  cursor: pointer;
  transition: all 0.15s;

  &--active {
    border-color: #FFD100;
    background: #FFF9D6;
    color: #1A1A1A;
  }
}

/* 선택지 (Q1~Q3) */
.wiz__options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wiz__option {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 16px 18px;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  line-height: 1.4;
  text-align: left;
  color: #333;
  border: 1.5px solid #EAEAEA;
  border-radius: 14px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s, transform 0.08s;

  &:active { transform: scale(0.99); }

  &--active {
    border-color: #FFD100;
    background: #FFFBEC;
    color: #1A1A1A;
  }
}

/* 중복선택 체크 표시 */
.wiz__check {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 1.5px solid #DADADA;
  background: #fff;
  position: relative;
  transition: all 0.12s;
}

.wiz__option--active .wiz__check {
  border-color: #FFD100;
  background: #FFD100;

  &::after {
    content: '';
    position: absolute;
    left: 6px;
    top: 2px;
    width: 5px;
    height: 10px;
    border: solid #1A1A1A;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
}

.wiz__error {
  font-size: 13px;
  font-weight: 600;
  color: #E53E3E;
  margin: 16px 0 0;
}

/* ── 푸터 ── */
.wiz__footer {
  padding: 12px 24px calc(24px + env(safe-area-inset-bottom));
}

.wiz__next {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  font-weight: 800;
  font-family: inherit;
  letter-spacing: -0.2px;
  color: #1A1A1A;
  background: #FFD100;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.15s, transform 0.08s;

  &:hover:not(:disabled) { background: #F0C400; }
  &:active:not(:disabled) { transform: scale(0.98); }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
}
</style>

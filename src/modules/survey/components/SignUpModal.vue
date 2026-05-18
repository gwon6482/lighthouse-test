<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-overlay" @click.self="emit('update:modelValue', false)">
        <div class="modal">
          <div class="modal__header">
            <h2 class="modal__title">회원가입</h2>
            <button class="modal__close" @click="emit('update:modelValue', false)" aria-label="닫기">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5l10 10" stroke="#888" stroke-width="1.8" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <form @submit.prevent="handleRegister" class="modal__form">
            <div class="modal__field">
              <label class="modal__label">이메일</label>
              <input
                type="email"
                v-model="form.email"
                placeholder="user@example.com"
                class="modal__input"
                autocomplete="email"
              />
            </div>

            <div class="modal__field">
              <label class="modal__label">비밀번호</label>
              <input
                type="password"
                v-model="form.password"
                placeholder="6자 이상"
                class="modal__input"
                autocomplete="new-password"
              />
            </div>

            <div class="modal__field">
              <label class="modal__label">비밀번호 확인</label>
              <input
                type="password"
                v-model="form.passwordConfirm"
                placeholder="••••••••"
                class="modal__input"
                autocomplete="new-password"
              />
            </div>

            <p v-if="errorMsg" class="modal__error">{{ errorMsg }}</p>
            <p v-if="successMsg" class="modal__success">{{ successMsg }}</p>

            <button type="submit" class="modal__submit" :disabled="loading">
              {{ loading ? '처리 중...' : '가입하기' }}
            </button>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { req } from '@/shared/api'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const form = reactive({ email: '', password: '', passwordConfirm: '' })
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

watch(() => props.modelValue, (open) => {
  if (!open) {
    form.email = ''
    form.password = ''
    form.passwordConfirm = ''
    errorMsg.value = ''
    successMsg.value = ''
  }
})

const handleRegister = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  if (!form.email || !form.password || !form.passwordConfirm) {
    errorMsg.value = '모든 항목을 입력해주세요.'
    return
  }
  if (form.password !== form.passwordConfirm) {
    errorMsg.value = '비밀번호가 일치하지 않습니다.'
    return
  }
  if (form.password.length < 6) {
    errorMsg.value = '비밀번호는 6자 이상이어야 합니다.'
    return
  }

  loading.value = true
  try {
    await req.post('/api/auth/register', { email: form.email, password: form.password })
    successMsg.value = '가입 완료! 로그인 해주세요.'
    setTimeout(() => emit('update:modelValue', false), 1500)
  } catch (e: any) {
    errorMsg.value = e.response?.data?.error ?? '회원가입 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: #fff;
  border-radius: 1.25rem;
  padding: 1.75rem 1.5rem;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
  }

  &__title {
    font-size: 1.125rem;
    font-weight: 800;
    color: #1a1a1a;
    letter-spacing: -0.3px;
  }

  &__close {
    width: 32px;
    height: 32px;
    border: none;
    background: #F5F5F0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s;

    &:hover { background: #EEEEE8; }
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  &__field {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  &__label {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #1a1a1a;
  }

  &__input {
    width: 100%;
    padding: 0.6875rem 0.875rem;
    font-size: 0.875rem;
    font-family: 'Pretendard', sans-serif;
    border: 1px solid #EEEEE8;
    border-radius: 0.75rem;
    background: #FAFAF8;
    color: #1a1a1a;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s, box-shadow 0.15s;

    &::placeholder { color: #ccc; }

    &:focus {
      border-color: #FFD100;
      box-shadow: 0 0 0 3px rgba(255, 209, 0, 0.15);
    }
  }

  &__error {
    font-size: 0.75rem;
    color: #e53e3e;
    font-weight: 600;
    margin: 0;
  }

  &__success {
    font-size: 0.75rem;
    color: #38a169;
    font-weight: 600;
    margin: 0;
  }

  &__submit {
    width: 100%;
    padding: 0.8125rem;
    margin-top: 0.25rem;
    font-size: 0.9375rem;
    font-weight: 800;
    font-family: 'Pretendard', sans-serif;
    letter-spacing: -0.2px;
    background: #FFD100;
    color: #1a1a1a;
    border: none;
    border-radius: 0.75rem;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;

    &:hover:not(:disabled) { background: #f0c400; }
    &:active:not(:disabled) { transform: scale(0.98); }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }
}

// 팝업 트랜지션
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;

  .modal {
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal {
    transform: translateY(12px);
    opacity: 0;
  }
}
</style>

<template>
  <section class="ecode">
    <h2 class="ecode__title" v-html="titleHtml" />
    <p class="ecode__desc">{{ desc }}</p>

    <div class="ecode__sentto">
      <b>{{ email }}</b>
      <button type="button" class="ecode__link" @click="emit('edit-email')">주소 고치기</button>
    </div>

    <!-- 칸 하나에 입력을 받고 여섯 칸은 보여 주기만 한다 — 붙여넣기·아이폰 메일 코드 자동 채우기(one-time-code)가 한 번에 들어가게 -->
    <label class="ecode__boxes" :class="{ 'ecode__boxes--bad': !!error }">
      <input
        ref="inputEl"
        v-model="raw"
        class="ecode__input"
        aria-label="메일로 받은 6자리 코드"
        type="text"
        inputmode="numeric"
        autocomplete="one-time-code"
        pattern="[0-9]*"
        maxlength="6"
        :disabled="busy"
        @input="onInput"
        @focus="focused = true"
        @blur="focused = false"
      />
      <span
        v-for="i in CODE_LENGTH"
        :key="i"
        class="ecode__box"
        :class="{ 'ecode__box--on': focused && i - 1 === Math.min(code.length, CODE_LENGTH - 1) }"
        aria-hidden="true"
      >{{ code[i - 1] ?? '' }}</span>
    </label>

    <p v-if="error" class="ecode__error" role="alert">{{ error }}</p>

    <div class="ecode__row">
      <span>메일이 안 왔나요?</span>
      <button v-if="left > 0" type="button" class="ecode__resend" disabled>다시 보내기 {{ countdown(left) }}</button>
      <button v-else type="button" class="ecode__resend ecode__resend--on" :disabled="sending" @click="resend">
        {{ sending ? '보내는 중…' : (expired ? '새 코드 받기' : '다시 보내기') }}
      </button>
    </div>
    <p class="ecode__hint">{{ hint }}</p>
  </section>
</template>

<script setup lang="ts">
// 메일로 받은 6자리 코드 적기 — 가입 확인(signup)과 비밀번호 찾기(reset)가 같이 쓴다(2026-11-22 시안 2판).
// 처음 보내기는 부모가 한다(가입: '코드 받기', 찾기: '코드 받기'). 여기서는 다시 보내기와 확인만.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { req } from '@/shared/api'
import { CODE_LENGTH, countdown, digitsOnly, readCodeCheck, sendErrorMessage } from '../lib/emailCode'

const props = defineProps<{
  purpose: 'signup' | 'reset'
  email: string
  /** 마지막으로 보낸 때(ms) — 다시 보내기는 그로부터 resendAfter 초 뒤 */
  sentAt: number
  resendAfter?: number
}>()
const emit = defineEmits<{
  (e: 'verified', ticket: string): void
  (e: 'edit-email'): void
  (e: 'resent', at: number): void
}>()

const titleHtml = computed(() => (props.purpose === 'signup' ? '메일로 받은 코드를<br/>적어 주세요' : '메일을 보냈어요'))
const desc = computed(() => (props.purpose === 'signup'
  ? '6자리 코드를 보냈어요. 10분 안에 적어 주세요.'
  : '가입한 메일이 맞다면 곧 6자리 코드가 와요. 10분 안에 적어 주세요.'))
const hint = computed(() => (props.purpose === 'signup'
  ? '메일이 안 보이면 스팸함도 봐 주세요.'
  : '스팸함도 봐 주세요. 카카오·구글로 가입했다면 로그인 방법을 메일로 알려 드렸어요.'))

const raw = ref('')
const code = computed(() => digitsOnly(raw.value))
const busy = ref(false)
const sending = ref(false)
const focused = ref(false)
const error = ref('')
const expired = ref(false)
const inputEl = ref<HTMLInputElement | null>(null)

// 다시 보내기 남은 초
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | undefined
const left = computed(() => Math.max(0, ((props.sentAt + (props.resendAfter ?? 60) * 1000) - now.value) / 1000))
onMounted(() => {
  timer = setInterval(() => { now.value = Date.now() }, 500)
  inputEl.value?.focus()
})
onBeforeUnmount(() => clearInterval(timer))

function onInput() {
  raw.value = code.value
  if (error.value && code.value.length < CODE_LENGTH) error.value = ''
  if (code.value.length === CODE_LENGTH && !expired.value) submit()   // 다 적으면 버튼 없이 바로 확인
}

async function submit() {
  if (busy.value) return
  busy.value = true
  const path = props.purpose === 'signup' ? '/api/auth/email/verify-code' : '/api/auth/password/check-code'
  let status = 0
  let body: any
  try {
    const res = await req.post(path, { email: props.email, code: code.value })
    status = res.status; body = res.data
  } catch (e: any) {
    status = e?.response?.status ?? 0; body = e?.response?.data
  } finally {
    busy.value = false
  }
  const r = readCodeCheck(status, body)
  if (r.ok) { emit('verified', r.ticket); return }
  error.value = r.message
  if (r.kind === 'expired') expired.value = true
  raw.value = ''
  inputEl.value?.focus()
}

async function resend() {
  if (sending.value) return
  sending.value = true
  error.value = ''
  try {
    const path = props.purpose === 'signup' ? '/api/auth/email/send-code' : '/api/auth/password/forgot'
    await req.post(path, { email: props.email })
    expired.value = false
    raw.value = ''
    emit('resent', Date.now())
    inputEl.value?.focus()
  } catch (e: any) {
    error.value = sendErrorMessage(e?.response?.status, e?.response?.data)
  } finally {
    sending.value = false
  }
}
</script>

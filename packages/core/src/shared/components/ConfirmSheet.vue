<template>
  <!-- 공용 확인 시트(2026-11-19) — 브라우저 기본 confirm 대신 쓴다. 모양은 앱의 다른 아래 시트(묶음 직업 고르기·회원 탈퇴)와 같다.
       처음 쓰는 곳: 마이 > 계정 > 로그아웃(2026-11-18 사용성 QA — 기본 창이 앱과 따로 놀았다).
       되돌릴 수 없는 일(탈퇴)은 이것으로 대신하지 않는다 — 그쪽은 AccountDeleteSheet 가 두 단계로 확인한다 -->
  <Teleport to="body">
    <div v-if="modelValue" class="cfs" @click.self="close" @keydown.esc="close">
      <div class="cfs__sheet" role="alertdialog" aria-modal="true" aria-labelledby="cfs-title" :aria-describedby="message ? 'cfs-msg' : undefined">
        <p id="cfs-title" class="cfs__title">{{ title }}</p>
        <p v-if="message" id="cfs-msg" class="cfs__msg">{{ message }}</p>
        <!-- 숫자 표 같은 덧붙임(2026-11-26 완료 취소 확인 판) -->
        <slot />
        <button ref="okEl" type="button" class="cfs__ok" @click="ok">{{ confirmLabel }}</button>
        <button type="button" class="cfs__cancel" @click="close">{{ cancelLabel }}</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
}>(), { message: '', confirmLabel: '확인', cancelLabel: '취소' })

const emit = defineEmits<{
  'update:modelValue': [boolean]
  confirm: []
}>()

const okEl = ref<HTMLButtonElement | null>(null)
// 열리면 확인 버튼에 초점 — 키보드·화면 읽기 프로그램이 시트 안에서 시작한다. 닫히면 연 버튼으로 돌려준다
let opener: HTMLElement | null = null
watch(() => props.modelValue, async (open) => {
  if (open) {
    opener = document.activeElement as HTMLElement | null
    await nextTick()
    okEl.value?.focus()
  } else {
    opener?.focus?.()
    opener = null
  }
})

function close() {
  emit('update:modelValue', false)
}
function ok() {
  emit('confirm')
  close()
}
</script>

<style lang="scss" scoped>
.cfs {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);

  &__sheet {
    width: 100%;
    max-width: 480px;
    padding: 24px 20px calc(20px + env(safe-area-inset-bottom));
    border-radius: 20px 20px 0 0;
    background: #fff;
  }

  &__title {
    margin: 0 0 6px;
    font-size: 17px;
    font-weight: 700;
    color: #111;
  }

  &__msg {
    margin: 0 0 4px;
    font-size: 13.5px;
    line-height: 1.55;
    color: #666;
    white-space: pre-line;
  }

  &__ok {
    width: 100%;
    margin-top: 16px;
    padding: 14px;
    border: 0;
    border-radius: 12px;
    background: #FFC700;
    font-size: 15px;
    font-weight: 700;
    font-family: inherit;
    color: #222;
    cursor: pointer;
  }

  &__cancel {
    width: 100%;
    margin-top: 8px;
    padding: 13px;
    border: 0;
    border-radius: 12px;
    background: #f1f2f4;
    font-size: 14px;
    font-family: inherit;
    color: #555;
    cursor: pointer;
  }
}
</style>

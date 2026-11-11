<template>
  <!-- 카카오·구글 공식 모양 버튼(2026-11-11, 비회원 결과지 잠금 상자 A안) — 카카오: 노란 바탕·검은 말풍선 / 구글: 흰 바탕·회색 테두리·4색 G.
       ⚠️ 로고 모양과 색은 각 회사 가이드 그대로 둔다(자체 아이콘 AppIcon 으로 바꾸지 않는다) -->
  <button type="button" :class="['sbtn', `sbtn--${provider}`]">
    <svg v-if="provider === 'kakao'" class="sbtn__logo" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#000000" d="M12 3.6c-5.3 0-9.6 3.36-9.6 7.5 0 2.66 1.77 5 4.45 6.33l-1.13 4.13c-.1.36.31.65.62.44l4.93-3.26c.24.02.48.03.73.03 5.3 0 9.6-3.36 9.6-7.5S17.3 3.6 12 3.6z" />
    </svg>
    <svg v-else class="sbtn__logo sbtn__logo--g" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
    <span><slot /></span>
  </button>
</template>

<script setup lang="ts">
import type { Provider } from '@/shared/auth/oauth'

defineProps<{ provider: Provider }>()
</script>

<style scoped lang="scss">
.sbtn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 56px;
  padding: 0 16px;
  border: 1px solid transparent;
  border-radius: 12px;
  font: inherit;
  font-size: 1.03rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: filter 0.15s, background 0.15s, transform 0.1s;

  &:active { transform: scale(0.99); }
  &:focus-visible { outline: 2px solid #1a1a1a; outline-offset: 2px; }

  &--kakao {
    background: #fee500;
    color: rgba(0, 0, 0, 0.85);
    &:hover { filter: brightness(0.97); }
  }

  &--google {
    background: #fff;
    border-color: #747775;
    color: #1f1f1f;
    &:hover { background: #f8f9fa; }
  }
}
.sbtn__logo { flex: none; width: 22px; height: 22px; }
.sbtn__logo--g { width: 20px; height: 20px; }
</style>

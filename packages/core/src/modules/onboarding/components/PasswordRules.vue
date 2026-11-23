<template>
  <!-- 새 비밀번호 칸 바로 아래 조건 줄(2026-11-23 핫픽스) — 적는 동안 조건이 채워지는 대로 회색 → 초록 체크로 바뀐다.
       규칙의 정본은 서버다(lib/emailCode.ts passwordChecks 주석). 이 줄은 '왜 버튼이 꺼져 있는지'를 보여 주는 자리 -->
  <div :id="id" class="pw-rules" aria-live="polite">
    <ul class="pw-rules__list">
      <li v-for="[key, label] in PASSWORD_CHECK_LABELS" :key="key" class="pw-rules__item" :class="{ 'pw-rules__item--ok': checks[key] }">
        <AppIcon name="ui-check" class="pw-rules__mark" />
        <span>{{ label }}</span>
        <span class="pw-rules__sr">{{ checks[key] ? '(채웠어요)' : '(아직)' }}</span>
      </li>
    </ul>
    <p v-if="tooLong" class="pw-rules__warn">{{ NEW_PASSWORD_MAX }}자 이하로 적어 주세요.</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { NEW_PASSWORD_MAX, PASSWORD_CHECK_LABELS, passwordChecks, passwordTooLong } from '../lib/emailCode'

const props = defineProps<{ password: string; id?: string }>()
const checks = computed(() => passwordChecks(props.password))
const tooLong = computed(() => passwordTooLong(props.password))
</script>

<style scoped>
.pw-rules { margin-top: 2px; }
.pw-rules__list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin: 0;
  padding: 0 0 0 1px;
  list-style: none;
}
.pw-rules__item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  line-height: 1.4;
  color: #767676; /* $color-text-meta */
  transition: color 0.15s;
}
.pw-rules__mark { font-size: 14px; color: #c8c8c8; transition: color 0.15s; }
/* 채운 조건 — 흰 바탕에서 읽히게 $color-success(#1DB95A)보다 진한 초록으로 글을 쓴다 */
.pw-rules__item--ok { color: #13843f; }
.pw-rules__item--ok .pw-rules__mark { color: #1db95a; }
.pw-rules__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.pw-rules__warn { margin: 6px 0 0; font-size: 13px; font-weight: 500; color: #e53e3e; }
</style>

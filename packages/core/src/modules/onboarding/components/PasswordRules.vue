<template>
  <!-- 새 비밀번호 칸 바로 아래 조건 줄(2026-11-23 핫픽스) — 적는 동안 못 채운 조건은 빈 동그라미, 채운 조건은 초록 체크.
       규칙의 정본은 서버다(lib/emailCode.ts passwordChecks 주석). 이 줄은 '왜 버튼이 꺼져 있는지'를 보여 주는 자리 -->
  <div :id="id" class="pw-rules">
    <ul class="pw-rules__list">
      <li v-for="[key, label] in PASSWORD_CHECK_LABELS" :key="key" class="pw-rules__item" :class="{ 'pw-rules__item--ok': checks[key] }">
        <AppIcon v-if="checks[key]" name="ui-check" class="pw-rules__mark" />
        <span v-else class="pw-rules__dot" aria-hidden="true" />
        <span>{{ label }}<span class="pw-rules__sr">, {{ checks[key] ? '채웠어요' : '아직이에요' }}</span></span>
      </li>
    </ul>
    <p v-if="tooLong" class="pw-rules__warn">{{ NEW_PASSWORD_MAX }}자 이하로 적어 주세요.</p>
    <!-- 화면 읽기: 상태가 바뀔 때만 조건 이름과 상태를 한 문장으로 읽는다(목록 전체를 live 로 두면 바뀐 '채웠어요'만 읽혔다) -->
    <p class="pw-rules__sr" aria-live="polite">{{ spoken }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { NEW_PASSWORD_MAX, PASSWORD_CHECK_LABELS, passwordChecks, passwordTooLong } from '../lib/emailCode'

const props = defineProps<{ password: string; id?: string }>()
const checks = computed(() => passwordChecks(props.password))
const tooLong = computed(() => passwordTooLong(props.password))
// 아무것도 안 적었을 때는 읽지 않는다(칸에 들어설 때 aria-describedby 로 목록이 읽힌다)
const spoken = computed(() => !props.password ? ''
  : PASSWORD_CHECK_LABELS.map(([k, l]) => `${l} ${checks.value[k] ? '채웠어요' : '아직이에요'}`).join(', '))
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
  gap: 5px;
  font-size: 13px;
  line-height: 1.4;
  color: #767676; /* $color-text-meta */
}
/* 못 채운 조건 — 빈 동그라미(체크 모양을 쓰지 않는다: 이미 통과한 것처럼 읽혔다, 검토 11-23) */
.pw-rules__dot {
  width: 10px;
  height: 10px;
  margin: 0 2px;
  border: 1.5px solid #b5b5b5;
  border-radius: 50%;
  box-sizing: border-box;
  flex-shrink: 0;
}
.pw-rules__mark { font-size: 14px; color: #1db95a; }
/* 채운 조건 — 흰 바탕에서 읽히게 $color-success(#1DB95A)보다 진한 초록으로 글을 쓴다 */
.pw-rules__item--ok { color: #13843f; }
.pw-rules__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.pw-rules__warn { margin: 6px 0 0; font-size: 13px; font-weight: 500; color: #e53e3e; }
</style>

<template>
  <div class="scale-question-10">
    <p class="question-text">
      <span class="question-num">{{ questionNum }}.</span>
      {{ questionText }}
    </p>
    <!-- 1~10 한 줄 + 양 끝 라벨 -->
    <div class="scale-track">
      <div class="options">
        <button
          v-for="(option, i) in options"
          :key="option.value"
          type="button"
          :class="['option-btn', { selected: modelValue === option.value }]"
          :style="scale10Style(i)"
          @click="selectOption(option.value)"
        >{{ option.label }}</button>
      </div>
      <div class="scale-ends" aria-hidden="true">
        <span>그렇지 않다</span>
        <span>그렇다</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ScaleQuestion10 컴포넌트
 *
 * 설문 조사의 척도형 질문을 렌더링하는 컴포넌트
 * - 10점 척도 (1~10), 한 줄 배치
 * - 색은 scaleColors.ts — 베이직 원 버튼 다섯 색 기준
 *
 * 사용처: T1(성격), T21(재능) 파트
 */
import { scale10Style } from '@/modules/survey/scaleColors'

defineProps<{
  questionId: string
  questionNum: string
  questionText: string
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const options = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}))

function selectOption(value: string) {
  emit('update:modelValue', value)
}
</script>

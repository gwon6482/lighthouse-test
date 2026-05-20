<template>
  <div class="t3-wrap">
    <div
      v-for="(item, i) in items"
      :key="item.item_id"
      class="t3-part"
    >
      <p class="t3-part-label">파트 {{ i + 1 }} · {{ item.item_name }}</p>
      <p class="t3-part-question">{{ item.item_question }}</p>

      <!-- 레벨 카드 5개 (가로 스크롤) -->
      <div class="t3-cards">
        <button
          v-for="level in 5"
          :key="level"
          type="button"
          class="t3-card"
          :class="{ 'is-selected': modelValue[item.item_id as keyof T3Answers] === level }"
          @click="handleSelect(item.item_id, level)"
        >
          <img
            class="t3-card-img"
            :src="`/t3_img/${item.item_id.replace('T3_', '')}_L${level}_transparent.png`"
            :alt="`${item.item_name} 레벨 ${level}`"
          />
          <span class="t3-card-num">{{ level }}</span>
          <span class="t3-card-desc">{{ levelDesc(item, level) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { T3Answers, SurveyItem } from '@/modules/survey/types/survey'

const props = defineProps<{ modelValue: T3Answers; items: SurveyItem[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: T3Answers] }>()

function handleSelect(itemId: string, level: number) {
  emit('update:modelValue', { ...props.modelValue, [itemId]: level })
}

function levelDesc(item: SurveyItem, level: number): string {
  const found = item.levels?.find((l: { level: number; description: string }) => l.level === level)
  return found?.description ?? ''
}
</script>

<style scoped>
.t3-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 4px 24px;
}

.t3-part {
  background: #fff;
  border: 0.5px solid #E4E4E0;
  border-radius: 16px;
  padding: 18px 16px 16px;
}

.t3-part-label {
  font-size: 11px;
  font-weight: 600;
  color: #2E9090;
  letter-spacing: 0.02em;
  margin-bottom: 6px;
}

.t3-part-question {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A1A;
  line-height: 1.5;
  margin-bottom: 14px;
}

/* 카드 5개 그리드 — 화면 너비에 균등 분배 */
.t3-cards {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

/* 개별 레벨 카드 */
.t3-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 8px 4px 10px;
  border: 1.5px solid #E4E4E0;
  border-radius: 14px;
  background: #FAFAF8;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.15s, background 0.15s;
  -webkit-tap-highlight-color: transparent;
  min-width: 0;
}

.t3-card.is-selected {
  border-color: #219E92;
  background: #EBF7F6;
}

.t3-card:active {
  background: #E0F2F0;
}

/* 이미지 */
.t3-card-img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  border-radius: 10px;
  flex-shrink: 0;
}

/* 레벨 번호 */
.t3-card-num {
  font-size: 13px;
  font-weight: 700;
  color: #AAAAAA;
  line-height: 1;
}

.t3-card.is-selected .t3-card-num {
  color: #1A8A80;
}

/* 레벨 설명 */
.t3-card-desc {
  font-size: 10.5px;
  color: #888;
  line-height: 1.45;
  word-break: keep-all;
}

.t3-card.is-selected .t3-card-desc {
  color: #2E7A76;
}
</style>

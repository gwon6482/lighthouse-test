<template>
  <div class="t3-wrap" :style="{ '--t3-area': AREA_COLOR.environment.text }">
    <section
      v-for="(item, i) in items"
      :key="item.item_id"
      class="t3-part"
    >
      <!-- 헤더가 이미 '파트 3' 이라 문항 번호에는 '파트' 를 붙이지 않는다 (2026-11-15) -->
      <p class="t3-part-label">{{ i + 1 }} · {{ item.item_name }}</p>
      <p class="t3-part-question">{{ item.item_question }}</p>

      <!-- 단계 5개 — 문장만 세로 목록(사진은 넣지 않는다: 앞 파트들과 같은 구성, 2026-11-15) -->
      <div class="t3-cards">
        <button
          v-for="level in 5"
          :key="level"
          type="button"
          class="t3-card"
          :class="{ 'is-selected': modelValue[item.item_id as keyof T3Answers] === level }"
          :aria-pressed="modelValue[item.item_id as keyof T3Answers] === level"
          @click="handleSelect(item.item_id, level)"
        >
          <span class="t3-card-num" aria-hidden="true">{{ level }}</span>
          <span class="t3-card-desc">{{ levelDesc(item, level) }}</span>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { T3Answers, SurveyItem } from '@/modules/survey/types/survey'
import { AREA_COLOR } from '@/modules/survey/surveyIcons'

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

<style scoped lang="scss">
@use 'variables' as *;

// 가치관(PriorityQuestion)과 같은 한 줄 카드·노랑 선택. 글씨 회색은 결과지 4단계만 쓴다
// 검사 화면 색은 선택 버튼이 주인공 — 예외로 소제목 글자에만 영역색(파트 3 표지의 '파트 3' 라벨과 같은 방식, 2026-11-15)
.t3-wrap {
  display: flex;
  flex-direction: column;
  gap: 40px; // 질문끼리는 상자 대신 간격으로 나눈다
  padding: $space-lg 0 24px;
}

.t3-part-label {
  font-size: $fs-xs;
  font-weight: $fw-semibold;
  color: var(--t3-area); // AREA_COLOR.environment.text
  margin: 0 0 6px;
}

.t3-part-question {
  font-size: $fs-base;
  font-weight: $fw-medium;
  line-height: 1.5;
  color: $color-text;
  word-break: keep-all;
  margin: 0 0 $space-lg;
}

.t3-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.t3-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  border: 2px solid $color-border;
  border-radius: 10px;
  background: $color-surface;
  font-family: inherit; // button 은 글꼴을 물려받지 않는다 — 없으면 Arial 로 나온다
  cursor: pointer;
  text-align: left;
  transition: border-color $transition-base, background $transition-base;
  -webkit-tap-highlight-color: transparent;

  // 터치 기기에서 탭 뒤 :hover 가 남지 않게 마우스 기기에서만
  @media (hover: hover) {
    &:hover:not(.is-selected) {
      border-color: $color-text-secondary;
      background: $color-surface-alt;
    }
  }

  &:active {
    background: $color-primary-tint;
  }

  &.is-selected {
    border-color: $color-primary;
    background: $color-primary-tint;
  }
}

/* 단계 번호 원 */
.t3-card-num {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  box-sizing: border-box;
  border: 2px solid $color-border-strong;
  border-radius: 50%;
  font-size: 13px;
  font-weight: $fw-semibold;
  line-height: 1;
  color: $color-text-meta;

  .is-selected & {
    border-color: $color-primary;
    background: $color-primary;
    color: $color-text; // 흰 숫자는 노랑 위에서 안 보인다
  }
}

/* 단계 설명 */
.t3-card-desc {
  min-width: 0;
  font-size: $fs-md;
  font-weight: $fw-regular;
  line-height: 1.45;
  color: $color-text-body;
  word-break: keep-all;
  text-wrap: pretty;

  .is-selected & {
    font-weight: $fw-medium;
    color: $color-text;
  }
}
</style>

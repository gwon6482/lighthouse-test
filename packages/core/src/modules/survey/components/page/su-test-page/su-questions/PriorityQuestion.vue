<script setup lang="ts">
import type { PriorityItem, PriorityValue } from '@/modules/survey/types/survey'

const props = defineProps<{
  items: PriorityItem[]
  modelValue: PriorityValue
}>()

const emit = defineEmits<{
  'update:modelValue': [value: PriorityValue]
}>()

function getPriorityRank(itemId: string): number | null {
  if (props.modelValue.priority_1 === itemId) return 1
  if (props.modelValue.priority_2 === itemId) return 2
  if (props.modelValue.priority_3 === itemId) return 3
  return null
}

function togglePriority(itemId: string) {
  const currentRank = getPriorityRank(itemId)
  const newValue = { ...props.modelValue }

  if (currentRank !== null) {
    if (currentRank === 1) newValue.priority_1 = ''
    if (currentRank === 2) newValue.priority_2 = ''
    if (currentRank === 3) newValue.priority_3 = ''
  } else {
    if (!newValue.priority_1) {
      newValue.priority_1 = itemId
    } else if (!newValue.priority_2) {
      newValue.priority_2 = itemId
    } else if (!newValue.priority_3) {
      newValue.priority_3 = itemId
    } else {
      return
    }
  }

  const selectedIds = [newValue.priority_1, newValue.priority_2, newValue.priority_3].filter(Boolean)
  newValue.no_priority = props.items
    .map(item => item.item_id)
    .filter(id => !selectedIds.includes(id))

  emit('update:modelValue', newValue)
}

</script>

<template>
  <div class="pq-wrap">
    <p class="pq-instruction">가장 중요하게 생각하는 가치를 순서대로 3개 선택해주세요.</p>

    <!-- 가치관 목록 — 문장만 보여준다(사진·가치관 이름은 넣지 않는다: 이름만 보고 고르지 않게, 2026-11-15) -->
    <!-- 순위는 각 줄 왼쪽 원이 보여주므로 위쪽 슬롯은 두지 않는다 -->
    <div class="pq-list">
      <button
        v-for="item in items"
        :key="item.item_id"
        type="button"
        class="pq-card"
        :class="{ 'is-selected': getPriorityRank(item.item_id) !== null }"
        :aria-pressed="getPriorityRank(item.item_id) !== null"
        @click="togglePriority(item.item_id)"
      >
        <!-- 순위 원: 고르기 전 빈 원, 고르면 노란 원 안에 순위 -->
        <span class="pq-rank" aria-hidden="true">{{ getPriorityRank(item.item_id) ?? '' }}</span>
        <span class="pq-card-name">{{ item.item_text }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use 'variables' as *;

// 글씨 회색은 결과지 4단계(강조 $color-text · 본문 $color-text-body · 보조 $color-text-sub · 메타 $color-text-meta)만 쓴다 — SUQuestions.scss 와 같은 규칙
// 지시문·간격은 흥미 화면(.multi-select-question)과 같다 — 위 여백·지시문→목록 $space-lg, 좌우 들여쓰기 없음
.pq-wrap {
  display: flex;
  flex-direction: column;
  gap: $space-lg;
  padding: $space-lg 0 24px;

  // 데스크탑은 목록 아래가 많이 비어 지시문→목록만 32px 로 띄운다(지시문 위치는 그대로).
  // 768px = SelfUnderstandingTest.scss 의 $survey-desktop-min(그 파일 안 변수라 여기서 못 불러온다)
  @media (min-width: 768px) {
    gap: 32px;
  }
}

.pq-instruction {
  font-size: $fs-base;
  font-weight: $fw-medium;
  color: $color-text;
  line-height: 1.5;
  word-break: keep-all; // 두 줄이 될 때 '선택해주 / 세요.'로 끊기지 않게
  margin: 0;
}

/* 가치관 목록 — 흥미 화면(.item-btn)과 같은 한 줄 카드 */
.pq-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pq-card {
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

/* 순위 원 */
.pq-rank {
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
  color: $color-text; // 흰 숫자는 노랑 위에서 안 보인다

  .is-selected & {
    border-color: $color-primary;
    background: $color-primary;
  }
}

/* 가치관 문장 */
.pq-card-name {
  min-width: 0;
  font-size: $fs-md;
  font-weight: $fw-regular;
  line-height: 1.45;
  color: $color-text-body;
  word-break: keep-all;
  text-wrap: pretty; // 끝 단어 하나만 다음 줄로 떨어지지 않게

  .is-selected & {
    font-weight: $fw-medium;
    color: $color-text;
  }
}
</style>

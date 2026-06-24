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

function getSlotItem(slot: 'priority_1' | 'priority_2' | 'priority_3'): PriorityItem | null {
  const id = props.modelValue[slot]
  if (!id) return null
  return props.items.find(i => i.item_id === id) ?? null
}

function imgSrc(item: PriorityItem): string {
  return `/t23_img/${item.value_code}_transparent.png`
}
</script>

<template>
  <div class="pq-wrap">
    <p class="pq-instruction">가장 중요하게 생각하는 가치를 순서대로 3개 선택해주세요.</p>

    <!-- 선택 슬롯 -->
    <div class="pq-slots">
      <div
        v-for="(slot, idx) in (['priority_1', 'priority_2', 'priority_3'] as const)"
        :key="slot"
        class="pq-slot"
        :class="{ 'is-filled': !!getSlotItem(slot) }"
      >
        <span class="pq-slot-rank">{{ idx + 1 }}</span>
        <template v-if="getSlotItem(slot)">
          <img
            class="pq-slot-img"
            :src="imgSrc(getSlotItem(slot)!)"
            :alt="getSlotItem(slot)!.item_text || ''"
          />
          <span class="pq-slot-name">{{ getSlotItem(slot)!.item_text }}</span>
        </template>
        <span v-else class="pq-slot-name">-</span>
      </div>
    </div>

    <!-- 가치관 이미지 카드 그리드 -->
    <div class="pq-grid">
      <button
        v-for="item in items"
        :key="item.item_id"
        type="button"
        class="pq-card"
        :class="{ 'is-selected': getPriorityRank(item.item_id) !== null }"
        @click="togglePriority(item.item_id)"
      >
        <!-- 순위 배지 -->
        <span v-if="getPriorityRank(item.item_id)" class="pq-rank-badge">
          {{ getPriorityRank(item.item_id) }}
        </span>

        <!-- 이미지 -->
        <img
          class="pq-card-img"
          :src="imgSrc(item)"
          :alt="item.item_text || ''"
        />

        <!-- 정의 문장 -->
        <span class="pq-card-name">{{ item.item_text }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.pq-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 4px 24px;
}

.pq-instruction {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin: 0;
}

/* 선택 슬롯 3개 */
.pq-slots {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.pq-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px;
  border: 1.5px dashed #D8D8D4;
  border-radius: 12px;
  background: #FAFAF8;
  min-height: 58px;
  transition: border-color 0.15s, background 0.15s;
}

.pq-slot-img {
  width: 60%;
  aspect-ratio: 1;
  object-fit: contain;
}

.pq-slot.is-filled {
  border-style: solid;
  border-color: #6C63FF;
  background: #F0EFFE;
}

.pq-slot-rank {
  font-size: 11px;
  font-weight: 700;
  color: #BBBBBB;
  line-height: 1;
}

.pq-slot.is-filled .pq-slot-rank {
  color: #6C63FF;
}

.pq-slot-name {
  font-size: 11px;
  font-weight: 600;
  color: #BBBBBB;
  text-align: center;
  word-break: keep-all;
  line-height: 1.3;
}

.pq-slot.is-filled .pq-slot-name {
  color: #4A44CC;
}

/* 카드 그리드 — 4열 */
.pq-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

/* 개별 카드 */
.pq-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 4px 10px;
  border: 1.5px solid #E4E4E0;
  border-radius: 14px;
  background: #FAFAF8;
  cursor: pointer;
  text-align: center;
  transition: border-color 0.15s, background 0.15s;
  -webkit-tap-highlight-color: transparent;
  min-width: 0;
}

.pq-card.is-selected {
  border-color: #6C63FF;
  background: #F0EFFE;
}

.pq-card:active {
  background: #E8E6FC;
}

/* 순위 배지 */
.pq-rank-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #6C63FF;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* 이미지 */
.pq-card-img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  border-radius: 10px;
}

/* 가치관 이름 */
.pq-card-name {
  font-size: 10.5px;
  font-weight: 600;
  color: #555;
  line-height: 1.3;
  word-break: keep-all;
}

.pq-card.is-selected .pq-card-name {
  color: #4A44CC;
}
</style>

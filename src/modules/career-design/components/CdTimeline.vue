<template>
  <div class="cd-timeline">
    <div class="cd-timeline__header">
      <span class="cd-timeline__label">타임라인</span>
      <span class="cd-timeline__range">{{ range }}</span>
    </div>
    <div class="cd-timeline__body">
      <div
        v-for="month in months"
        :key="month.label"
        class="cd-timeline__month"
      >
        <div class="cd-timeline__month-row">
          <span class="cd-timeline__month-badge">{{ month.label }}</span>
          <div class="cd-timeline__line" />
        </div>
        <div class="cd-timeline__items">
          <div
            v-for="item in month.items"
            :key="item.projectId"
            class="cd-timeline__item"
            @click="$emit('item-click', item.projectId)"
          >
            <CdCategoryIcon :category="item.category" />
            <div class="cd-timeline__item-text">
              <span class="cd-timeline__item-name">{{ item.projectName }}</span>
              <span class="cd-timeline__item-meta">📅 {{ item.date }} · 진로지식</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TimelineMonth } from '../types/career-design'
import CdCategoryIcon from './CdCategoryIcon.vue'

defineProps<{ months: TimelineMonth[]; range: string }>()
defineEmits<{ 'item-click': [projectId: string] }>()
</script>

<style lang="scss">
.cd-timeline {
  background: #fff;
  border-radius: 16px;
  padding: 20px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  &__label {
    font-size: 16px;
    font-weight: 700;
    color: #222;
  }

  &__range {
    font-size: 12px;
    color: #aaa;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__month-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  &__month-badge {
    background: #FFC700;
    color: #222;
    font-size: 13px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 20px;
    white-space: nowrap;
  }

  &__line {
    flex: 1;
    height: 1px;
    background: #eee;
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding-left: 8px;
    border-left: 2px solid #FFC700;
    margin-left: 6px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    padding: 4px 0 4px 12px;

    &:active { opacity: 0.7; }
  }

  &__item-text {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__item-name {
    font-size: 15px;
    font-weight: 600;
    color: #222;
  }

  &__item-meta {
    font-size: 12px;
    color: #aaa;
  }
}
</style>

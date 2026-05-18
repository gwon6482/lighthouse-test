<template>
  <div class="cd-plan-card" @click="$emit('click')">
    <h3 class="cd-plan-card__title">{{ plan.name }}</h3>
    <div class="cd-plan-card__meta">
      <span class="cd-plan-card__author">👤 {{ plan.author }}</span>
      <span class="cd-plan-card__dot">·</span>
      <span>{{ plan.duration }}</span>
    </div>
    <p class="cd-plan-card__desc">{{ plan.description }}</p>
    <div class="cd-plan-card__tags">
      <span v-for="tag in plan.tags" :key="tag" class="cd-plan-card__tag">{{ tag }}</span>
    </div>
    <div class="cd-plan-card__footer">
      <div class="cd-plan-card__stats">
        <span>♡ {{ plan.likes }}</span>
        <span>👁 {{ plan.views }}</span>
      </div>
      <div class="cd-plan-card__counts">
        <span>{{ plan.routineCount }}개 루틴</span>
        <span>{{ plan.projects.length }}개 계획</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CareerPlan } from '../types/career-design'

defineProps<{ plan: CareerPlan }>()
defineEmits<{ click: [] }>()
</script>

<style lang="scss">
.cd-plan-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;

  &__title {
    font-size: 16px;
    font-weight: 700;
    color: #222;
    margin-bottom: 6px;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #888;
    margin-bottom: 8px;
  }

  &__dot { color: #ccc; }

  &__desc {
    font-size: 13px;
    color: #555;
    line-height: 1.5;
    margin-bottom: 12px;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 14px;
  }

  &__tag {
    background: #E8F0FE;
    color: #4A6FA5;
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 20px;
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__stats {
    display: flex;
    gap: 10px;
    font-size: 13px;
    color: #aaa;
  }

  &__counts {
    display: flex;
    gap: 8px;
    font-size: 13px;
    color: #FFC700;
    font-weight: 600;
  }
}
</style>

<template>
  <header class="job-detail-header">
    <button class="job-detail-header__back" @click="router.back()">‹</button>

    <div class="job-detail-header__info">
      <div class="job-detail-header__classifications">
        <span class="job-detail-header__primary">{{ classification.primary }}</span>
        <span class="job-detail-header__dot">·</span>
        <span class="job-detail-header__secondary">{{ classification.secondary }}</span>
      </div>
      <h1 class="job-detail-header__title">{{ title }}</h1>
      <div v-if="isRecommended" class="job-detail-header__recommend-badge">
        <span class="job-detail-header__recommend-icon">✦</span>
        맞춤 추천 직업
      </div>
    </div>

    <button
      class="job-detail-header__like"
      :class="{ 'job-detail-header__like--active': isLiked }"
      @click="emit('toggle-like')"
      aria-label="좋아요"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
             2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
             C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5
             c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          :fill="isLiked ? '#FF5A5A' : 'none'"
          :stroke="isLiked ? '#FF5A5A' : '#ccc'"
          stroke-width="1.8"
        />
      </svg>
    </button>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { JobClassification } from '../../../types/encyclopedia'

defineProps<{
  title: string
  classification: JobClassification
  isLiked: boolean
  isRecommended: boolean
}>()

const emit = defineEmits<{
  'toggle-like': []
}>()

const router = useRouter()
</script>

<style scoped lang="scss">
.job-detail-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 40px 20px 30px;
  width: 100%;

  &__back {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    border: none;
    background-color: #f5f5f5;
    border-radius: 10px;
    font-size: 22px;
    color: #333;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    padding-bottom: 1px;
    transition: background-color 0.15s ease;
    margin-top: 2px;

    &:active { background-color: #e8e8e8; }
  }

  &__info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__classifications {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }

  &__primary,
  &__secondary {
    font-size: 12px;
    color: #888;
  }

  &__dot {
    font-size: 12px;
    color: #ccc;
  }

  &__title {
    font-size: 24px;
    font-weight: 700;
    color: #333;
  }

  &__recommend-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
    padding: 4px 10px;
    background: linear-gradient(135deg, #eef2ff, #e0e7ff);
    border: 1px solid #c7d2fe;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    color: #4f46e5;
    width: fit-content;
  }

  &__recommend-icon {
    font-size: 10px;
    color: #6366f1;
  }

  &__like {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border: none;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.15s ease, transform 0.1s ease;
    margin-top: -2px;

    &:active {
      transform: scale(0.9);
      background-color: #fff0f0;
    }

    &--active svg path {
      filter: drop-shadow(0 0 3px rgba(255, 90, 90, 0.4));
    }
  }
}
</style>

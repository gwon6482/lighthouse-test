<template>
  <header class="job-detail-header">
    <button class="job-detail-header__back" @click="safeBack(router, '/career-encyclopedia')">‹</button>

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
import { safeBack } from '@/shared/utils/navigation'
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

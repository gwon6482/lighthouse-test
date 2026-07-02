<template>
  <div class="rjc" :class="rank ? `rjc--rank-${Math.min(rank, 4)}` : ''" @click="emit('click')">
    <!-- 순위 배지 -->
    <div v-if="rank" class="rjc__rank">
      <span class="rjc__rank-num">{{ rank }}</span>
    </div>

    <!-- 직업 정보 -->
    <div class="rjc__body">
      <p class="rjc__title">{{ job.title }}</p>
      <div class="rjc__tags">
        <span class="rjc__tag rjc__tag--primary">{{ job.classification.primary }}</span>
        <span class="rjc__sep">›</span>
        <span class="rjc__tag rjc__tag--secondary">{{ job.classification.secondary }}</span>
      </div>
    </div>

    <!-- 화살표 -->
    <div class="rjc__arrow">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JobSummary } from '../../../types/encyclopedia'

defineProps<{
  job: JobSummary
  rank?: number
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

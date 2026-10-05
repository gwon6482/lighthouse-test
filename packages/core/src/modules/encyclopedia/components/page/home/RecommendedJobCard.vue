<template>
  <div class="rjc" :class="rank ? `rjc--rank-${Math.min(rank, 4)}` : ''" @click="emit('click')">
    <!-- 순위 배지 -->
    <div v-if="rank" class="rjc__rank">
      <span class="rjc__rank-num">{{ rank }}</span>
    </div>

    <!-- 직업 정보 -->
    <div class="rjc__body">
      <p class="rjc__title">
        {{ job.title }}
        <!-- 묶음 직업: 고용24가 여러 직업을 한 직업으로 묶어 조사해 점수가 같은 경우
             추천 목록이 한 자리로 접힌다. 몇 개가 묶였는지 알려준다. -->
        <span v-if="(job.members?.length ?? 1) > 1" class="rjc__group">유사 {{ job.members!.length }}개</span>
      </p>
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
import type { JobRecommendItem } from '../../../types/encyclopedia'

defineProps<{
  job: JobRecommendItem
  rank?: number
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

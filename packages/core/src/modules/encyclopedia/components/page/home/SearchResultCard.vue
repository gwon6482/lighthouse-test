<template>
  <!-- <div class="search-result-card" @click="emit('click')">
    <div class="search-result-card__classifications">
      <span class="search-result-card__primary">{{ job.classification.primary }}</span>
      <span class="search-result-card__dot">·</span>
      <span class="search-result-card__secondary">{{ job.classification.secondary }}</span>
    </div>
    <p class="search-result-card__title">{{ job.title }}</p>
    <span class="search-result-card__arrow"><AppIcon name="ui-chevron-right" /></span>
  </div> -->
  <RouterLink class="search-result-card" :to="`/career-encyclopedia/job/${job.jobCode}`">
    <div class="search-result-card__meta">
      <span class="search-result-card__badge">{{ job.classification.primary }}</span>
      <span class="search-result-card__sep">›</span>
      <span class="search-result-card__secondary">{{ job.classification.secondary }}</span>
    </div>
    <div class="search-result-card__bottom">
      <p class="search-result-card__title">{{ job.title }} <JobGateBadges :job-code="job.jobCode" /></p>
      <span class="search-result-card__arrow">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3l5 5-5 5" stroke="#bbb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
import type { JobSummary } from '../../../types/encyclopedia'
import JobGateBadges from '@/shared/components/JobGateBadges.vue'

defineProps<{
  job: JobSummary
}>()

// const emit = defineEmits<{
//   click: []
// }>()
</script>

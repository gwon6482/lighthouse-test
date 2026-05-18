<template>
  <!-- <div class="search-result-card" @click="emit('click')">
    <div class="search-result-card__classifications">
      <span class="search-result-card__primary">{{ job.classification.primary }}</span>
      <span class="search-result-card__dot">·</span>
      <span class="search-result-card__secondary">{{ job.classification.secondary }}</span>
    </div>
    <p class="search-result-card__title">{{ job.title }}</p>
    <span class="search-result-card__arrow">›</span>
  </div> -->
  <RouterLink class="search-result-card" :to="`/career-encyclopedia/job/${job.jobCode}`">
    <div class="search-result-card__meta">
      <span class="search-result-card__badge">{{ job.classification.primary }}</span>
      <span class="search-result-card__sep">›</span>
      <span class="search-result-card__secondary">{{ job.classification.secondary }}</span>
    </div>
    <div class="search-result-card__bottom">
      <p class="search-result-card__title">{{ job.title }}</p>
      <span class="search-result-card__arrow">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 3l5 5-5 5" stroke="#bbb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import type { JobSummary } from '../../../types/encyclopedia'

defineProps<{
  job: JobSummary
}>()

// const emit = defineEmits<{
//   click: []
// }>()
</script>



<style scoped lang="scss">
.search-result-card {
  display: flex;
  flex-direction: column;
  gap: 7px;
  width: 100%;
  padding: 14px 16px;
  border-radius: 0.875rem;
  background: #fff;
  border: 1px solid #EEEEE8;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;

  &:active { background: #FAFAF8; }

  @media (hover: hover) {
    &:hover {
      background: #FAFAF8;
      border-color: #E0E0D8;
    }
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-wrap: wrap;
  }

  &__badge {
    font-size: 11px;
    font-weight: 700;
    color: #2E8FCC;
    background: #E8F4FE;
    border-radius: 100px;
    padding: 2px 8px;
    line-height: 1.6;
  }

  &__sep {
    font-size: 11px;
    color: #ddd;
  }

  &__secondary {
    font-size: 11px;
    color: #aaa;
    font-weight: 500;
  }

  &__bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__title {
    font-size: 15px;
    font-weight: 700;
    color: #1a1a1a;
    letter-spacing: -0.2px;
    line-height: 1.35;
  }

  &__arrow {
    flex-shrink: 0;
    display: flex;
    align-items: center;
  }
}
</style>

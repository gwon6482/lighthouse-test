<template>
  <section v-if="searchQuery" class="search-result">
    <div class="search-result__header">
      <span class="search-result__label">검색 결과</span>
      <span v-if="!isLoading && searchResults.length > 0" class="search-result__count">{{ searchResults.length }}건</span>
    </div>

    <div v-if="isLoading" class="search-result__state">
      <span class="search-result__state-icon">🔍</span>
      <span>검색 중...</span>
    </div>
    <div v-else-if="searchResults.length === 0" class="search-result__state">
      <span class="search-result__state-icon">😶</span>
      <span><strong>{{ searchQuery }}</strong>에 대한 결과가 없어요</span>
    </div>
    <div v-else class="search-result__list">
      <SearchResultCard
        v-for="job in searchResults"
        :key="job.jobCode"
        :job="job"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { JobSummary } from '@/modules/encyclopedia/types/encyclopedia';
import SearchResultCard from './SearchResultCard.vue'

defineProps<{
  searchQuery: string,
  isLoading: boolean,
  searchResults: JobSummary[]
}>()

// function goToJobDetail(jobCode: string) {
//   console.log('jobCode', jobCode)
// }
</script>

<style scoped lang="scss">
.search-result {
  padding: 12px 20px 20px;

  &__header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  &__label {
    font-size: 13px;
    font-weight: 700;
    color: #1a1a1a;
    letter-spacing: -0.2px;
  }

  &__count {
    font-size: 12px;
    font-weight: 700;
    color: #2E8FCC;
    background: #E8F4FE;
    border-radius: 100px;
    padding: 1px 8px;
  }

  &__state {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 20px 16px;
    background: #FAFAF8;
    border: 1px solid #EEEEE8;
    border-radius: 0.875rem;
    font-size: 13px;
    color: #888;

    strong { color: #1a1a1a; font-weight: 700; }
  }

  &__state-icon {
    font-size: 16px;
    flex-shrink: 0;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}
</style>

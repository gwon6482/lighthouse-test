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

<template>
  <div class="enc-home">
    <!-- 헤더 -->
    <MainTitle />

    <!-- 타이틀 -->
    <div class="enc-home__hero">
      <h1 class="enc-home__title">진로백과</h1>
      <p class="enc-home__subtitle">관심 있는 직업을 탐색해보세요</p>
    </div>

    <!-- 소개 텍스트 -->
    <JourneyIntro
      class="enc-home__intro"
      :step="1"
      headlineMain="꿈꾸는 직업을,"
      headlineEm="지금 찾아보세요."
      bodyLine1="세상에는 수많은 직업이 있어요."
      bodyLine2="관심 가는 직업을 탐색하고, 나에게 맞는 길을 발견해보세요."
    />

    <!-- 검색 바 -->
    <div class="enc-home__search-wrap">
      <SearchBar :query="searchQuery" @search="searchJob" @clear="clearSearch" />
    </div>

    <!-- 검색 결과 -->
    <SearchResult
      v-if="searchQuery"
      :searchQuery="searchQuery"
      :isLoading="isLoading"
      :searchResults="searchResults"
    />

    <!-- 메인 메뉴 (검색어 없을 때) -->
    <template v-else>
      <!-- 진로 카드 목록 -->
      <div class="enc-home__section">
        <h2 class="enc-home__section-title">진로 둘러보기</h2>
        <div class="enc-home__card-list">
          <RecommendedJobCard
            v-for="job in featuredJobs"
            :key="job.jobCode"
            :job="job"
            @click="goToJobDetail(job.jobCode)"
          />
        </div>
      </div>

      <!-- 나의 추천 진로 -->
      <div class="enc-home__section">
        <button class="enc-home__menu-btn" @click="goToRecommended">
          <span class="enc-home__menu-icon">⭐</span>
          <div class="enc-home__menu-text">
            <span class="enc-home__menu-title">나의 추천 진로</span>
            <span class="enc-home__menu-desc">자기이해 결과를 바탕으로 추천된 직업을 확인해보세요</span>
          </div>
          <span class="enc-home__menu-arrow">›</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useEncyclopedia } from '../composables/useEncyclopedia'
import type { JobSummary } from '../types/encyclopedia'
import MainTitle from '../components/page/home/MainTitle.vue'
import JourneyIntro from '@/shared/components/JourneyIntro.vue'
import SearchBar from '../components/page/home/SearchBar.vue'
import RecommendedJobCard from '../components/page/home/RecommendedJobCard.vue'
import SearchResult from '../components/page/home/SearchResult.vue'

const router = useRouter()
const { searchQuery, searchResults, isLoading, searchJob, clearSearch } = useEncyclopedia()

const featuredJobs: JobSummary[] = [
  {
    jobCode: '013601',
    classification: { primary: '경영·사무·금융·보험직', secondary: '전문서비스 관리자' },
    title: '예술·디자인·방송관리자',
  },
  {
    jobCode: '521101',
    classification: { primary: '미용·여행·숙박·음식·경비·청소직', secondary: '여행 서비스원' },
    title: '여행상품개발자',
  },
  {
    jobCode: '415502',
    classification: { primary: '예술·디자인·방송·스포츠직', secondary: '디자이너' },
    title: '게임그래픽디자이너',
  },
]

function goToJobDetail(jobCode: string) {
  router.push(`/career-encyclopedia/job/${jobCode}`)
}

function goToRecommended() {
  router.push('/career-encyclopedia/recommended')
}
</script>

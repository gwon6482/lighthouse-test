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
            v-for="(job, i) in featuredJobs"
            :key="job.jobCode"
            :job="job"
            :rank="i + 1"
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

<style lang="scss">
.enc-home {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;

  &__hero {
    padding: 32px 20px 16px;
    text-align: center;
  }

  &__title {
    font-size: 28px;
    font-weight: 800;
    color: #222;
    margin-bottom: 8px;
  }

  &__subtitle {
    font-size: 14px;
    color: #888;
  }

  &__intro {
    margin: 0 20px 20px;
  }

  &__search-wrap {
    padding: 0 0 8px;
  }

  &__section {
    padding: 12px 20px;
  }

  &__section-title {
    font-size: 16px;
    font-weight: 700;
    color: #222;
    margin-bottom: 12px;
  }

  &__card-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__menu-btn {
    display: flex;
    align-items: center;
    gap: 16px;
    width: 100%;
    padding: 20px;
    border: none;
    border-radius: 16px;
    background: #fff;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s;

    &:active { background: #f0f0f0; }

    @media (hover: hover) {
      &:hover { background: #f0f0f0; }
    }
  }

  &__menu-icon {
    font-size: 28px;
    flex-shrink: 0;
  }

  &__menu-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
  }

  &__menu-title {
    font-size: 16px;
    font-weight: 600;
    color: #222;
  }

  &__menu-desc {
    font-size: 13px;
    color: #888;
    line-height: 1.4;
  }

  &__menu-arrow {
    font-size: 22px;
    color: #bbb;
    flex-shrink: 0;
  }
}
</style>

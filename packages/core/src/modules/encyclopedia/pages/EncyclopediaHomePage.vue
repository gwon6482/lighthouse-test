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
      :step="guest ? 0 : 1"
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
      :isLoading="isSearching"
      :searchResults="searchResults"
      :groups="searchGroups"
      :scope="searchScope"
      :scopeResults="scopeResults"
      :failed="searchFailed"
      @open-group="openSearchGroup"
      @close-group="closeSearchGroup"
    />

    <!-- 메인 메뉴 (검색어 없을 때) -->
    <template v-else>
      <!-- 진로 둘러보기 — 서로 다른 직무에서 직업 5개를 무작위로(2026-11-14 사용자 결정, 바뀔 수 있음).
           API 를 못 받으면 고정 목록(FALLBACK_JOBS)으로 대신한다 -->
      <div class="enc-home__section">
        <div class="enc-home__section-head">
          <h2 class="enc-home__section-title">진로 둘러보기</h2>
          <button v-if="exploreJobs.length" type="button" class="enc-home__shuffle" :disabled="isExploring" @click="loadExploreJobs(true)">
            <AppIcon name="ui-repeat" /> 다른 직업 보기
          </button>
        </div>
        <p v-if="exploreJobs.length" class="enc-home__section-desc">서로 다른 직무에서 하나씩 골랐어요</p>
        <div class="enc-home__card-list" :class="{ 'enc-home__card-list--busy': isExploring }">
          <RecommendedJobCard
            v-for="job in browseJobs"
            :key="job.jobCode"
            :job="job"
            :group-name="'group' in job ? job.group.name : undefined"
            :description="'group' in job ? job.overview : undefined"
            @click="goToJobDetail(job.jobCode)"
          />
          <!-- 처음 받는 동안 카드 자리를 미리 잡는다 — 받은 뒤에 아래 '분류로 찾기'가 밀려 내려가지 않게(2026-11-18 사용성 확인) -->
          <template v-if="!browseJobs.length && isExploring">
            <div v-for="i in 5" :key="`skel-${i}`" class="enc-home__skel" aria-hidden="true" />
          </template>
        </div>
      </div>

      <!-- 분류로 찾기(2026-11-17) — 둘러보기 아래, 나의 추천 진로 위. 기능 스위치가 켜진 빌드에만(스테이징 먼저) -->
      <div v-if="features.jobBrowse" class="enc-home__section">
        <BrowseEntry />
      </div>

      <!-- 나의 추천 진로 -->
      <div class="enc-home__section">
        <button class="enc-home__menu-btn" @click="goToRecommended">
          <span class="enc-home__menu-icon"><AppIcon name="ui-recommend" /></span>
          <div class="enc-home__menu-text">
            <span class="enc-home__menu-title">{{ guest ? '나에게 맞는 직업 찾기' : '나의 추천 진로' }}</span>
            <span class="enc-home__menu-desc">{{ guest ? '자기이해 검사를 하면 나에게 맞는 직업을 추천해 드려요' : '자기이해 결과를 바탕으로 추천된 직업을 확인해보세요' }}</span>
          </div>
          <span class="enc-home__menu-arrow"><AppIcon name="ui-chevron-right" /></span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import { features } from '@/shared/config/features'
import { useEncyclopedia } from '../composables/useEncyclopedia'
import type { JobSummary, JobExploreItem } from '../types/encyclopedia'
import MainTitle from '../components/page/home/MainTitle.vue'
import JourneyIntro from '@/shared/components/JourneyIntro.vue'
import SearchBar from '../components/page/home/SearchBar.vue'
import RecommendedJobCard from '../components/page/home/RecommendedJobCard.vue'
import SearchResult from '../components/page/home/SearchResult.vue'
import BrowseEntry from '../components/page/browse/BrowseEntry.vue'

const router = useRouter()
const authStore = useAuthStore()
// 비회원(2026-11-09, features.guestEntry 빌드만): 아직 검사 전이라 단계는 '자기이해' 에, 추천 메뉴는 검사 시작(A 경로)으로
const guest = features.guestEntry && !authStore.isLoggedIn
const {
  searchQuery, searchResults, searchGroups, searchScope, scopeResults, searchFailed, isSearching,
  searchJob, openSearchGroup, closeSearchGroup, clearSearch,
  exploreJobs, isExploring, loadExploreJobs,
} = useEncyclopedia()

// 둘러보기를 못 받았을 때 보여 줄 고정 목록(예전 화면의 3개)
const FALLBACK_JOBS: JobSummary[] = [
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

const browseJobs = computed<(JobExploreItem | JobSummary)[]>(() => (exploreJobs.value.length ? exploreJobs.value : isExploring.value ? [] : FALLBACK_JOBS))
onMounted(() => loadExploreJobs())

function goToJobDetail(jobCode: string) {
  router.push(`/career-encyclopedia/job/${jobCode}`)
}

function goToRecommended() {
  router.push(guest ? '/start' : '/career-encyclopedia/recommended')
}
</script>

<template>
  <div class="cd-main">
    <!-- 헤더 -->
    <header class="cd-main__header">
      <button class="cd-main__back" @click="router.back()">‹</button>
      <img class="cd-main__logo" src="/career-design/logo-lighthouse.svg" alt="LightHouse" />
      <button class="cd-main__menu">≡</button>
    </header>

    <!-- 타이틀 -->
    <div class="cd-main__hero">
      <h1 class="cd-main__title">진로계획 세우기</h1>
      <p class="cd-main__subtitle">목표를 향한 체계적인 준비</p>
    </div>

    <!-- 나의 좋아요 직업 -->
    <div class="cd-main__card-wrap">
      <h2 class="cd-main__section-title">나의 좋아요 직업</h2>
      <div class="cd-main__job-list">
        <RecommendedJobCard
          v-for="job in likedJobs"
          :key="job.jobCode"
          :job="job"
        />
      </div>
    </div>

    <!-- 하단 버튼 -->
    <div class="cd-main__footer">
      <button class="cd-main__cta" @click="router.push('/career-design/plan/new')">진로계획 시작하기</button>
      <button class="cd-main__cta-secondary" @click="goToExplore">진로계획 탐색하기</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import RecommendedJobCard from '../../encyclopedia/components/page/home/RecommendedJobCard.vue'
import type { JobSummary } from '../../encyclopedia/types/encyclopedia'

const router = useRouter()

const likedJobs: JobSummary[] = [
  {
    jobCode: '013601',
    title: '마케팅 기획자',
    classification: { primary: '경영·사무·금융·보험직', secondary: '광고·홍보·조사 전문가' },
  },
  {
    jobCode: '013602',
    title: '콘텐츠 마케터',
    classification: { primary: '문화·예술·디자인·방송직', secondary: '작가·출판 전문가' },
  },
  {
    jobCode: '013603',
    title: '브랜드 매니저',
    classification: { primary: '경영·사무·금융·보험직', secondary: '마케팅 전문가' },
  },
]

function goToExplore() {
  router.push('/career-design/explore')
}
</script>

<style lang="scss">
.cd-main {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: #fff;
  }

  &__back,
  &__menu {
    background: none;
    border: none;
    font-size: 24px;
    color: #333;
    cursor: pointer;
    padding: 4px;
    width: 36px;
    text-align: center;
  }

  &__logo {
    height: 28px;
    width: auto;
  }

  &__hero {
    padding: 40px 20px 24px;
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

  &__card-wrap {
    flex: 1;
    padding: 20px;
  }

  &__section-title {
    font-size: 16px;
    font-weight: 700;
    color: #222;
    margin-bottom: 12px;
  }

  &__job-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__footer {
    padding: 16px 20px 32px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__cta {
    width: 100%;
    padding: 18px;
    background: #FFC700;
    border: none;
    border-radius: 16px;
    font-size: 17px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;

    &:active { opacity: 0.85; }
  }

  &__cta-secondary {
    width: 100%;
    padding: 18px;
    background: #fff;
    border: 2px solid #FFC700;
    border-radius: 16px;
    font-size: 17px;
    font-weight: 700;
    color: #CC9D00;
    cursor: pointer;

    &:active { opacity: 0.85; }
  }
}
</style>

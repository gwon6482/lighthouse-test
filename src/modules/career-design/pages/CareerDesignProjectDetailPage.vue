<template>
  <div v-if="project" class="cd-proj-detail">
    <!-- 노란 헤더 -->
    <div class="cd-proj-detail__top">
      <button class="cd-proj-detail__back" @click="router.back()">‹</button>
      <div class="cd-proj-detail__top-info">
        <CdCategoryIcon :category="project.category" />
        <div>
          <p class="cd-proj-detail__category-label">{{ categoryLabel }}</p>
          <h1 class="cd-proj-detail__name">{{ project.name }}</h1>
        </div>
      </div>
      <p class="cd-proj-detail__meta">
        {{ project.source }} · {{ project.field }} · {{ project.weeks }}주 · {{ project.level }}
      </p>
    </div>

    <!-- 본문 -->
    <div class="cd-proj-detail__body">
      <!-- 계획 소개 -->
      <div class="cd-proj-detail__card">
        <h2 class="cd-proj-detail__card-title">계획 소개</h2>
        <p class="cd-proj-detail__desc">{{ project.description }}</p>
        <div class="cd-proj-detail__tags">
          <span v-for="tag in project.tags" :key="tag" class="cd-proj-detail__tag">{{ tag }}</span>
        </div>
        <div class="cd-proj-detail__stats">
          <span>♡ {{ project.likes }}</span>
          <span>👁 {{ project.views }}</span>
          <span class="cd-proj-detail__lecture-count">{{ project.curriculum?.length ?? 0 * (project.weeks ?? 0) }}개 강의</span>
        </div>
      </div>

      <!-- 주차별 커리큘럼 -->
      <div v-if="project.curriculum?.length" class="cd-proj-detail__card">
        <div class="cd-proj-detail__curr-header">
          <h2 class="cd-proj-detail__card-title">주차별 커리큘럼</h2>
          <span class="cd-proj-detail__curr-range">2024년 1월 ~ 2024년 {{ project.weeks }}월</span>
        </div>
        <div class="cd-proj-detail__weeks">
          <div v-for="week in project.curriculum" :key="week.week" class="cd-proj-detail__week">
            <p class="cd-proj-detail__week-num">{{ week.week }}주차</p>
            <p class="cd-proj-detail__week-title">{{ week.title }}</p>
            <ul class="cd-proj-detail__week-items">
              <li v-for="item in week.items" :key="item">✓ {{ item }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 하단 버튼 -->
    <div class="cd-proj-detail__footer">
      <button class="cd-proj-detail__btn-secondary">강의 홈페이지</button>
      <button class="cd-proj-detail__btn-primary" @click="router.back()">내 계획에 붙여넣기</button>
    </div>
  </div>

  <div v-else class="cd-proj-detail cd-proj-detail--empty">
    <button @click="router.back()">‹ 돌아가기</button>
    <p>프로젝트를 찾을 수 없어요</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCareerDesign } from '../composables/useCareerDesign'
import CdCategoryIcon from '../components/CdCategoryIcon.vue'
import type { ProjectCategory } from '../types/career-design'

const router = useRouter()
const route = useRoute()
const { getProjectById } = useCareerDesign()

const project = computed(() => getProjectById(route.params.id as string))

const categoryLabelMap: Record<ProjectCategory, string> = {
  qualification: '자격요건',
  knowledge: '분야지식',
  skill: '직무기술',
  portfolio: '포트폴리오',
}

const categoryLabel = computed(() =>
  project.value ? categoryLabelMap[project.value.category] : ''
)
</script>

<style lang="scss">
.cd-proj-detail {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;

  &__top {
    background: #FFC700;
    padding: 20px 20px 28px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__back {
    background: none;
    border: none;
    font-size: 28px;
    color: #222;
    cursor: pointer;
    padding: 0;
    align-self: flex-start;
  }

  &__top-info {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  &__category-label {
    font-size: 13px;
    color: #555;
    margin-bottom: 2px;
  }

  &__name {
    font-size: 22px;
    font-weight: 800;
    color: #222;
  }

  &__meta {
    font-size: 13px;
    color: #555;
  }

  &__body {
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__card {
    background: #fff;
    border-radius: 16px;
    padding: 20px;
  }

  &__card-title {
    font-size: 16px;
    font-weight: 700;
    color: #222;
    margin-bottom: 12px;
  }

  &__desc {
    font-size: 13px;
    color: #555;
    line-height: 1.6;
    margin-bottom: 12px;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 14px;
  }

  &__tag {
    background: #E8F0FE;
    color: #4A6FA5;
    font-size: 12px;
    padding: 4px 10px;
    border-radius: 20px;
  }

  &__stats {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: #aaa;
  }

  &__lecture-count {
    margin-left: auto;
    color: #FFC700;
    font-weight: 600;
  }

  &__curr-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  &__curr-range {
    font-size: 12px;
    color: #aaa;
  }

  &__weeks {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__week-num {
    font-size: 13px;
    font-weight: 700;
    color: #FFC700;
    margin-bottom: 4px;
  }

  &__week-title {
    font-size: 15px;
    font-weight: 600;
    color: #222;
    margin-bottom: 8px;
  }

  &__week-items {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;

    li {
      font-size: 13px;
      color: #555;

      &::before { color: #4CAF72; }
    }
  }

  &__footer {
    padding: 16px 20px 32px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__btn-secondary {
    width: 100%;
    padding: 16px;
    background: #FFF3CC;
    border: none;
    border-radius: 16px;
    font-size: 16px;
    font-weight: 600;
    color: #888;
    cursor: pointer;
  }

  &__btn-primary {
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

  &--empty {
    align-items: center;
    justify-content: center;
    gap: 16px;
    font-size: 16px;
    color: #aaa;
  }
}
</style>

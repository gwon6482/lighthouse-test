<template>
  <div class="cd-explore">
    <!-- 노란 헤더 영역 -->
    <div class="cd-explore__top">
      <CdYellowHeader
        title="진로계획 탐색"
        subtitle="다른 사람들의 진로 준비과정을 참고하세요"
      />
      <div class="cd-explore__search-wrap">
        <div class="cd-explore__search">
          <span>🔍</span>
          <input
            v-model="searchQuery"
            class="cd-explore__search-input"
            placeholder="마케팅 기획"
          />
        </div>
      </div>
    </div>

    <!-- 리스트 뷰 -->
    <div v-if="!selectedPlan" class="cd-explore__body">
      <h2 class="cd-explore__section-title">인기 진로계획</h2>
      <div class="cd-explore__list">
        <CdPlanCard
          v-for="plan in filteredPlans"
          :key="plan.id"
          :plan="plan"
          @click="selectPlan(plan)"
        />
      </div>
    </div>

    <!-- 상세 뷰 (계획 선택 후) -->
    <div v-else class="cd-explore__body">
      <button class="cd-explore__deselect" @click="selectedPlan = null">← 목록으로</button>

      <!-- 선택된 계획 카드 -->
      <CdPlanCard :plan="selectedPlan" />

      <!-- 타임라인 -->
      <CdTimeline
        :months="selectedPlan.timeline"
        :range="timelineRange(selectedPlan)"
        @item-click="goToProjectDetail"
      />

      <!-- 하단 버튼 -->
      <div class="cd-explore__footer">
        <button class="cd-explore__copy-btn" @click="copyPlanAndStart">내 계획에 붙여넣기</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { CareerPlan } from '../types/career-design'
import { useCareerDesign } from '../composables/useCareerDesign'
import CdYellowHeader from '../components/CdYellowHeader.vue'
import CdPlanCard from '../components/CdPlanCard.vue'
import CdTimeline from '../components/CdTimeline.vue'

const router = useRouter()
const route = useRoute()
const { plans, draftPlan } = useCareerDesign()

const searchQuery = ref((route.query.q as string) ?? '')
const selectedPlan = ref<CareerPlan | null>(null)

const filteredPlans = computed(() =>
  searchQuery.value
    ? plans.value.filter(p =>
        p.name.includes(searchQuery.value) ||
        p.targetJob.includes(searchQuery.value) ||
        p.tags.some(t => t.includes(searchQuery.value))
      )
    : plans.value
)

function selectPlan(plan: CareerPlan) {
  selectedPlan.value = plan
}

function timelineRange(plan: CareerPlan) {
  const labels = plan.timeline.map(m => m.label)
  if (labels.length === 0) return ''
  return `${labels[0]} ~ ${labels[labels.length - 1]}`
}

function goToProjectDetail(projectId: string) {
  router.push(`/career-design/project/${projectId}`)
}

function copyPlanAndStart() {
  if (!selectedPlan.value) return
  draftPlan.name = selectedPlan.value.name
  draftPlan.targetJob = selectedPlan.value.targetJob
  draftPlan.projects = [...selectedPlan.value.projects]
  draftPlan.timeline = [...selectedPlan.value.timeline]
  router.push('/career-design/plan/new')
}
</script>

<style lang="scss">
.cd-explore {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;

  &__top {
    background: #FFC700;
    padding-bottom: 20px;
  }

  &__search-wrap {
    padding: 0 20px;
  }

  &__search {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fff;
    border-radius: 14px;
    padding: 12px 16px;
    font-size: 16px;
  }

  &__search-input {
    border: none;
    outline: none;
    font-size: 15px;
    flex: 1;
    background: transparent;

    &::placeholder { color: #bbb; }
  }

  &__body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__section-title {
    font-size: 16px;
    font-weight: 700;
    color: #222;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__deselect {
    background: none;
    border: none;
    font-size: 14px;
    color: #888;
    cursor: pointer;
    padding: 0;
    text-align: left;
  }

  &__footer {
    padding-bottom: 16px;
  }

  &__copy-btn {
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
}
</style>

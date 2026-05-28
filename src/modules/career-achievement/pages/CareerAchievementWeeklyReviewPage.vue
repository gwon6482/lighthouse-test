<template>
  <div class="wr">
    <header class="wr__header">
      <button class="wr__back" @click="router.back()">‹</button>
      <span class="wr__header-title">주간 리뷰</span>
      <span class="wr__header-spacer" />
    </header>

    <div class="wr__body">
      <div class="wr__placeholder">
        <span class="wr__placeholder-icon">📝</span>
        <h2 class="wr__placeholder-title">주간 리뷰 페이지</h2>
        <p class="wr__placeholder-text">
          한 주를 돌아보고 다음 주 일정을 재배치하는 화면이 곧 들어올 자리에요.
        </p>
        <p class="wr__placeholder-meta">
          진로계획 마지막 단계에서 설정한 <strong>{{ reviewDayLabel }}</strong>에 진행해요.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCareerDesign } from '@/modules/career-design/composables/useCareerDesign'

const router = useRouter()
const { draftPlan, fetchMyPlans, loadPlanFromApi } = useCareerDesign()

const reviewDayLabel = computed(() =>
  draftPlan.reviewDay ? `${draftPlan.reviewDay}요일` : '주간 리뷰 요일(미설정)'
)

onMounted(async () => {
  if (!draftPlan.planId) {
    const plans = await fetchMyPlans()
    const target = plans.find((p: any) => p.status === 'active') ?? plans[0]
    if (target?.planId) await loadPlanFromApi(target.planId)
  }
})
</script>

<style lang="scss">
.wr {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;

  &__header {
    position: sticky;
    top: 0;
    z-index: 10;
    display: grid;
    grid-template-columns: 44px 1fr 44px;
    align-items: center;
    height: 52px;
    padding: 0 8px;
    background: #fff;
    border-bottom: 1px solid #EEEEE8;
  }

  &__back {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    font-size: 20px;
    color: #444;
    cursor: pointer;
  }

  &__header-title {
    text-align: center;
    font-size: 14px;
    font-weight: 700;
    color: #222;
  }

  &__header-spacer { width: 44px; }

  &__body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
  }

  &__placeholder {
    background: #fff;
    border-radius: 18px;
    padding: 36px 24px 32px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: 320px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }

  &__placeholder-icon { font-size: 42px; }

  &__placeholder-title {
    font-size: 18px;
    font-weight: 800;
    color: #222;
    margin: 0;
  }

  &__placeholder-text {
    font-size: 13px;
    color: #666;
    line-height: 1.6;
    margin: 0;
  }

  &__placeholder-meta {
    font-size: 12px;
    color: #888;
    margin: 4px 0 0;

    strong {
      color: #B07800;
      font-weight: 800;
      background: #FFFBEC;
      padding: 2px 8px;
      border-radius: 8px;
    }
  }
}
</style>

<template>
  <div class="cd-complete">
    <CdYellowHeader title="나의 진로계획" :subtitle="draftPlan.targetJob || '내 진로계획'" />

    <div class="cd-complete__body">
      <!-- 계획 요약 카드 -->
      <div class="cd-complete__summary-card">
        <h2 class="cd-complete__plan-name">{{ draftPlan.name || '나의 진로계획' }}</h2>
        <div class="cd-complete__duties">
          <span v-for="duty in draftPlan.duties" :key="duty" class="cd-complete__duty-chip">
            {{ duty }}
          </span>
        </div>
        <div v-if="draftPlan.startDate" class="cd-complete__period">
          📅 {{ formatDate(draftPlan.startDate) }}
          <span v-if="draftPlan.endDate"> ~ {{ formatDate(draftPlan.endDate) }}</span>
        </div>
      </div>

      <!-- 타임라인 -->
      <CdTimeline
        v-if="draftPlan.timeline.length > 0"
        :months="draftPlan.timeline"
        :range="timelineRange"
      />
    </div>

    <!-- 하단 버튼 -->
    <div class="cd-complete__footer">
      <button class="cd-complete__btn-secondary" @click="router.push('/career-design/plan/new')">
        계획 수정하기
      </button>
      <button class="cd-complete__btn-primary" @click="router.push('/')">
        홈으로 이동
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCareerDesign } from '../composables/useCareerDesign'
import CdYellowHeader from '../components/CdYellowHeader.vue'
import CdTimeline from '../components/CdTimeline.vue'

const router = useRouter()
const { draftPlan } = useCareerDesign()

const timelineRange = computed(() => {
  const labels = draftPlan.timeline.map(m => m.label)
  if (labels.length === 0) return ''
  return `${labels[0]} ~ ${labels[labels.length - 1]}`
})

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${y}.${m}.${d}`
}
</script>

<style lang="scss">
.cd-complete {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;

  &__body {
    flex: 1;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__summary-card {
    background: #fff;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__plan-name {
    font-size: 18px;
    font-weight: 700;
    color: #222;
  }

  &__duties {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__duty-chip {
    background: #F0F0F0;
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 13px;
    color: #555;
  }

  &__period {
    font-size: 13px;
    color: #aaa;
  }

  &__section {
    background: #fff;
    border-radius: 16px;
    padding: 20px;
  }

  &__section-title {
    font-size: 15px;
    font-weight: 700;
    color: #222;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__count {
    font-size: 13px;
    font-weight: 500;
    color: #FFC700;
  }

  &__empty {
    font-size: 14px;
    color: #bbb;
    text-align: center;
    padding: 24px 0;
  }

  &__projects {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__project-item {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__project-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__project-name {
    font-size: 15px;
    font-weight: 600;
    color: #222;
  }

  &__project-meta {
    font-size: 12px;
    color: #aaa;
  }

  &__priority-badge {
    font-size: 18px;
    flex-shrink: 0;
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
    background: #fff;
    border: 2px solid #FFC700;
    border-radius: 16px;
    font-size: 16px;
    font-weight: 600;
    color: #CC9D00;
    cursor: pointer;

    &:active { opacity: 0.85; }
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
}
</style>

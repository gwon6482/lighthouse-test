<template>
  <div class="cd-rday">
    <CdYellowHeader
      title="주간 리뷰 요일"
      subtitle="매주 한 주를 돌아보고 다음 주를 계획할 요일을 정해주세요"
      back-to="/career-design/plan/routines"
    />

    <div class="cd-rday__body">
      <section class="cd-rday__section">
        <p class="cd-rday__intro">
          반년~1년 단위의 계획은 한 번에 잘 짜기 어렵고, 짠대로 흘러가지도 않아요.
          <br />
          매주 같은 요일에 짧게 돌아보고, 다음 한 주 일정을 다시 배치해 보세요.
        </p>

        <div class="cd-rday__days">
          <button
            v-for="d in DAYS"
            :key="d"
            class="cd-rday__day"
            :class="{ 'cd-rday__day--active': draftPlan.reviewDay === d }"
            @click="select(d)"
            type="button"
          >
            {{ d }}
          </button>
        </div>

        <div v-if="draftPlan.reviewDay" class="cd-rday__hint">
          매주 <strong>{{ draftPlan.reviewDay }}요일</strong>이 한 주의 끝이자 시작이에요.
        </div>
      </section>
    </div>

    <div class="cd-rday__footer">
      <button class="cd-rday__btn-secondary" @click="goPrev" type="button">이전으로</button>
      <button
        class="cd-rday__btn-primary"
        :disabled="!draftPlan.reviewDay || saving"
        @click="goNext"
        type="button"
      >
        {{ saving ? '저장 중...' : '다음으로' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import CdYellowHeader from '../components/CdYellowHeader.vue'
import { useCareerDesign } from '../composables/useCareerDesign'
import type { DayOfWeek } from '../types/career-design'

const router = useRouter()
const { draftPlan, syncPlanReviewDay } = useCareerDesign()

const DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일']
const saving = ref(false)

function select(d: DayOfWeek) {
  draftPlan.reviewDay = d
}

function goPrev() {
  router.push('/career-design/plan/routines')
}

async function goNext() {
  if (!draftPlan.reviewDay) return
  saving.value = true
  try {
    await syncPlanReviewDay()
    router.push('/career-design/result')
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss">
.cd-rday {
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

  &__section {
    background: #fff;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  &__intro {
    font-size: 13px;
    color: #666;
    line-height: 1.6;
    margin: 0;
  }

  &__days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
  }

  &__day {
    aspect-ratio: 1;
    border: 1.5px solid #eee;
    background: #fafafa;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 700;
    color: #444;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s, color 0.12s, transform 0.08s;

    &:active { transform: scale(0.96); }

    &:hover {
      border-color: #FFD84D;
    }

    &--active {
      background: #FFC700;
      border-color: #FFC700;
      color: #fff;
      box-shadow: 0 4px 10px rgba(255, 199, 0, 0.32);
    }
  }

  &__hint {
    font-size: 13px;
    color: #888;
    background: #FFFBEC;
    border: 1px solid #FFE99A;
    border-radius: 10px;
    padding: 10px 12px;
    text-align: center;

    strong {
      color: #B07800;
      font-weight: 800;
    }
  }

  &__footer {
    padding: 16px 20px 32px;
    display: flex;
    gap: 10px;
  }

  &__btn-secondary {
    flex: 1;
    padding: 18px;
    background: #fff;
    border: 1.5px solid #ddd;
    border-radius: 16px;
    font-size: 15px;
    font-weight: 700;
    color: #666;
    cursor: pointer;

    &:active { opacity: 0.85; }
  }

  &__btn-primary {
    flex: 2;
    padding: 18px;
    background: #FFC700;
    border: none;
    border-radius: 16px;
    font-size: 17px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;
    transition: opacity 0.12s;

    &:active { opacity: 0.85; }

    &:disabled {
      background: #e8e8e8;
      color: #aaa;
      cursor: not-allowed;
    }
  }
}
</style>

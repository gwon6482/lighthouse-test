<template>
  <div class="cd-rday">
    <CdYellowHeader
      title="주간 리뷰 요일"
      subtitle="매주 한 주를 돌아보고 다음 주를 계획할 요일을 정해주세요"
      :back-to="prevPath('reviewDay')" :cancel-edit="editing"
    />
    <CdStepIndicator step="reviewDay" />

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
          <template v-if="firstReview"><br>첫 주간리뷰는 <strong>{{ firstReview }}</strong>이에요(시작하고 7일 이상 지난 뒤).</template>
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
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import CdYellowHeader from '../components/CdYellowHeader.vue'
import CdStepIndicator from '../components/CdStepIndicator.vue'
import { useDesignSteps } from '../composables/useDesignSteps'
import { useCareerDesign } from '../composables/useCareerDesign'
import type { DayOfWeek } from '../types/career-design'
import { firstReviewDate } from '../composables/usePlanTimeline'
import { parseDateKey } from '@/modules/career-achievement/composables/useWeeklySchedule'
import { examDateOf, examWeekOf } from '../lib/examDate'
import { buildTimeline, examAgeOptions } from '../composables/usePlanPace'
import { budgetHours, stripLoad, withRoutineLoad } from '../lib/routine'
import { useAuthStore } from '@/shared/stores/auth'
import { useDatedAlign } from '../composables/useDatedAlign'

const router = useRouter()
const { prevPath, nextPath, editing } = useDesignSteps() // 이전·다음은 새 계획/수정에 따라 다르다(useDesignSteps)
const { draftPlan, draftTimeline, syncPlanReviewDay } = useCareerDesign()
const auth = useAuthStore()
const { alignDraft } = useDatedAlign()
// 속도 고르기는 시작 요일을 고르기 전이라(이 단계가 뒤) 그때의 요일(없으면 월요일)로 시험 주를 셌다
const dayAtPlacement = draftPlan.reviewDay || '월'

/**
 * 시험일 역산(2026-11-22) — 시작 요일이 바뀌어 어느 시험의 시험 주가 달라졌으면, 그 요일로 다시 놓는다(손으로 옮긴 배치는 두고).
 * 시험 주가 그대로면 아무것도 하지 않는다
 */
function reanchorExams() {
  const start = draftPlan.startDate
  const day = draftPlan.reviewDay
  // 새 계획에서만(고치는 중이면 이미 시작한 걸음이 있다 — 다시 놓지 않는다)
  if (editing.value || !start || !day || draftPlan.timelineManual || !draftTimeline.value.length || !draftPlan.weeklyHours) return
  const shifted = draftPlan.projects.some((p) => {
    const d = examDateOf(p)
    return !!d && examWeekOf(start, d, dayAtPlacement) !== examWeekOf(start, d, day)
  })
  if (!shifted) return
  const L = withRoutineLoad(draftPlan.projects, draftPlan.routines)
  const opts = examAgeOptions(start, auth.user?.age, day)
  draftTimeline.value = stripLoad(buildTimeline(L.projects, budgetHours(draftPlan.weeklyHours, L.freeMin), opts, { startDate: start, reviewDay: day, late: new Set(draftPlan.examLate ?? []) }), draftPlan.projects)
}

// 첫 리뷰일 — 1주차는 시작일(아직 없으면 오늘)부터 첫 리뷰일 전날까지 7~13일(2026-11-04)
const firstReview = computed(() => {
  if (!draftPlan.reviewDay) return ''
  const sd = parseDateKey(draftPlan.startDate) ?? new Date()
  const d = firstReviewDate(sd, draftPlan.reviewDay)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${draftPlan.reviewDay}요일`
})

const DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일']
const saving = ref(false)

function select(d: DayOfWeek) {
  draftPlan.reviewDay = d
}

function goPrev() {
  router.push(prevPath('reviewDay'))
}

async function goNext() {
  if (!draftPlan.reviewDay) return
  saving.value = true
  try {
    // 날짜로 정한 걸음(2026-11-25) — 주 경계가 바뀌면 걸친 주 수·자리가 바뀐다. 손으로 옮긴 타임라인이어도 날짜 걸음만은 다시 맞춘다
    alignDraft({ rebuild: !editing.value })
    reanchorExams()
    await syncPlanReviewDay() // 계획 ID 가 생기기 전이면 서버로 안 간다 — 목표 설정에서 한꺼번에 올린다
    router.push(nextPath('reviewDay'))
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

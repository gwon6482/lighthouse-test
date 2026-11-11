<template>
  <div :class="['review-tab', { 'g-locked': locked && reviews.length > 1 }]" @click="onLockedClick">

    <!-- 후기 목록 -->
    <section class="review-section">
      <div v-if="locked && reviews.length > 1" class="g-head"><h3 class="review-section__title">후기 ({{ reviews.length }})</h3><span class="g-pill"><AppIcon name="ui-privacy" :size="12" />가입 후</span></div>
      <h3 v-else class="review-section__title">후기 ({{ reviews.length }})</h3>

      <div v-if="isLoading" class="review-empty">불러오는 중...</div>
      <div v-else-if="error" class="review-empty review-empty--error">{{ error }}</div>
      <div v-else-if="reviews.length === 0" class="review-empty">아직 등록된 후기가 없습니다.</div>

      <!-- 비회원: 첫 후기는 만족도·한 줄 요약만 또렷하게, 나머지는 흐리게. 글은 두 줄로 줄여 다음 후기가 비쳐 보이게 -->
      <ul v-else :class="['review-list', { 'g-clip review-list--locked': locked }]">
        <li v-for="(review, ri) in reviews" :key="review._id" :class="['review-card', { 'g-veil': locked && ri > 0 }]">
          <div class="review-card__top">
            <div class="review-card__satisfaction">
              <span class="review-card__satisfaction-label">만족도</span>
              <div class="review-card__bar-bg">
                <div class="review-card__bar-fill" :style="{ width: review.satisfaction + '%' }" />
              </div>
              <span class="review-card__satisfaction-value">{{ review.satisfaction }}점</span>
            </div>
            <span class="review-card__date">
              <span v-if="review.careerYears" class="review-card__career">현직 {{ CAREER_LABELS[review.careerYears] }}</span>
              {{ formatDate(review.createdAt) }}
            </span>
          </div>

          <p class="review-card__summary">{{ review.summary }}</p>

          <div :class="['review-card__detail', { 'g-veil': locked && ri === 0 }]">
            <div class="review-card__detail-item review-card__detail-item--pros">
              <span class="review-card__detail-label">장점</span>
              <p class="review-card__detail-text">{{ review.pros }}</p>
            </div>
            <div class="review-card__detail-item review-card__detail-item--cons">
              <span class="review-card__detail-label">단점</span>
              <p class="review-card__detail-text">{{ review.cons }}</p>
            </div>
          </div>

          <div :class="['review-card__recommendation', { 'g-veil': locked && ri === 0 }]">
            <span class="review-card__recommendation-label">추천</span>
            <p class="review-card__recommendation-text">{{ review.recommendation }}</p>
          </div>

          <!-- 선택 항목 — 연구 설문 후기에서만 온다 -->
          <div v-if="review.preparation || review.dailyLife" :class="['review-card__detail', { 'g-veil': locked && ri === 0 }]">
            <div v-if="review.preparation" class="review-card__detail-item review-card__detail-item--prep">
              <span class="review-card__detail-label">준비</span>
              <p class="review-card__detail-text">{{ review.preparation }}</p>
            </div>
            <div v-if="review.dailyLife" class="review-card__detail-item review-card__detail-item--day">
              <span class="review-card__detail-label">하루</span>
              <p class="review-card__detail-text">{{ review.dailyLife }}</p>
            </div>
          </div>

          <div v-if="review.personalityTags.length > 0" class="review-card__tags">
            <span
              v-for="tag in review.personalityTags"
              :key="tag"
              class="review-card__tag"
            >{{ TAG_LABELS[tag] }}</span>
          </div>
        </li>
      </ul>
    </section>

  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
import { ref, onMounted } from 'vue'
import { fetchJobReviews } from '../../../../encyclopedia.api'
import type { JobReview, T1GroupCode } from '../../../../types/encyclopedia'

const props = defineProps<{ jobCode: string; locked?: boolean }>()
const emit = defineEmits<{ (e: 'unlock'): void }>()

// 비회원(2026-11-11): 흐린 곳을 누르면 페이지가 맨 아래 안내 카드로 내린다(또렷한 링크·버튼은 제 할 일을 하게 둔다)
function onLockedClick(e: MouseEvent) {
  if (props.locked && !(e.target as HTMLElement).closest('button, a')) emit('unlock')
}

// T1 요소 이름 — 검사 결과(API personality.name)·결과 화면과 같은 표기.
// ⚠️ 2026-10-15 전에는 옛 이름(C 성실성·S 민감성 …)이 남아 있어 결과 화면과 달랐다.
const TAG_LABELS: Record<T1GroupCode, string> = {
  E: '외향성', C: '기발함', S: '성실성', A: '우호성', I: '자극추구',
  R: '위험회피', G: '사회적민감성', U: '자율성', T: '연대감',
}

// 랜딩 연구 설문 CAREER_YEARS 와 같은 표기
const CAREER_LABELS: Record<NonNullable<JobReview['careerYears']>, string> = {
  lt1: '1년 미만', '1to3': '1~3년', '3to5': '3~5년', '5to10': '5~10년', gte10: '10년 이상',
}

const reviews = ref<JobReview[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

async function loadReviews() {
  isLoading.value = true
  error.value = null
  try {
    const { data } = await fetchJobReviews(props.jobCode)
    reviews.value = data.data
  } catch {
    error.value = '후기를 불러오는데 실패했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadReviews)
</script>

<template>
  <div class="review-tab">

    <!-- 후기 목록 -->
    <section class="review-section">
      <h3 class="review-section__title">후기 ({{ reviews.length }})</h3>

      <div v-if="isLoading" class="review-empty">불러오는 중...</div>
      <div v-else-if="error" class="review-empty review-empty--error">{{ error }}</div>
      <div v-else-if="reviews.length === 0" class="review-empty">아직 등록된 후기가 없습니다.</div>

      <ul v-else class="review-list">
        <li v-for="review in reviews" :key="review._id" class="review-card">
          <div class="review-card__top">
            <div class="review-card__satisfaction">
              <span class="review-card__satisfaction-label">만족도</span>
              <div class="review-card__bar-bg">
                <div class="review-card__bar-fill" :style="{ width: review.satisfaction + '%' }" />
              </div>
              <span class="review-card__satisfaction-value">{{ review.satisfaction }}점</span>
            </div>
            <span class="review-card__date">{{ formatDate(review.createdAt) }}</span>
          </div>

          <p class="review-card__summary">{{ review.summary }}</p>

          <div class="review-card__detail">
            <div class="review-card__detail-item review-card__detail-item--pros">
              <span class="review-card__detail-label">장점</span>
              <p class="review-card__detail-text">{{ review.pros }}</p>
            </div>
            <div class="review-card__detail-item review-card__detail-item--cons">
              <span class="review-card__detail-label">단점</span>
              <p class="review-card__detail-text">{{ review.cons }}</p>
            </div>
          </div>

          <div class="review-card__recommendation">
            <span class="review-card__recommendation-label">추천</span>
            <p class="review-card__recommendation-text">{{ review.recommendation }}</p>
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
import { ref, onMounted } from 'vue'
import { fetchJobReviews } from '../../../../encyclopedia.api'
import type { JobReview, T1GroupCode } from '../../../../types/encyclopedia'

const props = defineProps<{ jobCode: string }>()

const TAG_LABELS: Record<T1GroupCode, string> = {
  E: '외향성', C: '성실성', S: '민감성', A: '친화성',
  I: '지성', R: '현실성', G: '집단화합', U: '독특성', T: '끈기',
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

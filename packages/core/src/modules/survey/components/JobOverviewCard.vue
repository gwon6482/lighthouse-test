<template>
  <div class="jobcard">

    <!-- 직업명 + 좋아요 (팝업 제목 대신 카드 안으로) -->
    <div class="jobcard__head">
      <div class="jobcard__titlebox">
        <h2 class="jobcard__title">{{ job.title }}</h2>
        <p class="jobcard__class">{{ job.classification.primary }} › {{ job.classification.secondary }}</p>
      </div>
      <button
        class="jobcard__like"
        :class="{ 'jobcard__like--on': isLiked }"
        :aria-label="isLiked ? '좋아요 취소' : '좋아요'"
        @click="onToggleLike"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
            :fill="isLiked ? '#FF5A5A' : 'none'"
            :stroke="isLiked ? '#FF5A5A' : '#ccc'"
            stroke-width="1.8"
          />
        </svg>
      </button>
    </div>

    <!-- 주요업무 -->
    <section class="jobcard__section">
      <h3 class="jobcard__section-title">주요업무</h3>
      <p class="jobcard__text">{{ job.overview }}</p>
    </section>

    <!-- 수행직무 -->
    <section class="jobcard__section">
      <h3 class="jobcard__section-title">수행직무</h3>
      <ul class="jobcard__duties">
        <li v-for="(duty, i) in job.duties" :key="i" class="jobcard__duties-item">{{ duty }}</li>
      </ul>
    </section>

    <!-- 직업 현황 -->
    <section v-if="job.jobSatisfaction != null || job.salary" class="jobcard__section">
      <h3 class="jobcard__section-title">직업 현황</h3>
      <div class="overview-stats">
        <div v-if="job.jobSatisfaction != null" class="overview-stats__card">
          <span class="overview-stats__label">직업 만족도</span>
          <div class="overview-satisfaction">
            <div class="overview-satisfaction__bar-bg">
              <div class="overview-satisfaction__bar-fill" :style="{ width: job.jobSatisfaction + '%' }" />
            </div>
            <span class="overview-satisfaction__value">상위 {{ (100 - job.jobSatisfaction).toFixed(1) }}%</span>
          </div>
        </div>

        <div v-if="job.salary" class="overview-stats__card">
          <span class="overview-stats__label">연봉 (만원)</span>
          <div class="overview-salary">
            <div class="overview-salary__track">
              <div class="overview-salary__bar" />
              <div class="overview-salary__point overview-salary__point--lower">
                <div class="overview-salary__dot" />
                <span class="overview-salary__tip">하위 25%</span>
                <span class="overview-salary__amount">{{ job.salary.lower.toLocaleString() }}</span>
              </div>
              <div class="overview-salary__point overview-salary__point--median">
                <div class="overview-salary__dot overview-salary__dot--median" />
                <span class="overview-salary__tip">중위</span>
                <span class="overview-salary__amount overview-salary__amount--median">{{ job.salary.median.toLocaleString() }}</span>
              </div>
              <div class="overview-salary__point overview-salary__point--upper">
                <div class="overview-salary__dot" />
                <span class="overview-salary__tip">상위 25%</span>
                <span class="overview-salary__amount">{{ job.salary.upper.toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 안내 문구 -->
    <p class="jobcard__more-note">이후 진로백과에서 더 자세하게 확인하세요</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { Job } from '@/modules/encyclopedia/types/encyclopedia'
import { useEncyclopedia } from '@/modules/encyclopedia/composables/useEncyclopedia'
import { useAuthStore } from '@/shared/stores/auth'

const props = defineProps<{ job: Job }>()

// ── 좋아요(북마크) ──
const authStore = useAuthStore()
const { bookmarkedJobCodes, loadBookmarks, toggleBookmark } = useEncyclopedia()

const isLiked = computed(() => bookmarkedJobCodes.value.includes(props.job.jobCode))

async function onToggleLike() {
  if (!authStore.isLoggedIn) return
  await toggleBookmark(props.job.jobCode)
}

onMounted(() => {
  if (authStore.isLoggedIn) loadBookmarks()
})
</script>

<style scoped lang="scss">
.jobcard {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  &__titlebox {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__title {
    font-size: 20px;
    font-weight: 800;
    color: #1a1a1a;
    letter-spacing: -0.3px;
  }

  &__class {
    font-size: 13px;
    color: #888;
  }

  &__like {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    border: none;
    background: #F5F5F0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s;

    &:hover { background: #EEEEE8; }
    &:active { transform: scale(0.92); }
    &--on { background: #FFECEC; }
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: #f8f9fa;
    padding: 18px;
    border-radius: 16px;
  }

  &__section-title {
    font-size: 16px;
    font-weight: 700;
    color: #333;
    padding-bottom: 8px;
    border-bottom: 1.5px solid #eee;
  }

  &__text {
    font-size: 14px;
    color: #555;
    line-height: 1.7;
  }

  &__duties {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;

    &-item {
      font-size: 14px;
      color: #555;
      line-height: 1.6;
      padding-left: 14px;
      position: relative;

      &::before {
        content: '•';
        position: absolute;
        left: 0;
        color: #bbb;
      }
    }
  }

  &__more-note {
    margin-top: 4px;
    text-align: center;
    font-size: 13px;
    color: #999;
    padding: 8px 0 4px;
  }
}

.overview-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: #fff;
    border-radius: 12px;
    padding: 16px 16px 20px;

    &:last-child { padding: 16px 16px 35px; }
  }

  &__label {
    font-size: 13px;
    font-weight: 600;
    color: #888;
  }
}

.overview-satisfaction {
  display: flex;
  align-items: center;
  gap: 12px;

  &__bar-bg {
    flex: 1;
    height: 8px;
    background: #e4e4e4;
    border-radius: 4px;
    overflow: hidden;
  }

  &__bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #4a7fc1, #6fa3e8);
    border-radius: 4px;
    transition: width 0.5s ease;
  }

  &__value {
    flex-shrink: 0;
    font-size: 14px;
    font-weight: 700;
    color: #4a7fc1;
  }
}

.overview-salary {
  padding: 20px 8px 8px;

  &__track {
    position: relative;
    height: 4px;
    background: #e4e4e4;
    border-radius: 2px;
    margin: 0 16px;
  }

  &__bar {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 100%;
    background: linear-gradient(90deg, #c8daf5, #4a7fc1);
    border-radius: 2px;
  }

  &__point {
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;

    &--lower  { left: 0%; }
    &--median { left: 50%; }
    &--upper  { left: 100%; }
  }

  &__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #4a7fc1;
    border: 2px solid #fff;
    box-shadow: 0 0 0 1px #4a7fc1;

    &--median {
      width: 14px;
      height: 14px;
      background: #2b5fa8;
      box-shadow: 0 0 0 1px #2b5fa8;
    }
  }

  &__tip {
    position: absolute;
    top: -22px;
    font-size: 11px;
    color: #aaa;
    white-space: nowrap;
  }

  &__amount {
    position: absolute;
    top: 18px;
    font-size: 13px;
    font-weight: 600;
    color: #444;
    white-space: nowrap;

    &--median {
      font-size: 15px;
      font-weight: 700;
      color: #2b5fa8;
    }
  }
}
</style>

<template>
  <div class="mypage">

    <!-- 헤더 -->
    <header class="mypage__header">
      <button class="mypage__back" @click="router.back()">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M12.5 15L7.5 10L12.5 5" stroke="#1a1a1a" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <span class="mypage__header-title">마이페이지</span>
    </header>

    <div class="mypage__body">

      <!-- 프로필 카드 -->
      <section class="profile-card">
        <div class="profile-card__avatar">{{ avatarLetter }}</div>
        <div class="profile-card__info">
          <p class="profile-card__name">{{ user?.name ?? user?.email }}</p>
          <p class="profile-card__email">{{ user?.email }}</p>
          <div class="profile-card__tags">
            <span v-if="user?.age" class="profile-card__tag">{{ user.age }}세</span>
            <span v-if="user?.gender" class="profile-card__tag">{{ user.gender === 'M' ? '남성' : '여성' }}</span>
          </div>
        </div>
      </section>

      <!-- 내 검사결과 -->
      <section class="mypage__section">
        <h2 class="mypage__section-title">내 검사결과</h2>
        <div v-if="loadingSurveys" class="mypage__loading">불러오는 중...</div>
        <div v-else-if="surveyResults.length === 0" class="mypage__empty">
          아직 완료한 검사가 없습니다.
        </div>
        <ul v-else class="result-list">
          <li
            v-for="result in surveyResults"
            :key="result.survey_id"
            class="result-list__item"
            @click="router.push(`/self-understanding/result/${result.survey_id}`)"
          >
            <div class="result-list__left">
              <div class="result-list__top-row">
                <p class="result-list__id">{{ result.survey_id }}</p>
                <span v-if="result.T1_result?.full_name" class="result-list__type-badge">
                  {{ result.T1_result.full_name }}
                </span>
              </div>
              <p class="result-list__date">{{ formatDate(result.submitted_at) }}</p>
            </div>
            <svg class="result-list__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="#ccc" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </li>
        </ul>
      </section>

      <!-- 내 진로백과 -->
      <section class="mypage__section">
        <h2 class="mypage__section-title">내 진로백과</h2>
        <div v-if="loadingBookmarks" class="mypage__loading">불러오는 중...</div>
        <div v-else-if="bookmarks.length === 0" class="mypage__empty">
          북마크한 직업이 없습니다.
        </div>
        <ul v-else class="job-list">
          <li
            v-for="job in bookmarks"
            :key="job.jobCode"
            class="job-list__item"
            @click="router.push(`/career-encyclopedia/job/${job.jobCode}`)"
          >
            <div class="job-list__left">
              <p class="job-list__title">{{ job.title }}</p>
              <p class="job-list__sub">{{ job.classification?.large }} · {{ job.classification?.medium }}</p>
            </div>
            <svg class="job-list__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 12L10 8L6 4" stroke="#ccc" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </li>
        </ul>
      </section>

      <!-- 내 진로설계 -->
      <section class="mypage__section">
        <h2 class="mypage__section-title">내 진로설계</h2>
        <div class="mypage__coming-soon">
          <span class="mypage__coming-soon-icon">🗺️</span>
          <p>준비 중인 기능입니다.</p>
        </div>
      </section>

      <!-- 내 진로달성 -->
      <section class="mypage__section">
        <h2 class="mypage__section-title">내 진로달성</h2>
        <div class="mypage__coming-soon">
          <span class="mypage__coming-soon-icon">🏆</span>
          <p>준비 중인 기능입니다.</p>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import { req } from '@/shared/api'

const router = useRouter()
const authStore = useAuthStore()
const user = computed(() => authStore.user)

const avatarLetter = computed(() => {
  const src = user.value?.name ?? user.value?.email ?? '?'
  return src.charAt(0).toUpperCase()
})

const surveyResults = ref<any[]>([])
const bookmarks = ref<any[]>([])
const loadingSurveys = ref(true)
const loadingBookmarks = ref(true)

const formatDate = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

onMounted(async () => {
  if (!authStore.isLoggedIn) {
    router.replace('/')
    return
  }
  const [surveyRes, bookmarkRes] = await Promise.allSettled([
    req.get('/api/user/survey-results'),
    req.get('/api/user/bookmarks'),
  ])
  if (surveyRes.status === 'fulfilled') surveyResults.value = surveyRes.value.data.surveyResults ?? []
  if (bookmarkRes.status === 'fulfilled') bookmarks.value = bookmarkRes.value.data.bookmarkedJobs ?? []
  loadingSurveys.value = false
  loadingBookmarks.value = false
})
</script>

<style scoped lang="scss">
.mypage {
  min-height: 100vh;
  background: #F5F5F5;

  &__header {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 1rem;
    height: 56px;
    background: #fff;
    border-bottom: 1px solid #EEEEE8;
  }

  &__back {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    cursor: pointer;
    border-radius: 50%;
    transition: background 0.15s;
    &:hover { background: #F5F5F5; }
  }

  &__header-title {
    font-size: 1rem;
    font-weight: 700;
    color: #1a1a1a;
  }

  &__body {
    padding: 1.25rem 1rem 3rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    max-width: 480px;
    margin: 0 auto;
  }

  &__section {
    background: #fff;
    border-radius: 1rem;
    border: 1px solid #EEEEE8;
    overflow: hidden;
  }

  &__section-title {
    font-size: 0.9375rem;
    font-weight: 800;
    color: #1a1a1a;
    padding: 1rem 1.125rem 0.75rem;
    border-bottom: 1px solid #F5F5F5;
    margin: 0;
  }

  &__loading,
  &__empty {
    padding: 1.5rem 1.125rem;
    font-size: 0.875rem;
    color: #aaa;
    text-align: center;
  }

  &__coming-soon {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding: 2rem 1rem;

    &-icon { font-size: 1.75rem; }

    p {
      font-size: 0.875rem;
      color: #bbb;
      margin: 0;
    }
  }
}

.profile-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #fff;
  border: 1px solid #EEEEE8;
  border-radius: 1rem;
  padding: 1.25rem;

  &__avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: #FFD100;
    color: #1a1a1a;
    font-size: 1.25rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__info { flex: 1; min-width: 0; }

  &__name {
    font-size: 1rem;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__email {
    font-size: 0.8125rem;
    color: #888;
    margin: 0.125rem 0 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__tags {
    display: flex;
    gap: 0.375rem;
    margin-top: 0.5rem;
  }

  &__tag {
    font-size: 0.6875rem;
    font-weight: 600;
    color: #888;
    background: #F5F5F5;
    border-radius: 0.375rem;
    padding: 0.1875rem 0.5rem;
  }
}

.result-list {
  list-style: none;
  margin: 0;
  padding: 0;

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 1.125rem;
    cursor: pointer;
    transition: background 0.12s;
    border-bottom: 1px solid #F5F5F5;

    &:last-child { border-bottom: none; }
    &:hover { background: #FAFAF8; }
    &:active { background: #F5F5F5; }
  }

  &__left { flex: 1; min-width: 0; }

  &__top-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  &__id {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__type-badge {
    font-size: 0.6875rem;
    font-weight: 700;
    color: #CC8800;
    background: #FFF8DC;
    border-radius: 0.375rem;
    padding: 0.125rem 0.4375rem;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__date {
    font-size: 0.75rem;
    color: #aaa;
    margin: 0.125rem 0 0;
  }

  &__arrow { flex-shrink: 0; margin-left: 0.5rem; }
}

.job-list {
  list-style: none;
  margin: 0;
  padding: 0;

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.875rem 1.125rem;
    cursor: pointer;
    transition: background 0.12s;
    border-bottom: 1px solid #F5F5F5;

    &:last-child { border-bottom: none; }
    &:hover { background: #FAFAF8; }
    &:active { background: #F5F5F5; }
  }

  &__left { flex: 1; min-width: 0; }

  &__title {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__sub {
    font-size: 0.75rem;
    color: #aaa;
    margin: 0.125rem 0 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__arrow { flex-shrink: 0; margin-left: 0.5rem; }
}
</style>

<template>
  <div class="job-detail-page">
    <!-- 로딩 -->
    <div v-if="isLoading" class="job-detail-page__loading">
      로딩 중...
    </div>

    <!-- 에러 -->
    <div v-else-if="error" class="job-detail-page__error">
      {{ error }}
    </div>

    <!-- 직업 상세 -->
    <template v-else-if="selectedJob">
      <!-- 헤더: 직업명 + 분류 + 좋아요 + 추천 배지 -->
      <JobDetailHeader
        :title="selectedJob.title"
        :classification="selectedJob.classification"
        :is-liked="bookmarkedJobCodes.includes(selectedJob.jobCode)"
        :is-recommended="isCurrentJobRecommended"
        @toggle-like="handleToggleLike"
      />

      <!-- 탭 네비게이션 -->
      <JobDetailTabs
        :active-tab="activeTab"
        @change="setActiveTab"
      />

      <!-- 탭 컨텐츠 -->
      <div class="job-detail-page__content" :class="{ 'job-detail-page__content--padded': showSetTargetBtn }">
        <OverviewTab
          v-if="activeTab === 'overview'"
          :job="selectedJob"
        />
        <ReviewTab
          v-else-if="activeTab === 'review'"
          :job-code="selectedJob.jobCode"
        />
        <PreparationTab
          v-else-if="activeTab === 'preparation'"
          :job-code="selectedJob.jobCode"
        />
        <RecruitmentTab
          v-else-if="activeTab === 'recruitment'"
          :job-code="selectedJob.jobCode"
        />
      </div>

      <!-- 목표진로로 설정하기 고정 버튼 -->
      <Transition name="fab-slide">
        <div v-if="showSetTargetBtn" class="set-target-fab">
          <button
            class="set-target-fab__btn"
            :class="{ 'set-target-fab__btn--done': targetJustSet }"
            :disabled="settingTarget"
            @click="handleSetTarget"
          >
            <template v-if="targetJustSet">
              ✓ 목표진로로 설정됐어요
            </template>
            <template v-else-if="settingTarget">
              설정 중...
            </template>
            <template v-else>
              🎯 목표진로로 설정하기
            </template>
          </button>
        </div>
      </Transition>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEncyclopedia } from '../composables/useEncyclopedia'
import { useAuthStore } from '@/shared/stores/auth'
import { fetchTargetCareer, updateTargetCareer } from '../encyclopedia.api'
import JobDetailHeader from '../components/page/job-detail/JobDetailHeader.vue'
import JobDetailTabs from '../components/page/job-detail/JobDetailTabs.vue'
import OverviewTab from '../components/page/job-detail/tabs/OverviewTab.vue'
import ReviewTab from '../components/page/job-detail/tabs/ReviewTab.vue'
import PreparationTab from '../components/page/job-detail/tabs/PreparationTab.vue'
import RecruitmentTab from '../components/page/job-detail/tabs/RecruitmentTab.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const {
  selectedJob,
  activeTab,
  isLoading,
  error,
  loadJob,
  setActiveTab,
  bookmarkedJobCodes,
  loadBookmarks,
  toggleBookmark,
  userRecommendedJobCodes,
  loadUserRecommendedJobCodes,
} = useEncyclopedia()

const isCurrentJobRecommended = computed(() =>
  !!selectedJob.value &&
  userRecommendedJobCodes.value.includes(selectedJob.value!.jobCode)
)

async function handleToggleLike() {
  if (!authStore.isLoggedIn) {
    alert('로그인 후 이용할 수 있습니다.')
    return
  }
  if (!selectedJob.value) return
  await toggleBookmark(selectedJob.value.jobCode)
}

// ── 목표진로 설정 버튼 ──
const hasNoTarget = ref(false)   // 로그인 + targetCareer null 여부
const settingTarget = ref(false)
const targetJustSet = ref(false)

const showSetTargetBtn = computed(() =>
  authStore.isLoggedIn && hasNoTarget.value && !!selectedJob.value
)

async function handleSetTarget() {
  if (!selectedJob.value) return

  // /main/before 스테퍼(2단계)에서 진입했으면 확인 후 설정 → 복귀
  const returnTo = sessionStorage.getItem('lh_target_return')
  if (returnTo && !confirm('목표진로로 설정하시겠습니까?')) return

  settingTarget.value = true
  try {
    const { data } = await updateTargetCareer({
      refType: 'jobCode',
      ref: selectedJob.value.jobCode,
    })
    if (data.success) {
      hasNoTarget.value = false
      if (returnTo) {
        sessionStorage.removeItem('lh_target_return')
        router.push(returnTo)
        return
      }
      targetJustSet.value = true
      setTimeout(() => { targetJustSet.value = false }, 2200)
    }
  } catch { /* ignore */ } finally {
    settingTarget.value = false
  }
}

onMounted(async () => {
  const jobCode = route.params.jobCode as string
  await loadJob(jobCode)

  if (authStore.isLoggedIn) {
    loadBookmarks()
    loadUserRecommendedJobCodes()
    try {
      const { data } = await fetchTargetCareer()
      if (data.success && !data.targetCareer) {
        hasNoTarget.value = true
      }
    } catch { /* 무시 */ }
  }
})
</script>

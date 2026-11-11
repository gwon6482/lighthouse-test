<template>
  <div ref="pageEl" class="job-detail-page">
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
        :job-code="selectedJob.jobCode"
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
          :locked="guestLocked"
        />
        <!-- 비회원(2026-11-11): 다른 탭도 내용을 그리되 첫 항목만 또렷하게, 나머지는 흐리게(features.guestEntry 빌드만).
             흐린 곳을 누르면 아래 안내 카드로 내린다. 개요는 탭 안에 같은 카드가 있다 -->
        <ReviewTab
          v-else-if="activeTab === 'review'"
          :job-code="selectedJob.jobCode"
          :locked="guestLocked"
          @unlock="scrollToGuestCta"
        />
        <PreparationTab
          v-else-if="activeTab === 'preparation'"
          :job-code="selectedJob.jobCode"
          :locked="guestLocked"
          @unlock="scrollToGuestCta"
        />
        <RecruitmentTab
          v-else-if="activeTab === 'recruitment'"
          :job-code="selectedJob.jobCode"
          :locked="guestLocked"
          @unlock="scrollToGuestCta"
        />
        <div v-if="guestLocked && activeTab !== 'overview'" ref="guestCtaEl" class="overview-lock overview-lock--tab"><JobGuestCta /></div>
        <!-- 비회원 떠 있는 카드(2026-11-11) — 직업 이름·탭을 지나면 올라오고, 맨 아래 안내 카드가 보이면 내려간다.
             회원의 '목표진로로 설정하기' 버튼 자리를 비회원은 이 카드가 쓴다 -->
        <GuestFloatCard v-if="guestLocked" :show="guestFloatShow" title="이 직업, 나와 맞을까요?">
          <RouterLink to="/start" class="gfloat__cta">나에게 맞는 직업 찾기</RouterLink>
        </GuestFloatCard>
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
              <AppIcon name="ui-check" /> 목표진로로 설정됐어요
            </template>
            <template v-else-if="settingTarget">
              설정 중...
            </template>
            <template v-else>
              <AppIcon name="ui-target" /> {{ currentTarget ? '목표진로로 변경하기' : '목표진로로 설정하기' }}
            </template>
          </button>
        </div>
      </Transition>
    </template>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEncyclopedia } from '../composables/useEncyclopedia'
import { useAuthStore } from '@/shared/stores/auth'
import { fetchTargetCareer, updateTargetCareer, type TargetCareer } from '../encyclopedia.api'
import JobDetailHeader from '../components/page/job-detail/JobDetailHeader.vue'
import JobDetailTabs from '../components/page/job-detail/JobDetailTabs.vue'
import OverviewTab from '../components/page/job-detail/tabs/OverviewTab.vue'
import ReviewTab from '../components/page/job-detail/tabs/ReviewTab.vue'
import PreparationTab from '../components/page/job-detail/tabs/PreparationTab.vue'
import RecruitmentTab from '../components/page/job-detail/tabs/RecruitmentTab.vue'
import JobGuestCta from '../components/page/job-detail/JobGuestCta.vue'
import GuestFloatCard from '@/shared/components/GuestFloatCard.vue'
import { features } from '@/shared/config/features'

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

// 비회원 진로백과(2026-11-09): '이 일을 하는 사람들' 아래와 다른 탭을 잠근다. 목표 진로 버튼은 원래 로그인해야 보인다
const guestLocked = computed(() => features.guestEntry && !authStore.isLoggedIn)
const guestCtaEl = ref<HTMLElement | null>(null)
function scrollToGuestCta() {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  guestCtaEl.value?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
}
// 떠 있는 카드 — 직업 이름·탭(맨 위 약 240px)을 지나면 보이고, 맨 아래 안내 카드(개요 안 또는 탭 아래 .overview-lock)가 화면에 들어오면 숨긴다
const pageEl = ref<HTMLElement | null>(null)
const guestFloatShow = ref(false)
function updateGuestFloat() {
  if (!guestLocked.value) { guestFloatShow.value = false; return }
  const cta = pageEl.value?.querySelector('.overview-lock')
  const ctaSeen = !!cta && cta.getBoundingClientRect().top < window.innerHeight
  guestFloatShow.value = window.scrollY > 240 && !ctaSeen
}
onMounted(() => window.addEventListener('scroll', updateGuestFloat, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('scroll', updateGuestFloat))
watch(activeTab, () => nextTick(updateGuestFloat))   // 탭을 바꾸면 길이가 달라진다

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
// ⚠️ 2026-10-20 핫픽스: 예전에는 '목표진로가 없을 때만' 버튼을 보여서, 한 번 정한 사람은 진로설계 → [변경] →
//    [진로백과에서 선택하기]로 와도 바꿀 방법이 없었다. 지금은 **현재 목표와 다른 직업이면** 보이고(설정/변경),
//    이미 목표인 직업이면 숨긴다.
const targetLoaded = ref(false)
const currentTarget = ref<TargetCareer | null>(null)
const settingTarget = ref(false)
const targetJustSet = ref(false)

const isCurrentTarget = computed(() =>
  currentTarget.value?.refType === 'jobCode' && currentTarget.value.ref === selectedJob.value?.jobCode
)
const showSetTargetBtn = computed(() =>
  authStore.isLoggedIn && targetLoaded.value && !!selectedJob.value && (!isCurrentTarget.value || targetJustSet.value)
)

async function handleSetTarget() {
  if (!selectedJob.value) return

  // /main/before 스테퍼(2단계)·진로설계 [변경]에서 진입했으면 확인 후 설정 → 그 화면으로 복귀
  const returnTo = sessionStorage.getItem('lh_target_return')
  const prev = currentTarget.value ? (currentTarget.value.title ?? currentTarget.value.ref) : ''
  const message = prev
    ? `목표진로를 '${prev}'에서 '${selectedJob.value.title}'(으)로 바꿀까요?`
    : '목표진로로 설정하시겠습니까?'
  if ((returnTo || prev) && !confirm(message)) return

  settingTarget.value = true
  try {
    const { data } = await updateTargetCareer({
      refType: 'jobCode',
      ref: selectedJob.value.jobCode,
    })
    if (data.success) {
      currentTarget.value = { refType: 'jobCode', ref: selectedJob.value.jobCode, title: selectedJob.value.title }
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
      if (data.success) currentTarget.value = data.targetCareer
    } catch { /* 무시 */ } finally {
      targetLoaded.value = true
    }
  }
})
</script>

<template>
  <!-- 마이페이지(2026-10-28 개편) — 메인·로드맵과 같은 톤. 진행 상황(○○를 향해 n일차·%)은 메인·로드맵 몫이라 여기엔 두지 않는다(사용자).
       진로계획 목록도 뺐다(사용자: 리스트로 많이 있을 필요 없음) — 계획 보기·수정은 메인 '내 진로계획' 타일 -->
  <div class="mp">
    <section class="mp-hero">
      <div class="mp-hero__profile">
        <span class="mp-hero__avatar">{{ avatarLetter }}</span>
        <div class="mp-hero__who">
          <p class="mp-hero__name">{{ user?.name ?? user?.email }}<small v-if="user?.name">님</small></p>
          <p class="mp-hero__email">{{ user?.email }}</p>
        </div>
      </div>
      <!-- 숫자 3칸 — 완료 기록은 하단 탭 '로그'로, 나머지는 아래 해당 영역으로 -->
      <div class="mp-counts">
        <button type="button" class="mp-count" @click="router.push({ name: 'Career Achievement Records' })">
          <span class="mp-count__chip mp-count__chip--orange"><AppIcon name="ui-photo" /></span>
          <strong>{{ records.length }}</strong><span>완료 기록</span>
        </button>
        <button type="button" class="mp-count" @click="jump('mp-surveys')">
          <span class="mp-count__chip mp-count__chip--green"><AppIcon name="service-test" /></span>
          <strong>{{ surveyResults.length }}</strong><span>검사</span>
        </button>
        <button type="button" class="mp-count" @click="jump('mp-jobs')">
          <span class="mp-count__chip mp-count__chip--blue"><AppIcon name="ui-like" /></span>
          <strong>{{ bookmarks.length }}</strong><span>관심 직업</span>
        </button>
      </div>
    </section>

    <!-- 내 검사결과 — 제목은 유형 이름(예전엔 내부 ID SURV… 를 그대로 보였다) -->
    <section id="mp-surveys" class="mp-sec">
      <h2 class="mp-sec__title">내 검사결과</h2>
      <div v-if="loadingSurveys" class="mp-empty">불러오는 중...</div>
      <p v-else-if="!surveyResults.length" class="mp-empty">아직 완료한 검사가 없어요.</p>
      <ul v-else class="mp-list">
        <li v-for="(r, i) in surveyResults" :key="r.survey_id">
          <button type="button" class="mp-row" @click="router.push(`/self-understanding/result/${r.survey_id}`)">
            <span class="mp-row__chip mp-row__chip--green"><AppIcon name="area-personality" /></span>
            <span class="mp-row__body">
              <span class="mp-row__title">{{ r.T1_result?.full_name || '자기이해 검사' }}<em v-if="i === 0" class="mp-row__badge">최근</em></span>
              <span class="mp-row__sub">{{ formatDate(r.submitted_at) }}</span>
            </span>
            <AppIcon name="ui-chevron-right" class="mp-row__arrow" />
          </button>
        </li>
      </ul>
    </section>

    <!-- 관심 직업(북마크) -->
    <section id="mp-jobs" class="mp-sec">
      <h2 class="mp-sec__title">관심 직업</h2>
      <div v-if="loadingBookmarks" class="mp-empty">불러오는 중...</div>
      <p v-else-if="!bookmarks.length" class="mp-empty">진로백과에서 하트를 누른 직업이 여기에 모여요.</p>
      <ul v-else class="mp-list">
        <li v-for="job in bookmarks" :key="job.jobCode">
          <button type="button" class="mp-row" @click="router.push(`/career-encyclopedia/job/${job.jobCode}`)">
            <span class="mp-row__chip mp-row__chip--blue"><AppIcon name="service-encyclopedia" /></span>
            <span class="mp-row__body">
              <span class="mp-row__title">{{ job.title }} <JobGateBadges :job-code="job.jobCode" /></span>
              <span v-if="jobClass(job)" class="mp-row__sub">{{ jobClass(job) }}</span>
            </span>
            <AppIcon name="ui-chevron-right" class="mp-row__arrow" />
          </button>
        </li>
      </ul>
    </section>

    <!-- 일정 — 이번 주 요일·항목 조정(2026-10-30 메인 타일에서 옮김) -->
    <section class="mp-sec">
      <h2 class="mp-sec__title">일정</h2>
      <button type="button" class="mp-row" @click="router.push({ name: 'Career Achievement Weekly Schedule' })">
        <span class="mp-row__chip mp-row__chip--blue"><AppIcon name="ui-calendar" /></span>
        <span class="mp-row__body">
          <span class="mp-row__title">이번 주 일정 조정</span>
          <span class="mp-row__sub">요일·할 일을 이번 주 사정에 맞게 바꿔요</span>
        </span>
        <AppIcon name="ui-chevron-right" class="mp-row__arrow" />
      </button>
    </section>

    <!-- 계정. 🚨 탈퇴는 **되돌릴 수 없다** — 맨 아래에 두고 약하게 강조한다.
         개인정보처리방침에 '파기'를 명시했으므로 앱에서 탈퇴할 길이 있어야 한다. -->
    <section class="mp-sec mp-account">
      <h2 class="mp-sec__title">계정</h2>
      <ul class="mp-links">
        <li><button type="button" class="mp-link" @click="logout">로그아웃</button></li>
        <li><a class="mp-link" href="https://www.lighthouse.career/terms" target="_blank" rel="noopener">이용약관</a></li>
        <li><a class="mp-link" href="https://www.lighthouse.career/privacy" target="_blank" rel="noopener">개인정보처리방침</a></li>
      </ul>
      <button type="button" class="mp-danger" @click="showDelete = true">회원 탈퇴</button>
      <p class="mp-danger-note">탈퇴하면 검사 결과와 진로 기록이 모두 삭제되고 되돌릴 수 없어요.</p>
    </section>

    <AccountDeleteSheet v-model="showDelete" @deleted="onDeleted" />
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import { useAchievementStore } from '@/shared/stores/achievement'
import { req } from '@/shared/api'
import AccountDeleteSheet from '../components/AccountDeleteSheet.vue'
import JobGateBadges from '@/shared/components/JobGateBadges.vue'
import { useAchievementEntries } from '@/modules/career-achievement/composables/useAchievementEntries'

const router = useRouter()
const authStore = useAuthStore()
const achievementStore = useAchievementStore()
const user = computed(() => authStore.user)

// ── 회원 탈퇴 ─────────────────────────────────────────────────────────────
// 🚨 되돌릴 수 없다. 확인 절차는 AccountDeleteSheet 가 담당한다('삭제' 타이핑).
const showDelete = ref(false)

// 서버에서 계정이 지워진 뒤에만 불린다. 이제 토큰이 가리키는 계정이 없으므로
// **반드시 로컬 인증을 정리**하고 앱 밖으로 내보낸다.
// ⚠️ `router.push` 가 아니라 `replace` 다 — 뒤로가기로 지워진 계정 화면에 돌아오면 안 된다.
function onDeleted() {
  showDelete.value = false
  authStore.logout()
  achievementStore.reset()
  router.replace('/onboarding')
}

const avatarLetter = computed(() => {
  const src = user.value?.name ?? user.value?.email ?? '?'
  return src.charAt(0).toUpperCase()
})

const surveyResults = ref<any[]>([])
const bookmarks = ref<any[]>([])
const loadingSurveys = ref(true)
const loadingBookmarks = ref(true)

// 북마크의 분류는 primary/secondary 로 온다(예전 코드는 large/medium 을 읽어 '·'만 보였다)
const jobClass = (job: any) => [job.classification?.primary ?? job.classification?.large, job.classification?.secondary ?? job.classification?.medium].filter(Boolean).join(' · ')

const formatDate = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

function logout() {
  if (!confirm('로그아웃할까요?')) return
  authStore.logout()
  achievementStore.reset()
  // replace — 뒤로가기로 로그인된 화면에 돌아오지 않게
  router.replace('/onboarding')
}

// 완료 기록 수(숫자 칸) — 기록 자체는 하단 탭 '로그'에서 본다(2026-10-29)
const { feedSorted, entries } = useAchievementEntries()
const records = computed(() => { void entries.value; return feedSorted().filter((e) => e.itemType === 'project') })
function jump(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

onMounted(async () => {
  achievementStore.loadActivePlan() // 완료 기록을 함께 읽는다(이미 읽었으면 그대로)
  if (!authStore.isLoggedIn) {
    router.replace('/')
    return
  }
  const [surveyRes, bookmarkRes] = await Promise.allSettled([
    req.get('/api/user/survey-results'),
    req.get('/api/user/bookmarks'),
  ])
  // 최근 검사가 위로 — 서버는 오래된 순으로 준다(2026-10-30, 예전엔 첫 번째에 '최근'을 붙여 틀렸다)
  if (surveyRes.status === 'fulfilled')  surveyResults.value = [...(surveyRes.value.data.surveyResults ?? [])].sort((a, b) => String(b.submitted_at).localeCompare(String(a.submitted_at)))
  if (bookmarkRes.status === 'fulfilled') bookmarks.value = bookmarkRes.value.data.bookmarkedJobs ?? []
  loadingSurveys.value = false
  loadingBookmarks.value = false
})
</script>

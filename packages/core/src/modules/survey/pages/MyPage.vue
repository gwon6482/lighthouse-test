<template>
  <!-- 마이페이지(2026-10-28 개편) — 메인·로드맵과 같은 톤. 진행 상황(○○를 향해 n일차·%)은 메인·로드맵 몫이라 여기엔 두지 않는다(사용자) -->
  <div class="mp">
    <section class="mp-hero">
      <div class="mp-hero__profile">
        <span class="mp-hero__avatar">{{ avatarLetter }}</span>
        <div class="mp-hero__who">
          <p class="mp-hero__name">{{ user?.name ?? user?.email }}<small v-if="user?.name">님</small></p>
          <p class="mp-hero__email">{{ user?.email }}</p>
        </div>
      </div>
      <!-- 숫자 3칸 — 누르면 아래 해당 영역으로 -->
      <div class="mp-counts">
        <button type="button" class="mp-count" @click="jump('mp-records')">
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

    <!-- 기록 모아보기 — 최근 몇 장 + 전체보기 -->
    <section id="mp-records" class="mp-sec">
      <div class="mp-sec__head">
        <h2 class="mp-sec__title">기록 모아보기</h2>
        <button v-if="records.length" type="button" class="mp-sec__more" @click="router.push({ name: 'Career Achievement Records' })">
          전체보기 <AppIcon name="ui-chevron-right" />
        </button>
      </div>
      <p v-if="!records.length" class="mp-empty">프로젝트를 완료하며 남긴 사진·메모가 여기에 모여요.</p>
      <div v-else class="mp-shots">
        <button
          v-for="e in recentRecords" :key="e.date + e.itemId" type="button" class="mp-shot"
          :style="e.photoUrl ? undefined : { background: tint(categoryColor(e.itemCategory)), color: categoryColor(e.itemCategory) }"
          @click="router.push({ name: 'Career Achievement Records' })"
        >
          <img v-if="e.photoUrl" :src="e.photoUrl" :alt="e.itemName" loading="lazy">
          <span v-else class="mp-shot__name">{{ e.itemName }}</span>
          <span class="mp-shot__date">{{ shortDate(e.date) }}</span>
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
              <span class="mp-row__sub">{{ job.classification?.large }} · {{ job.classification?.medium }}</span>
            </span>
            <AppIcon name="ui-chevron-right" class="mp-row__arrow" />
          </button>
        </li>
      </ul>
    </section>

    <!-- 진로계획 목록 -->
    <section class="mp-sec">
      <div class="mp-sec__head">
        <h2 class="mp-sec__title">진로계획</h2>
        <button type="button" class="mp-sec__more" @click="router.push('/career-design/templates')">+ 새 계획</button>
      </div>
      <div v-if="loadingPlans" class="mp-empty">불러오는 중...</div>
      <p v-else-if="!careerPlans.length" class="mp-empty">아직 저장된 진로계획이 없어요.</p>
      <ul v-else class="mp-list">
        <li v-for="plan in careerPlans" :key="plan.planId" class="mp-plan">
          <button type="button" class="mp-row" @click="openPlan(plan.planId)">
            <span class="mp-row__chip mp-row__chip--purple"><AppIcon name="ui-template" /></span>
            <span class="mp-row__body">
              <span class="mp-row__title">
                {{ plan.targetJob || '목표 직업 미설정' }}
                <em class="mp-row__status" :class="`mp-row__status--${plan.status}`">{{ statusLabel(plan.status) }}</em>
              </span>
              <span class="mp-row__sub">{{ plan.name || '이름 없는 계획' }} · 프로젝트 {{ plan.projects?.length ?? 0 }}개</span>
            </span>
          </button>
          <button type="button" class="mp-plan__delete" :aria-label="`${plan.name || '이 계획'} 삭제`" @click="deletePlan(plan.planId)">
            <AppIcon name="ui-close" />
          </button>
        </li>
      </ul>
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
import { useCareerDesign } from '@/modules/career-design/composables/useCareerDesign'
import AccountDeleteSheet from '../components/AccountDeleteSheet.vue'
import JobGateBadges from '@/shared/components/JobGateBadges.vue'
import { useAchievementEntries } from '@/modules/career-achievement/composables/useAchievementEntries'
import { categoryColor } from '@/modules/career-achievement/lib/planBoard'

const router = useRouter()
const authStore = useAuthStore()
const achievementStore = useAchievementStore()
const { fetchMyPlans } = useCareerDesign()
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
const careerPlans = ref<any[]>([])
const loadingSurveys = ref(true)
const loadingBookmarks = ref(true)
const loadingPlans = ref(true)

const formatDate = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const statusLabel = (status: string) => {
  if (status === 'active')    return '진행중'
  if (status === 'completed') return '완료'
  return '초안'
}

function openPlan(planId: string) {
  router.push(`/career-design/plan/${planId}`)
}

// ⚠️ 되돌릴 수 없다 — 예전엔 휴지통 한 번에 확인 없이 지웠다(진행 중 계획도). 2026-10-28 확인 추가
async function deletePlan(planId: string) {
  const plan = careerPlans.value.find(p => p.planId === planId)
  const name = plan?.name || plan?.targetJob || '이 진로계획'
  // 서버가 딸린 주간 일정·실행 기록·커리큘럼 완료·인증사진까지 함께 지운다(lighthouse-api services/userPurge.purgePlan)
  const c = name.trim().slice(-1).charCodeAt(0) - 0xac00
  const josa = c < 0 || c > 11171 ? '을(를)' : c % 28 ? '을' : '를' // 받침으로 을/를
  if (!confirm(`'${name}'${josa} 삭제할까요?\n주간 일정·달성 기록·인증 사진도 함께 사라지고 되돌릴 수 없어요.`)) return
  try {
    await req.delete(`/api/career-plan/${planId}`)
    careerPlans.value = careerPlans.value.filter(p => p.planId !== planId)
    // 진행 중 계획을 지웠으면 메인(진로달성)·하단 탭이 옛 계획을 붙잡지 않게 다시 읽힌다
    if (plan?.status === 'active') achievementStore.reset()
  } catch {
    alert('삭제하지 못했어요. 잠시 후 다시 시도해 주세요.')
  }
}

function logout() {
  if (!confirm('로그아웃할까요?')) return
  authStore.logout()
  achievementStore.reset()
  // replace — 뒤로가기로 로그인된 화면에 돌아오지 않게
  router.replace('/onboarding')
}

// ── 기록 모아보기 — 진행 중 계획의 완료 기록(사진·메모). 최근 6개만, 나머지는 전체보기 ──
const { feedSorted, entries } = useAchievementEntries()
const records = computed(() => { void entries.value; return feedSorted().filter((e) => e.itemType === 'project') })
const recentRecords = computed(() => records.value.slice(0, 6))
const tint = (c: string) => `color-mix(in srgb, ${c} 14%, white)`
const shortDate = (k: string) => { const [, m, d] = k.split('-'); return `${+m!}/${+d!}` }
function jump(id: string) { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

onMounted(async () => {
  achievementStore.loadActivePlan() // 완료 기록을 함께 읽는다(이미 읽었으면 그대로)
  if (!authStore.isLoggedIn) {
    router.replace('/')
    return
  }
  const [surveyRes, bookmarkRes, plans] = await Promise.allSettled([
    req.get('/api/user/survey-results'),
    req.get('/api/user/bookmarks'),
    fetchMyPlans(),
  ])
  if (surveyRes.status === 'fulfilled')  surveyResults.value = surveyRes.value.data.surveyResults ?? []
  if (bookmarkRes.status === 'fulfilled') bookmarks.value = bookmarkRes.value.data.bookmarkedJobs ?? []
  if (plans.status === 'fulfilled')      careerPlans.value = plans.value
  loadingSurveys.value = false
  loadingBookmarks.value = false
  loadingPlans.value = false
})
</script>

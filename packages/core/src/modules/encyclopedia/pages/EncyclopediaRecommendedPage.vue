<template>
  <div class="rec-page">

    <!-- 공용 헤더 -->
    <AppHeader />

    <!-- 검사 없음(비로그인 포함) -->
    <div v-if="state === 'noSurvey' || state === 'guest'" class="rec-no-survey">
      <div class="rec-no-survey__icon"><AppIcon name="ui-no-survey" /></div>
      <p class="rec-no-survey__title">검사 결과가 없어요</p>
      <p class="rec-no-survey__desc">자기이해 검사를 마치면<br>결과와 가까운 직무를 보여 드려요</p>
      <button class="rec-no-survey__cta" @click="$router.push('/self-understanding')">
        자기이해 검사 시작하기
      </button>
    </div>

    <template v-else>

      <!-- 히어로 헤더 — 2026-11-17 오너 결정 13: 'AI 맞춤 추천'·'딱 맞는'을 쓰지 않는다(결과를 단정하지 않고 출발점으로 소개).
           2026-11-26 시안 1판(오너 '모두 권장대로'): 직업 목록 대신 직무 3가지부터. 순위 숫자·%·급여는 보이지 않는다(진로백과 메인 카드·분류로 찾기와 같은 기준).
           어느 검사의 추천인지 날짜를 밝히고 결과지로 잇는다 -->
      <div class="rec-hero">
        <p class="rec-hero__label">
          <span><AppIcon name="ui-sparkle" /> {{ dateLabel ? `${dateLabel} 검사 결과` : '자기이해 검사 결과' }}</span>
          <RouterLink v-if="surveyId" :to="{ path: `/self-understanding/result/${surveyId}`, query: { at: 'groups' } }" class="rec-hero__link">결과 보기<AppIcon name="ui-chevron-right" /></RouterLink>
        </p>
        <h2 class="rec-hero__title">{{ heading }}</h2>
        <p class="rec-hero__sub">{{ groupMode ? `검사 결과와 가까운 직무 ${groups.length}가지예요` : '검사 결과와 가까운 직업이에요' }}<template v-if="!target"><br>여기서부터 살펴보세요</template></p>
      </div>

      <!-- 목표를 정한 회원: 목표가 먼저, 추천은 '다른 길'로(메인 카드와 같은 규칙) -->
      <component
        :is="target.jobCode ? 'button' : 'div'"
        v-if="target"
        :type="target.jobCode ? 'button' : undefined"
        class="rec-goal"
        @click="target.jobCode && goJob(target.jobCode)"
      >
        <span class="rec-goal__icon"><AppIcon name="ui-target" /></span>
        <span class="rec-goal__text">
          <small>{{ targetCaption(targetGroup?.name) }}</small>
          <b>{{ target.title }}</b>
        </span>
        <AppIcon v-if="target.jobCode" name="ui-chevron-right" class="rec-goal__arrow" />
      </component>

      <!-- ── 직무 3가지 — 펼친 채로(메인 카드는 접힌 요약) ── -->
      <section class="rec-groups" :aria-busy="groupsBusy">
        <div v-if="groupsBusy" class="comp-skeleton-list">
          <div v-for="n in 3" :key="n" class="comp-skeleton" />
        </div>

        <template v-else-if="groupMode">
          <article v-for="g in groups" :key="g.code" class="rec-grp">
            <h3 class="rec-grp__name">{{ g.name }}</h3>
            <!-- 결과지·메인 카드와 같은 문장(jobGroupWhy). ⚠️ 한 줄로 둔다 — 줄을 바꾸면 핵심어와 조사 사이에 공백이 생긴다 -->
            <p v-if="g.reasons.length" class="rec-grp__why"><template v-for="(seg, k) in whyParts(g)" :key="k"><template v-if="seg.kw"><b class="rec-grp__kw">{{ seg.kw.name }}</b><span class="rec-grp__ax">({{ REASON_AXIS[seg.kw.axis] }})</span></template><template v-else>{{ seg.text }}</template></template></p>
            <p class="rec-grp__label">대표 직업</p>
            <ul class="rec-grp__jobs">
              <li v-for="job in g.jobs.slice(0, REP_JOBS)" :key="job.jobCode">
                <button type="button" class="rec-grp__job" @click="openJob(job)">
                  <span class="rec-grp__job-t">{{ job.title }}</span>
                  <span v-if="isTargetJob(job)" class="rec-grp__mine">내 목표</span>
                  <span v-if="groupSize(job) > 1" class="rec-group-badge">유사 {{ groupSize(job) }}개</span>
                  <JobGateBadges :job-code="job.jobCode" :max="1" />
                  <AppIcon name="ui-chevron-right" class="rec-grp__job-arrow" />
                </button>
              </li>
            </ul>
            <RouterLink v-if="hasMoreJobs(g)" :to="browseTo(g.code)" class="rec-grp__more">
              이 직무의 직업 {{ g.jobCount }}개 모두 보기<AppIcon name="ui-chevron-right" />
            </RouterLink>
          </article>
        </template>
      </section>

      <!-- ── 직업 하나씩 보기 — 종합 추천 목록을 접어 둔다. 순위 숫자·금은동 없이 가까운 순서만.
           직무를 못 받으면(서버 오류·직무 없음) 펼친 채로 보인다(결과지와 같은 규칙) ── -->
      <section v-if="!groupsBusy" class="rec-jobs">
        <button
          v-if="groupMode"
          type="button"
          class="rec-jobs__fold"
          :aria-expanded="jobsOpen"
          aria-controls="rec-jobs-list"
          @click="toggleJobs"
        >
          <span class="rec-jobs__fold-text">
            <b>직업 하나씩 보기</b>
            <small>{{ jobsLoaded && recommendedJobs.length ? `직업 ${recommendedJobs.length}개 · ` : '' }}검사 결과와 가까운 순</small>
          </span>
          <AppIcon name="ui-chevron-down" :class="['rec-jobs__fold-icon', { 'is-open': jobsOpen }]" />
        </button>

        <div v-if="jobsOpen" id="rec-jobs-list">
          <div v-if="isLoading" class="comp-skeleton-list">
            <div v-for="n in 5" :key="n" class="comp-skeleton" />
          </div>
          <p v-else-if="error" class="rec-empty">{{ error }}</p>
          <p v-else-if="recommendedJobs.length === 0" class="rec-empty">추천 직업을 찾지 못했어요.</p>
          <div v-else class="rec-list">
            <RecommendedJobCard
              v-for="job in recommendedJobs"
              :key="job.jobCode"
              :job="job"
              @click="openJob(job)"
            />
          </div>
        </div>

        <!-- 직무 3가지로 닫히지 않게 — 나머지 직무로 가는 길 한 줄(2026-11-26 진로상담 검토 2). 안내 글은 붙이지 않는다 -->
        <RouterLink to="/career-encyclopedia/browse" class="rec-jobs__browse">다른 직무도 둘러보기<AppIcon name="ui-chevron-right" /></RouterLink>
      </section>

    </template>

    <!-- 묶음 직업 선택. 접힌 그룹을 탭하면 어느 세부 직업을 볼지 고른다.
         ⚠️ 이게 없으면 목록에서 누른 이름과 열린 화면 제목이 달라진다. -->
    <JobGroupPicker
      v-model="pickerOpen"
      :group-title="pickerTitle"
      :members="pickerMembers"
      @select="goJob"
    />
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useEncyclopedia } from '../composables/useEncyclopedia'
import { useMyJobGroups, loadMyTarget } from '../composables/useMyJobGroups'
import { REP_JOBS, groupForJob, hasMoreJobs, recHeading, surveyDateLabel, targetCaption, unfoldJob, type TargetLine } from '../lib/myJobGroups'
import { surveySubmittedAt } from '@/modules/survey/lib/latestSurvey'
import { REASON_AXIS, whyParts } from '@/modules/survey/lib/jobGroupWhy'
import { useAuthStore } from '@/shared/stores/auth'
import type { JobGroupJob } from '@/modules/survey/types/survey'
import RecommendedJobCard from '../components/page/home/RecommendedJobCard.vue'
import AppHeader from '@/shared/components/AppHeader.vue'
import JobGroupPicker from '@/shared/components/JobGroupPicker.vue'
import JobGateBadges from '@/shared/components/JobGateBadges.vue'

const router = useRouter()
const auth = useAuthStore()

// ── 직무 3가지 — 메인 카드와 같은 응답(받아 둔 것은 다시 부르지 않는다) ──
const { state, surveyId, groups, load } = useMyJobGroups()
const groupsBusy = computed(() => state.value === 'idle' || state.value === 'loading')
const groupMode = computed(() => state.value === 'ready' && groups.value.length > 0)

// ── 목표 직업 ──
const target = ref<TargetLine | null>(null)
// 목표 직업이 추천 직무 안에 있으면 '다른 길'이 아니다 — 어느 직무에 있는지 밝히고 그 직업 줄에 표시한다(진로상담 검토 1)
const targetGroup = computed(() => (groupMode.value ? groupForJob(groups.value, target.value?.jobCode) : null))
const heading = computed(() => recHeading(!!target.value, groupMode.value, !!targetGroup.value))
const isTargetJob = (job: JobGroupJob) => !!target.value?.jobCode && unfoldJob(job).includes(target.value.jobCode)

// ── 검사 날짜 ──
const dateLabel = ref('')

// ── 직업 하나씩 보기(종합 추천) — 펼칠 때 처음 받는다 ──
const { recommendedJobs, isLoading, error, loadRecommendedJobs } = useEncyclopedia()
const jobsOpen = ref(false)
const jobsLoaded = ref(false)

function loadJobs() {
  if (jobsLoaded.value || !surveyId.value) return
  jobsLoaded.value = true
  loadRecommendedJobs(surveyId.value)
}
function toggleJobs() {
  jobsOpen.value = !jobsOpen.value
  if (jobsOpen.value) loadJobs()
}

// 직무가 정해지면: 못 받았거나 없으면 직업 목록을 펼친 채로 보인다
watch(state, (s) => {
  if (s === 'failed' || (s === 'ready' && !groups.value.length)) {
    jobsOpen.value = true
    loadJobs()
  }
})

// ── 묶음 직업 ─────────────────────────────────────────────────────────────
// 고용24가 여러 직업을 한 직업으로 묶어 조사한 경우(전문의 13종 등) 점수가 **완전히 같아서**
// 서버가 추천 목록을 한 자리로 접어 보낸다(`title` = 그룹명, `members` = 세부 직업).
// 바로 `jobCode` 로 넘기면 **누른 이름과 열린 제목이 달라지므로** 구성원을 고르게 한다.
type WithMembers = { jobCode: string; title: string; members?: { jobCode: string; title: string }[] }

const pickerOpen = ref(false)
const pickerTitle = ref('')
const pickerMembers = ref<{ jobCode: string; title: string }[]>([])

const groupSize = (job: WithMembers) => job.members?.length ?? 1

function openJob(job: WithMembers) {
  if (groupSize(job) > 1) {
    pickerTitle.value = job.title
    pickerMembers.value = job.members ?? []
    pickerOpen.value = true
    return
  }
  goJob(job.jobCode)
}

function goJob(jobCode: string) {
  router.push(`/career-encyclopedia/job/${jobCode}`)
}

const browseTo = (code: string) => ({ path: '/career-encyclopedia/browse', query: { group: code } })

// ── 마운트 ──
onMounted(async () => {
  if (auth.isLoggedIn) loadMyTarget().then((t) => { target.value = t })
  await load()
  if (surveyId.value) dateLabel.value = surveyDateLabel(await surveySubmittedAt(surveyId.value))
})
</script>

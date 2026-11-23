<template>
  <!-- '나의 추천 진로' 카드(2026-11-24 시안 3판, 오너 승인) — 진로백과 메인 검색 바로 아래.
       결과지와 같은 '직무 3가지' + 이유 한 줄. 순위 숫자·금은동·점수·연봉은 보이지 않는다(분류로 찾기와 같은 기준).
       비회원·검사 전에는 같은 자리에서 검사로 보낸다 -->
  <section class="rec-entry" :aria-busy="busy">
    <!-- 목표를 정한 회원: 목표가 먼저, 추천은 '다른 길'로 -->
    <component
      :is="target.jobCode ? 'button' : 'div'"
      v-if="target"
      :type="target.jobCode ? 'button' : undefined"
      class="rec-entry__goal"
      @click="target.jobCode && router.push(`/career-encyclopedia/job/${target.jobCode}`)"
    >
      <span class="rec-entry__goal-icon"><AppIcon name="ui-target" /></span>
      <span class="rec-entry__goal-text">
        <small>내 목표 직업</small>
        <b>{{ target.title }}</b>
      </span>
      <AppIcon v-if="target.jobCode" name="ui-chevron-right" class="rec-entry__goal-arrow" />
    </component>

    <div class="rec-entry__head">
      <span class="rec-entry__chip" aria-hidden="true"><AppIcon name="ui-recommend" /></span>
      <div class="rec-entry__title">
        <h2 class="rec-entry__name">{{ heading }}</h2>
        <!-- 받는 동안은 비워 둔다(한 줄 자리) — 상태가 정해지기 전에 다른 문구가 보였다 바뀌지 않게 -->
        <p class="rec-entry__sub">{{ sub }}</p>
      </div>
      <RouterLink v-if="resultTo" :to="resultTo" class="rec-entry__all">결과에서 보기<AppIcon name="ui-chevron-right" /></RouterLink>
    </div>

    <!-- 받는 동안 세 줄 자리(아래 분류로 찾기가 밀려 내려가지 않게) -->
    <ul v-if="busy" class="rec-entry__list" aria-hidden="true">
      <li v-for="i in 3" :key="i" class="rec-entry__skel" />
    </ul>

    <ul v-else-if="state === 'ready' && groups.length" class="rec-entry__list">
      <li v-for="g in groups" :key="g.code" :class="['rec-entry__item', { 'is-open': openCode === g.code }]">
        <button
          type="button"
          class="rec-entry__row"
          :aria-expanded="openCode === g.code"
          :aria-controls="openCode === g.code ? `rec-entry-jobs-${g.code}` : undefined"
          @click="toggle(g.code)"
        >
          <span class="rec-entry__dot" aria-hidden="true" />
          <span class="rec-entry__grp">
            <b class="rec-entry__grp-name">{{ g.name }}</b>
            <!-- 결과지와 같은 문장(jobGroupWhy). ⚠️ 한 줄로 둔다 — 줄을 바꾸면 핵심어와 조사 사이에 공백이 생긴다 -->
            <span v-if="g.reasons.length" class="rec-entry__why"><template v-for="(seg, k) in whyParts(g)" :key="k"><template v-if="seg.kw"><b class="rec-entry__kw">{{ seg.kw.name }}</b><span class="rec-entry__ax">({{ REASON_AXIS[seg.kw.axis] }})</span></template><template v-else>{{ seg.text }}</template></template></span>
          </span>
          <AppIcon name="ui-chevron-down" :class="['rec-entry__fold', { 'is-open': openCode === g.code }]" />
        </button>
        <div v-if="openCode === g.code" :id="`rec-entry-jobs-${g.code}`" class="rec-entry__jobs">
          <p class="rec-entry__jobs-label">대표 직업</p>
          <ul class="rec-entry__jobs-list">
            <li v-for="job in g.jobs.slice(0, REP_JOBS)" :key="job.jobCode">
              <button type="button" class="rec-entry__job" @click="openJob(job)">
                <span class="rec-entry__job-t">{{ job.title }}</span>
                <span v-if="(job.members?.length ?? 1) > 1" class="rec-entry__sim">유사 {{ job.members!.length }}개</span>
                <AppIcon name="ui-chevron-right" class="rec-entry__job-arrow" />
              </button>
            </li>
          </ul>
          <RouterLink v-if="hasMoreJobs(g)" :to="browseTo(g.code)" class="rec-entry__more">
            이 직무의 직업 {{ g.jobCount }}개 모두 보기<AppIcon name="ui-chevron-right" />
          </RouterLink>
        </div>
      </li>
    </ul>

    <!-- 비회원·검사 전 — 같은 자리에서 검사로 -->
    <template v-else-if="state === 'guest' || state === 'noSurvey'">
      <RouterLink :to="state === 'guest' ? '/start' : '/self-understanding'" class="rec-entry__cta">자기이해 검사 시작하기</RouterLink>
      <p class="rec-entry__time">{{ state === 'guest' ? '가입 없이 · 약 20분' : '3개 파트 · 약 20분' }}</p>
      <p v-if="state === 'guest'" class="rec-entry__login">이미 회원이에요 · <RouterLink to="/onboarding/auth">로그인</RouterLink></p>
    </template>
    <!-- 못 받음 — 머리와 '결과에서 보기'만 남긴다 -->

    <JobGroupPicker v-model="pickerOpen" :group-title="pickerTitle" :members="pickerMembers" @select="goJob" />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import JobGroupPicker from '@/shared/components/JobGroupPicker.vue'
import { useAuthStore } from '@/shared/stores/auth'
import { REASON_AXIS, whyParts } from '@/modules/survey/lib/jobGroupWhy'
import type { JobGroupJob } from '@/modules/survey/types/survey'
import { useMyJobGroups, loadMyTarget } from '../../../composables/useMyJobGroups'
import { REP_JOBS, hasMoreJobs, type TargetLine } from '../../../lib/myJobGroups'

const router = useRouter()
const auth = useAuthStore()
const { state, surveyId, groups, load } = useMyJobGroups()

// 목표 진로 — 직업이면 직업 상세로, 직접 적은 목표(custom)는 이름만. 계정마다 한 번 받아 둔다(useMyJobGroups)
const target = ref<TargetLine | null>(null)
const targetDone = ref(!auth.isLoggedIn)

async function loadTarget() {
  target.value = await loadMyTarget()
  targetDone.value = true
}

// 받는 중 — 목표 줄은 받는 대로 바로 그린다(목표는 빨리 오고 계정마다 담아 두니, 직무가 올 때 아래가 또 밀리지 않게).
// 직무 자리는 세 줄 자리(실제 줄과 같은 높이)로 잡는다
const busy = computed(() => state.value === 'idle' || state.value === 'loading' || !targetDone.value)

const heading = computed(() => {
  if (state.value === 'guest') return '나와 가까운 직업 찾기'
  // 목표가 있으면 추천은 대안으로 이름 붙인다(직무를 보여 줄 때만 — 검사 전 안내는 그대로)
  return target.value && state.value === 'ready' && groups.value.length ? '다른 길도 살펴보기' : '나의 추천 진로'
})
const sub = computed(() => {
  if (busy.value) return ''
  if (state.value === 'guest') return '먼저 나를 알아봐요. 가입하면 결과와 가까운 직무까지 볼 수 있어요'
  if (state.value === 'noSurvey') return '먼저 나를 알아보고, 결과와 가까운 직무도 함께 살펴봐요'
  return '검사 결과와 가까운 직무예요'
})
// 내 최근 결과지의 '나에게 맞는 직무 3가지' 구역으로 바로(결과지가 ?at=groups 를 보고 내려간다)
const resultTo = computed(() => (surveyId.value && state.value !== 'loading' ? { path: `/self-understanding/result/${surveyId.value}`, query: { at: 'groups' } } : null))

const browseTo = (code: string) => ({ path: '/career-encyclopedia/browse', query: { group: code } })

const openCode = ref<string | null>(null)
function toggle(code: string) {
  openCode.value = openCode.value === code ? null : code
}

// 묶음 직업 — 누른 이름과 열린 화면 제목이 달라지지 않게 고르게 한다(결과지·추천 목록과 같다)
const pickerOpen = ref(false)
const pickerTitle = ref('')
const pickerMembers = ref<{ jobCode: string; title: string }[]>([])
function openJob(job: JobGroupJob) {
  if ((job.members?.length ?? 1) > 1) {
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

onMounted(() => {
  load()
  if (auth.isLoggedIn) loadTarget()
})
</script>

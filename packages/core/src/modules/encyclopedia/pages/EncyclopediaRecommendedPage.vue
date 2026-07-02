<template>
  <div class="rec-page">

    <!-- 공용 헤더 -->
    <AppHeader />

    <!-- survey ID 없음 -->
    <div v-if="noSurvey" class="rec-no-survey">
      <div class="rec-no-survey__icon">📋</div>
      <p class="rec-no-survey__title">검사 결과가 없어요</p>
      <p class="rec-no-survey__desc">자기이해 검사를 완료하면<br>나만을 위한 진로를 추천해드려요</p>
      <button class="rec-no-survey__cta" @click="$router.push('/self-understanding')">
        자기이해 검사 시작하기
      </button>
    </div>

    <template v-else>

      <!-- 히어로 헤더 -->
      <div class="rec-hero">
        <p class="rec-hero__label">✦ AI 맞춤 추천</p>
        <h2 class="rec-hero__title">나의 추천 진로</h2>
        <p class="rec-hero__sub">자기이해 검사 결과를 바탕으로<br>나에게 딱 맞는 직업을 추천했어요</p>
      </div>

      <!-- ── 섹션 1: 재능/흥미/가치관 추천직업 ── -->
      <section class="rec-section">
        <div class="rec-section__header">
          <h3 class="rec-section__title">재능 · 흥미 · 가치관 추천직업</h3>
          <span class="rec-section__badge rec-section__badge--blue">T2 기반</span>
        </div>
        <p class="rec-section__desc">나의 재능·흥미·가치관을 종합적으로 분석한 추천이에요</p>

        <div v-if="t2Loading" class="rec-t2rec-skeleton-list">
          <div v-for="n in 3" :key="n" class="rec-t2rec-skeleton" />
        </div>

        <p v-else-if="t2Error" class="rec-empty">데이터를 불러오지 못했습니다.</p>
        <p v-else-if="t2Jobs.length === 0" class="rec-empty">추천 직업을 찾을 수 없습니다.</p>

        <div v-else class="rec-t2rec-list">
          <div
            v-for="job in t2Jobs"
            :key="job.jobCode"
            class="rec-t2rec-card"
            @click="router.push(`/career-encyclopedia/job/${job.jobCode}`)"
          >
            <div class="rec-t2rec-card-top">
              <span class="rec-t2rec-title">{{ job.title }}</span>
              <span class="rec-t2rec-score">{{ Math.round(job.t2_match_score * 100) }}%</span>
            </div>
            <p class="rec-t2rec-class">{{ job.classification.primary }} › {{ job.classification.secondary }}</p>
            <p v-if="t2LabelInterest || t2LabelTalent || t2LabelValue" class="rec-t2rec-label">
              <span v-if="t2LabelInterest" class="rec-t2rec-pill rec-t2rec-pill--interest">{{ t2LabelInterest }}</span>
              <template v-if="t2LabelInterest"> 분야에서<br></template>
              <span v-if="t2LabelTalent" class="rec-t2rec-pill rec-t2rec-pill--talent">{{ t2LabelTalent }}</span>
              <template v-if="t2LabelTalent">하며<br></template>
              <span v-if="t2LabelValue" class="rec-t2rec-pill rec-t2rec-pill--value">{{ t2LabelValue }}</span>
              <template v-if="t2LabelValue">을 추구하는 일</template>
            </p>
            <p class="rec-t2rec-meta">
              <span v-if="job.salary?.median">급여 {{ job.salary.median.toLocaleString() }}만원</span>
              <span v-if="job.salary?.median && job.jobSatisfaction"> · </span>
              <span v-if="job.jobSatisfaction">만족도 {{ job.jobSatisfaction }}%</span>
            </p>
          </div>
        </div>
      </section>

      <!-- ── 섹션 2: 라이트하우스 종합 추천직업 ── -->
      <section class="rec-section rec-section--comprehensive">
        <div class="rec-section__header">
          <h3 class="rec-section__title">라이트하우스 종합 추천직업</h3>
          <span v-if="!isLoading && recommendedJobs.length" class="rec-section__badge rec-section__badge--green">
            {{ recommendedJobs.length }}개
          </span>
        </div>
        <p class="rec-section__desc">성격·환경까지 고려한 라이트하우스만의 종합 추천이에요</p>

        <div v-if="isLoading" class="comp-skeleton-list">
          <div v-for="n in 5" :key="n" class="comp-skeleton" />
        </div>
        <p v-else-if="error" class="rec-empty">{{ error }}</p>
        <p v-else-if="recommendedJobs.length === 0" class="rec-empty">추천 직업을 찾을 수 없습니다.</p>

        <div v-else class="rec-list">
          <RecommendedJobCard
            v-for="(job, i) in recommendedJobs"
            :key="job.jobCode"
            :job="job"
            :rank="i + 1"
            @click="router.push(`/career-encyclopedia/job/${job.jobCode}`)"
          />
        </div>
      </section>

    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEncyclopedia } from '../composables/useEncyclopedia'
import { fetchUserSurveyResults } from '../encyclopedia.api'
import { fetchT2Recommend, fetchSurveyAnalysis } from '@/modules/survey/survey.api'
import type { T2RecommendJob, SurveyAnalysisResponse } from '@/modules/survey/types/survey'
import RecommendedJobCard from '../components/page/home/RecommendedJobCard.vue'
import AppHeader from '@/shared/components/AppHeader.vue'

const router = useRouter()
const { recommendedJobs, isLoading, error, loadRecommendedJobs } = useEncyclopedia()

// ── survey ID 해결 ──
const noSurvey = ref(false)

async function resolveSurveyId(): Promise<string> {
  const cached = sessionStorage.getItem('lh_survey_id')
  if (cached) return cached
  try {
    const { data } = await fetchUserSurveyResults()
    if (data.success && data.surveyResults.length > 0) {
      const sorted = [...data.surveyResults].sort(
        (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      )
      return sorted[0]!.survey_id
    }
  } catch { /* 비로그인 시 무시 */ }
  return ''
}

// ── T2 추천 ──
const t2Jobs = ref<T2RecommendJob[]>([])
const t2Loading = ref(false)
const t2Error = ref(false)
const analysis = ref<SurveyAnalysisResponse['analysis'] | null>(null)

const T21_LABEL: Record<string, string> = {
  L: '읽고 쓰고 말',
  M: '논리적으로 분석하고 설계',
  S: '시각적으로 구성하고 표현',
  A: '소리와 리듬으로 창작',
  B: '직접 몸으로 만들고 행동',
  I: '사람을 이해하고 소통',
  N: '깊이 사유하고 성찰',
  T: '자연을 관찰하고 탐구',
}

const T23_TO_VA: Record<string, string> = {
  T23_1: 'VA10', T23_2: 'VA11', T23_3: 'VA04',
  T23_4: 'VA01', T23_5: 'VA06', T23_6: 'VA09',
  T23_7: 'VA05', T23_8: 'VA12', T23_9: 'VA07',
  T23_10: 'VA08', T23_11: 'VA03', T23_12: 'VA13',
  T23_13: 'VA02',
}

const T23_LABEL: Record<string, string> = {
  VA01: '목표를 달성하는 것', VA02: '나만의 방식으로 일하는 것',
  VA03: '다양한 경험을 쌓는 것', VA04: '끊임없이 배우고 성장하는 것',
  VA05: '충분한 경제적 보상을 얻는 것', VA06: '주변에 영향을 미치는 것',
  VA07: '스스로 결정하며 일하는 것', VA08: '더 큰 목표에 기여하는 것',
  VA09: '타인에게 인정받는 것', VA10: '타인에게 도움이 되는 것',
  VA11: '안정적으로 오래 일하는 것', VA12: '여유롭고 균형 잡힌 삶을 사는 것',
  VA13: '몸을 활발히 움직이는 것',
}

const t2LabelInterest = computed(() => {
  const cats = analysis.value?.interest.by_category
  if (!cats) return ''
  const firstCat = Object.values(cats)[0]
  return firstCat?.items[0]?.name ?? ''
})

const t2LabelTalent = computed(() => {
  const code = analysis.value?.talent.top3[0]?.code
  return code ? (T21_LABEL[code] ?? '') : ''
})

const t2LabelValue = computed(() => {
  const code = analysis.value?.values.priority_1?.code
  if (!code) return ''
  const vaCode = T23_TO_VA[code]
  return vaCode ? (T23_LABEL[vaCode] ?? '') : ''
})

// ── 마운트 ──
onMounted(async () => {
  const surveyId = await resolveSurveyId()
  if (!surveyId) {
    noSurvey.value = true
    return
  }

  t2Loading.value = true
  Promise.all([
    fetchT2Recommend(surveyId),
    fetchSurveyAnalysis(surveyId),
  ]).then(([t2Res, anaRes]) => {
    if (t2Res.data.success) t2Jobs.value = t2Res.data.data
    else t2Error.value = true
    if (anaRes.data.success) analysis.value = anaRes.data.analysis
  }).catch(() => {
    t2Error.value = true
  }).finally(() => {
    t2Loading.value = false
  })

  loadRecommendedJobs(surveyId)
})
</script>

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

        <div v-if="t2Loading" class="t2rec-skeleton-list">
          <div v-for="n in 3" :key="n" class="t2rec-skeleton" />
        </div>

        <p v-else-if="t2Error" class="rec-empty">데이터를 불러오지 못했습니다.</p>
        <p v-else-if="t2Jobs.length === 0" class="rec-empty">추천 직업을 찾을 수 없습니다.</p>

        <div v-else class="t2rec-list">
          <div
            v-for="job in t2Jobs"
            :key="job.jobCode"
            class="t2rec-card"
            @click="router.push(`/career-encyclopedia/job/${job.jobCode}`)"
          >
            <div class="t2rec-card-top">
              <span class="t2rec-title">{{ job.title }}</span>
              <span class="t2rec-score">{{ Math.round(job.t2_match_score * 100) }}%</span>
            </div>
            <p class="t2rec-class">{{ job.classification.primary }} › {{ job.classification.secondary }}</p>
            <p v-if="t2LabelInterest || t2LabelTalent || t2LabelValue" class="t2rec-label">
              <span v-if="t2LabelInterest" class="t2rec-pill t2rec-pill--interest">{{ t2LabelInterest }}</span>
              <template v-if="t2LabelInterest"> 분야에서<br></template>
              <span v-if="t2LabelTalent" class="t2rec-pill t2rec-pill--talent">{{ t2LabelTalent }}</span>
              <template v-if="t2LabelTalent">하며<br></template>
              <span v-if="t2LabelValue" class="t2rec-pill t2rec-pill--value">{{ t2LabelValue }}</span>
              <template v-if="t2LabelValue">을 추구하는 일</template>
            </p>
            <p class="t2rec-meta">
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

<style scoped>
.rec-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F4F4F0;
  padding-bottom: 40px;
}

/* ── 검사 없음 상태 ── */
.rec-no-survey {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px 32px 40px;
  text-align: center;
}

.rec-no-survey__icon {
  font-size: 48px;
  margin-bottom: 4px;
}

.rec-no-survey__title {
  font-size: 18px;
  font-weight: 700;
  color: #222;
  margin: 0;
}

.rec-no-survey__desc {
  font-size: 14px;
  color: #888;
  line-height: 1.7;
  margin: 0;
}

.rec-no-survey__cta {
  margin-top: 8px;
  padding: 14px 28px;
  background: #4A6CF7;
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: -0.2px;
}

/* ── 히어로 헤더 ── */
.rec-hero {
  padding: 28px 22px 24px;
  background: linear-gradient(145deg, #EEF2FF 0%, #F0F4FF 60%, #EAF5FF 100%);
  border-bottom: 1px solid #E0E8FF;
}

.rec-hero__label {
  font-size: 12px;
  font-weight: 700;
  color: #6366F1;
  letter-spacing: 0.3px;
  margin: 0 0 8px;
}

.rec-hero__title {
  font-size: 24px;
  font-weight: 800;
  color: #1A1A2E;
  margin: 0 0 8px;
  letter-spacing: -0.5px;
}

.rec-hero__sub {
  font-size: 13.5px;
  color: #5A5A7A;
  line-height: 1.7;
  margin: 0;
}

/* ── 섹션 공통 ── */
.rec-section {
  padding: 24px 0 4px;
}

.rec-section__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px;
  margin-bottom: 4px;
}

.rec-section__title {
  font-size: 16px;
  font-weight: 800;
  color: #1A1A2E;
  margin: 0;
  letter-spacing: -0.3px;
}

.rec-section__badge {
  font-size: 10.5px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
}

.rec-section__badge--blue {
  background: #EEF2FF;
  color: #4F46E5;
}

.rec-section__badge--green {
  background: #ECFDF5;
  color: #059669;
}

.rec-section__desc {
  font-size: 12.5px;
  color: #888;
  margin: 0 0 14px;
  padding: 0 20px;
  line-height: 1.5;
}

/* ── 종합 추천 섹션 ── */
.rec-section--comprehensive {
  margin: 0 0 8px;
}

.rec-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0 16px;
}

/* ── 공통 빈 상태 ── */
.rec-empty {
  font-size: 13px;
  color: #aaa;
  text-align: center;
  padding: 24px 0;
  margin: 0;
}

/* ── T2 카드 ── */
.t2rec-list {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 4px 20px 12px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.t2rec-list::-webkit-scrollbar { display: none; }

.t2rec-card {
  flex-shrink: 0;
  width: 210px;
  background: #fff;
  border: 1px solid #E8E8EC;
  border-radius: 16px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  cursor: pointer;
  transition: box-shadow 0.15s, transform 0.1s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.t2rec-card:active {
  transform: scale(0.98);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.09);
}

.t2rec-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 6px;
}

.t2rec-title {
  font-size: 15px;
  font-weight: 700;
  color: #111;
  line-height: 1.3;
}

.t2rec-score {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #4F46E5, #6366F1);
  padding: 2px 7px;
  border-radius: 20px;
}

.t2rec-class {
  font-size: 11.5px;
  color: #999;
  margin: 0;
}

.t2rec-label {
  font-size: 12px;
  color: #555;
  line-height: 2;
  margin: 4px 0 0;
}

.t2rec-pill {
  display: inline-block;
  padding: 0.1rem 0.45rem;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
  vertical-align: middle;
  border: 1px solid transparent;
}

.t2rec-pill--interest { background: #E8F6F6; color: #2E8585; border-color: #B8E0E0; }
.t2rec-pill--talent   { background: #EBF2FF; color: #3D7FE8; border-color: #B8CFFF; }
.t2rec-pill--value    { background: #F3EEFF; color: #7C50CC; border-color: #CEB8F5; }

.t2rec-meta {
  font-size: 11.5px;
  color: #999;
  margin: 0;
  margin-top: auto;
  padding-top: 8px;
  border-top: 1px solid #F0F0EC;
}

/* ── T2 스켈레톤 ── */
.t2rec-skeleton-list {
  display: flex;
  gap: 10px;
  padding: 4px 20px 12px;
  overflow: hidden;
}

.t2rec-skeleton {
  flex-shrink: 0;
  width: 210px;
  height: 160px;
  background: linear-gradient(90deg, #ebebeb 25%, #e0e0e0 50%, #ebebeb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 16px;
}

/* ── 종합 추천 스켈레톤 ── */
.comp-skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 16px;
}

.comp-skeleton {
  width: 100%;
  height: 76px;
  background: linear-gradient(90deg, #ebebeb 25%, #e0e0e0 50%, #ebebeb 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 16px;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>

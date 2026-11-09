<template>
  <!-- 결과 내보내기는 이 상자를 **통째로** 찍는다. 결과지 내부는 모른다(export/useResultExport 참조) -->
  <div ref="exportEl" :class="['result-export', { 'is-capturing': capturing }]">
    <div v-if="capturing" class="result-export__head">
      <img :src="logo" alt="라이트하우스" />
      <span>자기이해 검사 결과 · {{ exportDate }} <b data-export-pageno /></span>
    </div>

    <SurveyResultBody
      ref="bodyRef"
      :survey-id="surveyId"
      @job-click="goEncyclopedia"
      @group-recruit="goGroupRecruit"
      @ready="(ok, label) => { resultReady = ok; resultLabel = label ?? null }"
    >
      <!-- 일반 검사 흐름: 결과 저장/이어가기 CTA. 찍을 때는 뺀다(화면에서만 쓰는 버튼) -->
      <section v-if="!capturing" class="m-sec result-cta-section" data-export-skip>
        <!-- 비로그인: 가입 유도 -->
        <template v-if="!authStore.isLoggedIn">
          <h2 class="result-cta-title">결과를 저장하고<br>진로를 이어가보세요</h2>
          <p class="result-cta-sub">가입하면 이 결과가 저장되고,<br>맞춤 진로를 계속 탐색할 수 있어요.</p>
          <button class="btn-signup-cta" @click="showSignUp = true">
            회원가입하고 더 진행하기
          </button>
        </template>

        <!-- 로그인: 마이페이지로 · 내보내기(이미지·PDF — 랜딩 /survey 결과 내보내기와 같다) -->
        <template v-else>
          <h2 class="result-cta-title">결과가 저장됐어요</h2>
          <p class="result-cta-sub">마이페이지에서 내 검사 결과를 언제든 다시 볼 수 있어요.</p>
          <RouterLink to="/mypage" class="btn-mypage-back">마이페이지로 돌아가기</RouterLink>
          <button type="button" class="btn-export" :disabled="!resultReady" @click="exportOpen = true">
            내보내기
          </button>
        </template>
      </section>
    </SurveyResultBody>

    <p v-if="capturing" class="result-export__foot">www.lighthouse.career</p>
  </div>

  <ExportSheet
    :open="exportOpen"
    :make-image="makeResultImage"
    :make-images="makeResultImages"
    :make-pdf="makeResultPdf"
    :label="resultLabel"
    @close="exportOpen = false"
  />

  <!-- PDF 결과지는 화면 밖에 잠깐 그렸다가 찍고 지운다(report/ResultReport.vue) -->
  <div v-if="reportData" ref="reportHost" class="result-report-host" aria-hidden="true">
    <ResultReport :data="reportData" />
  </div>

  <SignUpModal v-model="showSignUp" @registered="onRegistered" />
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'
import { linkSurveyToUser } from '../survey.api'
import { fetchUserSurveyResults } from '@/modules/encyclopedia/encyclopedia.api'
import SurveyResultBody from '../components/SurveyResultBody.vue'
import SignUpModal from '../components/SignUpModal.vue'
import ExportSheet from '../export/ExportSheet.vue'
import ResultReport from '../report/ResultReport.vue'
import { buildPdfFromPages, captureImage, captureImageSet, type Capture } from '../export/useResultExport'
import { findPageOverflow } from '../report/reportUtil'
import type { ResearchResultData } from '../report/reportData'
import logo from '@/assets/report/logo_header.png'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const surveyId = route.params.survey_id as string

const showSignUp = ref(false)

function goEncyclopedia(jobCode: string) {
  router.push(`/career-encyclopedia/job/${jobCode}`)
}

// 직무 카드의 '채용 공고' — 직무 단위 공고 화면(진로백과 채용 탭과 같은 목록)
function goGroupRecruit(code: string) {
  router.push(`/career-encyclopedia/group/${code}/recruitment`)
}

async function onRegistered(token: string, user: any) {
  authStore.setAuth(token, user)
  await linkSurveyToUser(surveyId).catch(() => {})
  router.push('/')
}

// ── 결과 내보내기 (랜딩 pages/survey.vue 와 같은 흐름) ──
const exportEl = ref<HTMLElement | null>(null)
const bodyRef = ref<InstanceType<typeof SurveyResultBody> | null>(null)
const exportOpen = ref(false)
const resultReady = ref(false)
const resultLabel = ref<string | null>(null)   // 파일 이름용 성격 유형(없어도 된다)
const capturing = ref(false)
const exportDate = ref('')

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// 찍는 동안만 머리말(로고·날짜·장 번호)·꼬리말을 붙이고 하단 버튼을 뺀다 — 화면에는 없는 것이라 결과지 컴포넌트에 넣지 않는다
async function withCapture<T>(fn: (el: HTMLElement) => Promise<T>): Promise<T> {
  exportDate.value = today()
  capturing.value = true
  await nextTick()
  try {
    if (!exportEl.value) throw new Error('no result')
    return await fn(exportEl.value)
  } finally {
    capturing.value = false
  }
}
const makeResultImages = () => withCapture((el) => captureImageSet(el))
const makeResultImage = (): Promise<Capture> => withCapture((el) => captureImage(el))

const reportHost = ref<HTMLElement | null>(null)
const reportData = ref<ResearchResultData | null>(null)

// 검사일 = 제출 시각. 분석 API 는 날짜를 주지 않아 내 검사 목록에서 찾는다(없으면 날짜 칸을 숨긴다)
async function surveyDate(): Promise<string | undefined> {
  try {
    const { data } = await fetchUserSurveyResults()
    return data.surveyResults?.find((r) => r.survey_id === surveyId)?.submitted_at
  } catch {
    return undefined
  }
}

// PDF — 화면 결과지가 아니라 PDF 전용 양식을 그려서 쪽마다 찍는다. 데이터는 화면이 이미 받은 응답을 쓴다
async function makeResultPdf() {
  const src = bodyRef.value?.reportSource()
  if (!src?.analysis) throw new Error('no result')
  reportData.value = {
    respondent_id: surveyId,
    completed_at: await surveyDate(),
    analysis: src.analysis,
    recommend: src.recommend,
    groups: src.groups,
    currentJob: null,
  }
  await nextTick()
  try {
    const pages = Array.from(reportHost.value?.querySelectorAll<HTMLElement>('.rp-page') ?? [])
    // 양식을 고치다 쪽을 넘기면 PDF 에서 잘린다 — 만들 때마다 확인해 콘솔에 남긴다
    for (const o of findPageOverflow(pages)) console.warn(`[PDF 결과지] ${o.page}쪽 내용이 ${o.px}px 넘칩니다 — ResultReport.vue PAGES 에서 구역을 옮기세요`)
    return await buildPdfFromPages(pages)
  } finally {
    reportData.value = null
  }
}
</script>

<style scoped>
.result-export.is-capturing {
  padding: 20px 16px 16px;
  background: #fafaf8;
}
.result-export__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #5f6670;
}
.result-export__head img { height: 22px; display: block; }
.result-export__head [data-export-pageno] { margin-left: 6px; font-weight: 700; color: #1a1a1a; }
.result-export__foot {
  margin: 14px 0 0;
  font-size: 0.75rem;
  color: #767676;
  text-align: center;
}

.result-report-host {
  position: fixed;
  left: -10000px;
  top: 0;
  pointer-events: none;
}
</style>

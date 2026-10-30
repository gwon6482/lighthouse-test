<template>
  <!-- 진로정보(하단 탭, 2026-10-29 기획회의) — 다양한 검사 · 진로백과 바로가기 · 진로·채용 소식 -->
  <div class="ci">
    <header class="ci-hero">
      <h1 class="ci-hero__title">진로정보</h1>
      <p class="ci-hero__sub">나를 알아보고, 직업을 찾아보고, 소식을 받아 보세요</p>
      <!-- 진로백과 검색 — 결과는 진로백과 화면에서(검색 상태를 함께 쓴다) -->
      <form class="ci-search" role="search" @submit.prevent="search">
        <AppIcon name="ui-search" class="ci-search__icon" />
        <input v-model="query" class="ci-search__input" type="search" placeholder="궁금한 직업을 검색해 보세요" aria-label="직업 검색">
        <button type="submit" class="ci-search__btn">검색</button>
      </form>
    </header>

    <!-- 검사 -->
    <section class="ci-sec">
      <h2 class="ci-sec__title">검사</h2>
      <div class="ci-test">
        <div class="ci-test__head">
          <span class="ci-test__chip"><AppIcon name="service-test" /></span>
          <div class="ci-test__who">
            <strong>자기이해 검사</strong>
            <span v-if="latest?.T1_result?.full_name">최근 결과 · {{ latest.T1_result.full_name }}</span>
            <span v-else>약 10분 · 무료</span>
          </div>
        </div>
        <ul class="ci-test__areas">
          <li v-for="a in AREAS" :key="a.name"><AppIcon :name="a.icon" /> {{ a.name }}</li>
        </ul>
        <div class="ci-test__actions">
          <button v-if="latest" type="button" class="ci-btn ci-btn--ghost" @click="router.push(`/self-understanding/result/${latest.survey_id}`)">
            내 결과 보기
          </button>
          <button type="button" class="ci-btn" @click="router.push('/self-understanding/intro')">{{ latest ? '다시 검사하기' : '검사 시작하기' }}</button>
        </div>
      </div>
      <p class="ci-note"><AppIcon name="ui-coming-soon" /> 다른 검사도 준비하고 있어요.</p>
    </section>

    <!-- 진로백과 바로가기 -->
    <section class="ci-sec">
      <h2 class="ci-sec__title">진로백과</h2>
      <div class="ci-links">
        <button v-if="targetJob" type="button" class="ci-link ci-link--yellow" @click="openTargetJob">
          <AppIcon name="ui-target" class="ci-link__icon" />
          <span class="ci-link__text"><strong>{{ targetJob }}</strong><small>내 목표 직업</small></span>
        </button>
        <button type="button" class="ci-link ci-link--green" @click="router.push('/career-encyclopedia/recommended')">
          <AppIcon name="ui-recommend" class="ci-link__icon" />
          <span class="ci-link__text"><strong>나에게 맞는 직업</strong><small>검사 결과 추천</small></span>
        </button>
        <button type="button" class="ci-link ci-link--blue" @click="router.push('/career-encyclopedia')">
          <AppIcon name="service-encyclopedia" class="ci-link__icon" />
          <span class="ci-link__text"><strong>전체 직업 둘러보기</strong><small>537개 직업</small></span>
        </button>
      </div>
    </section>

    <!-- 채용 소식 — 목표 직업의 고용24 채용정보(진로백과 '채용' 탭과 같은 API) -->
    <section v-if="targetJob" class="ci-sec">
      <div class="ci-sec__head">
        <h2 class="ci-sec__title">채용 소식 <small>{{ targetJob }}</small></h2>
        <button v-if="jobCode" type="button" class="ci-sec__more" @click="router.push(`/career-encyclopedia/job/${jobCode}`)">더 보기 <AppIcon name="ui-chevron-right" /></button>
      </div>
      <p v-if="loadingJobs" class="ci-empty">불러오는 중...</p>
      <p v-else-if="!postings.length" class="ci-empty">지금 올라온 채용 공고가 없어요.</p>
      <ul v-else class="ci-posts">
        <li v-for="post in postings" :key="post.id">
          <a class="ci-post" :href="post.url" target="_blank" rel="noopener noreferrer">
            <span class="ci-post__company">{{ post.company }}</span>
            <span class="ci-post__title">{{ post.title }}</span>
            <span class="ci-post__meta">{{ [post.region, post.career, post.deadline.label].filter(Boolean).join(' · ') }}</span>
          </a>
        </li>
      </ul>
      <p class="ci-source">출처: 고용24</p>
    </section>

    <!-- 진로 뉴스 — 진로엔뉴스(API 가 RSS 를 받아 둔다). 제목·날짜·출처만, 누르면 원문(저작권상 썸네일·요약은 쓰지 않는다) -->
    <section class="ci-sec">
      <div class="ci-sec__head">
        <h2 class="ci-sec__title">진로 뉴스</h2>
        <a v-if="news.length" class="ci-sec__more" :href="newsSource.url" target="_blank" rel="noopener">더 보기 <AppIcon name="ui-chevron-right" /></a>
      </div>
      <p v-if="loadingNews" class="ci-empty">불러오는 중...</p>
      <p v-else-if="!news.length" class="ci-empty">뉴스를 불러오지 못했어요.</p>
      <ul v-else class="ci-news">
        <li v-for="n in news" :key="n.url">
          <a class="ci-news__item" :href="n.url" target="_blank" rel="noopener noreferrer">
            <span class="ci-news__title">{{ n.title }}</span>
            <span class="ci-news__meta">{{ n.source }} · {{ newsDate(n.publishedAt) }}</span>
          </a>
        </li>
      </ul>
      <p v-if="news.length" class="ci-source">출처: {{ newsSource.name }} — 기사를 누르면 원문으로 이동해요</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import { req } from '@/shared/api'
import { useAchievementStore } from '@/shared/stores/achievement'
import { useEncyclopedia } from '../composables/useEncyclopedia'
import { searchJobs, fetchJobRecruitments, fetchCareerNews, type CareerNewsItem } from '../encyclopedia.api'
import type { RecruitmentPosting } from '../types/encyclopedia'
import { AREA_ICON } from '@/modules/survey/surveyIcons'

const router = useRouter()
const store = useAchievementStore()
const { searchJob } = useEncyclopedia()

const AREAS = [
  { name: '성격', icon: AREA_ICON.personality },
  { name: '재능', icon: 'result-talent' },
  { name: '흥미', icon: 'result-interest' },
  { name: '가치관', icon: 'result-values' },
  { name: '업무환경', icon: AREA_ICON.environment },
]

const query = ref('')
async function search() {
  const q = query.value.trim()
  if (!q) return
  await searchJob(q)
  router.push('/career-encyclopedia')
}

// 최근 검사 결과
const latest = ref<any | null>(null)

// 목표 직업 — 진행 중 계획의 targetJob. 직업 코드는 이름 검색으로 찾는다(같은 이름이 먼저)
const targetJob = computed(() => store.plan?.targetJob?.trim() ?? '')
const jobCode = ref('')
const postings = ref<RecruitmentPosting[]>([])
const loadingJobs = ref(false)
async function loadTargetJob() {
  jobCode.value = ''
  postings.value = []
  if (!targetJob.value) return
  loadingJobs.value = true
  try {
    const { data } = await searchJobs(targetJob.value)
    const hit = data.data.find((j) => j.title === targetJob.value) ?? data.data[0]
    if (!hit) return
    jobCode.value = hit.jobCode
    const rec = await fetchJobRecruitments(hit.jobCode, 3)
    postings.value = rec.data.data.postings.slice(0, 3)
  } catch { /* 소식은 없어도 화면은 된다 */ } finally {
    loadingJobs.value = false
  }
}
function openTargetJob() {
  if (jobCode.value) router.push(`/career-encyclopedia/job/${jobCode.value}`)
  else { query.value = targetJob.value; search() }
}

// 진로 뉴스
const news = ref<CareerNewsItem[]>([])
const newsSource = ref({ name: '진로엔뉴스', url: 'https://www.jinron.kr' })
const loadingNews = ref(true)
async function loadNews() {
  try {
    const { data } = await fetchCareerNews(5)
    news.value = data.data.items
    newsSource.value = data.data.source
  } catch { /* 뉴스는 없어도 화면은 된다 */ } finally {
    loadingNews.value = false
  }
}
const newsDate = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

onMounted(async () => {
  loadNews()
  const [surveys] = await Promise.allSettled([req.get('/api/user/survey-results'), store.loadActivePlan()])
  // 가장 최근 검사 — 서버는 오래된 순으로 준다
  if (surveys.status === 'fulfilled') latest.value = [...(surveys.value.data.surveyResults ?? [])].sort((a: any, b: any) => String(b.submitted_at).localeCompare(String(a.submitted_at)))[0] ?? null
})
// 목표 직업은 계획을 다 읽어야 생긴다 — 채워지는(바뀌는) 때에 맞춰 채용을 불러온다
watch(targetJob, loadTargetJob, { immediate: true })
</script>

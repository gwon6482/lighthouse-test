<template>
  <div class="recruit-tab">
    <section class="recruit-section">
      <div class="recruit-section__head">
        <h3 class="recruit-section__title">채용공고<template v-if="postings.length"> ({{ postings.length }})</template></h3>
        <p v-if="postings.length" class="recruit-section__desc">최근 올라온 공고예요. 누르면 공고 원문으로 이동해요.</p>
      </div>

      <div v-if="isLoading" class="recruit-empty">불러오는 중...</div>

      <div v-else-if="error" class="recruit-empty recruit-empty--error">
        {{ error }}
        <button type="button" class="recruit-retry" @click="load">다시 시도</button>
      </div>

      <div v-else-if="postings.length === 0" class="recruit-empty">
        지금 이 직업으로 올라온 공고가 없어요.
      </div>

      <ul v-else class="recruit-list">
        <li v-for="post in postings" :key="post.id">
          <a class="recruit-card" :href="post.mobileUrl || post.url" target="_blank" rel="noopener noreferrer">
            <!-- 헤더: 회사 + 마감 -->
            <div class="recruit-card__head">
              <span class="recruit-card__company">{{ post.company }}</span>
              <span class="recruit-card__dday" :class="ddayClass(post)">{{ ddayLabel(post) }}</span>
            </div>

            <h4 class="recruit-card__position">{{ post.title }}</h4>

            <!-- 조건: 지역·경력·학력·고용형태 (출처마다 비는 칸이 있어 있는 것만) -->
            <div class="recruit-card__tags">
              <span v-for="t in tagsOf(post)" :key="t" class="recruit-card__type">{{ t }}</span>
            </div>
            <p v-if="post.salary" class="recruit-card__salary">{{ post.salary }}</p>

            <div class="recruit-card__bottom">
              <span class="recruit-card__source">출처: {{ post.sourceName }}</span>
              <span class="recruit-card__deadline">{{ deadlineText(post) }}</span>
            </div>
          </a>
        </li>
      </ul>

      <!-- 출처별 '더 보기' — 사람인·잡코리아가 붙으면 줄이 하나씩 늘어난다 -->
      <div v-if="!isLoading && !error && moreLinks.length" class="recruit-more">
        <a
          v-for="s in moreLinks"
          :key="s.id"
          class="recruit-more__link"
          :href="s.moreUrl!"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ s.name }}에서 {{ s.total > s.count ? `전체 ${s.total.toLocaleString()}건 보기` : '더 보기' }} ›
        </a>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { fetchJobRecruitments } from '../../../../encyclopedia.api'
import type { RecruitmentPosting, RecruitmentSource } from '../../../../types/encyclopedia'

const props = defineProps<{ jobCode: string }>()

// 2026-10-16 가짜 샘플 공고(실제 회사명) 제거 후, 고용24 채용정보로 채운다.
// ⚠️ 다시 샘플을 넣지 말 것. 출처를 늘릴 때는 서버(services/recruit/providers)만 고치면 이 화면은 그대로다
const postings = ref<RecruitmentPosting[]>([])
const sources = ref<RecruitmentSource[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

const moreLinks = computed(() => sources.value.filter((s) => s.ok && s.moreUrl))

async function load() {
  isLoading.value = true
  error.value = null
  try {
    const { data } = await fetchJobRecruitments(props.jobCode)
    postings.value = data.data.postings
    sources.value = data.data.sources
    // 출처가 전부 실패했으면 '공고 없음'이 아니라 오류로 보여준다(없는 게 아니라 못 불러온 것)
    const tried = sources.value.filter((s) => !s.skipped)
    if (tried.length && tried.every((s) => !s.ok)) error.value = '채용정보를 불러오지 못했어요.'
  } catch {
    error.value = '채용정보를 불러오지 못했어요.'
  } finally {
    isLoading.value = false
  }
}

onMounted(load)
watch(() => props.jobCode, load)

function tagsOf(p: RecruitmentPosting): string[] {
  return [p.region, p.career, p.education, p.employmentType].filter(Boolean)
}

function daysLeft(p: RecruitmentPosting): number | null {
  if (!p.deadline.date) return null
  const end = new Date(p.deadline.date + 'T23:59:59')
  return Math.ceil((end.getTime() - Date.now()) / 86_400_000)
}

function ddayLabel(p: RecruitmentPosting): string {
  // '채용시까지' 공고는 날짜가 있어도 그 전에 닫힐 수 있다 — D-day 대신 상시로 보여준다
  if (p.deadline.untilFilled) return '채용시 마감'
  const d = daysLeft(p)
  if (d === null) return p.deadline.label || '상시채용'
  if (d < 0) return '마감'
  if (d === 0) return 'D-DAY'
  return `D-${d}`
}

function ddayClass(p: RecruitmentPosting): string {
  if (p.deadline.untilFilled) return 'recruit-card__dday--always'
  const d = daysLeft(p)
  if (d === null) return 'recruit-card__dday--always'
  if (d < 0) return 'recruit-card__dday--closed'
  if (d <= 7) return 'recruit-card__dday--urgent'
  return ''
}

function deadlineText(p: RecruitmentPosting): string {
  if (!p.deadline.date) return p.deadline.label || '채용시 마감'
  const date = p.deadline.date.replace(/-/g, '.')
  return p.deadline.untilFilled ? `채용시 마감 (~ ${date})` : `~ ${date} 까지`
}
</script>

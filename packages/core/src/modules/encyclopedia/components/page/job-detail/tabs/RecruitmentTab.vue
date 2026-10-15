<template>
  <div class="recruit-tab">
    <section class="recruit-section">
      <div class="recruit-section__head">
        <h3 class="recruit-section__title">채용공고<template v-if="postings.length"> ({{ postings.length }})</template></h3>
        <p v-if="postings.length" class="recruit-section__desc">이 직업으로 현재 채용 중인 공고예요.</p>
      </div>

      <div v-if="postings.length === 0" class="recruit-empty">
        채용공고를 준비하고 있어요.<br />
        곧 고용24의 실제 채용정보를 이곳에서 보여드릴게요.
      </div>

      <ul v-else class="recruit-list">
        <li v-for="post in postings" :key="post.id" class="recruit-card">
          <!-- 헤더: 회사 + 마감 -->
          <div class="recruit-card__head">
            <span class="recruit-card__company">{{ post.companyName }}</span>
            <span class="recruit-card__dday" :class="ddayClass(post.deadline)">
              {{ ddayLabel(post.deadline) }}
            </span>
          </div>

          <!-- 모집포지션 + 고용형태 -->
          <h4 class="recruit-card__position">{{ post.position }}</h4>
          <span class="recruit-card__type">{{ post.employmentType }}</span>

          <!-- 주요업무 -->
          <div class="recruit-block">
            <span class="recruit-block__label">주요업무</span>
            <ul class="recruit-block__list">
              <li v-for="d in post.duties" :key="d" class="recruit-block__item">
                <span class="list-dot" />
                {{ d }}
              </li>
            </ul>
          </div>

          <!-- 자격요건 -->
          <div class="recruit-block">
            <span class="recruit-block__label">자격요건</span>
            <ul class="recruit-block__list">
              <li v-for="r in post.requirements" :key="r" class="recruit-block__item">
                <span class="list-dot" />
                {{ r }}
              </li>
            </ul>
          </div>

          <!-- 우대사항 -->
          <div class="recruit-block">
            <span class="recruit-block__label recruit-block__label--pref">우대사항</span>
            <ul class="recruit-block__list">
              <li v-for="p in post.preferred" :key="p" class="recruit-block__item">
                <span class="list-dot" />
                {{ p }}
              </li>
            </ul>
          </div>

          <div class="recruit-card__bottom">
            <span class="recruit-card__deadline">{{ deadlineText(post.deadline) }}</span>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ jobCode: string }>()

/** 채용공고 카드 데이터 형태 — 고용24 채용정보 연동 때 이 모양으로 채운다. jobCode 별로 분리 */
interface SamplePosting {
  id: string
  companyName: string
  position: string        // 모집포지션
  employmentType: string  // 고용형태
  deadline: string        // ISO 날짜 또는 '상시채용'
  duties: string[]        // 주요업무
  requirements: string[]  // 자격요건
  preferred: string[]     // 우대사항
}

// 2026-10-16 샘플 공고 제거 — **실제 회사 이름으로 만든 가짜 공고**(6건)가 '예시' 표시 없이 프로덕션에 나가 있었다.
// 사용자가 진짜 채용으로 오해할 수 있고 실제 회사명을 허위 공고에 쓰는 셈이라 내렸다.
// 실제 공고는 고용24 채용정보 API 로 채울 예정(로드맵 1번). 그 전까지는 아래 맵이 비어 '준비 중' 안내가 나온다.
// ⚠️ 다시 샘플을 넣지 말 것 — 넣어야 한다면 '예시' 표시 + 가상 회사명
const SAMPLE_POSTINGS_BY_JOB: Record<string, SamplePosting[]> = {}

const postings = computed<SamplePosting[]>(() => SAMPLE_POSTINGS_BY_JOB[props.jobCode] ?? [])

function daysLeft(deadline: string): number | null {
  if (deadline === '상시채용') return null
  const end = new Date(deadline + 'T23:59:59')
  const now = new Date()
  return Math.ceil((end.getTime() - now.getTime()) / 86_400_000)
}

function ddayLabel(deadline: string): string {
  const d = daysLeft(deadline)
  if (d === null) return '상시채용'
  if (d < 0) return '마감'
  if (d === 0) return 'D-DAY'
  return `D-${d}`
}

function ddayClass(deadline: string): string {
  const d = daysLeft(deadline)
  if (d === null) return 'recruit-card__dday--always'
  if (d < 0) return 'recruit-card__dday--closed'
  if (d <= 7) return 'recruit-card__dday--urgent'
  return ''
}

function deadlineText(deadline: string): string {
  if (deadline === '상시채용') return '채용시 마감'
  return `~ ${deadline.replace(/-/g, '.')} 까지`
}
</script>

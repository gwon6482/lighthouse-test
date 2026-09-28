<template>
  <div class="overview-tab">

    <!-- 상위 직업군 데이터 안내.
         work24-shared = 고용24가 이 직업을 상위 직업으로 통합해 둔 경우(예: 전문의 13종 → '전문의사').
         표시하지 않으면 "소아과와 성형외과 임금이 왜 같지?" 를 오류로 오해한다.

         ⚠️ jobNm 이 이 직업 이름과 같으면 안내할 게 없다. 그런데도 dataSource 는
            work24-shared 인 경우가 있다(간호사·항공기조종사 등 6건). 그때 이 문구를 띄우면
            "아래 정보는 **간호사** 기준이에요" 가 되어 아무 말도 아니게 된다. -->
    <p v-if="showSharedNotice" class="overview-notice">
      아래 정보는 <strong>{{ job.work24?.jobNm }}</strong> 기준이에요.
      비슷한 직업을 묶어 조사한 자료라 세부 직업별로 다를 수 있어요.
    </p>

    <!-- 주요업무 -->
    <section class="overview-section">
      <h3 class="overview-section__title">주요업무</h3>
      <p class="overview-section__text">{{ job.overview }}</p>
    </section>

    <!-- 수행직무 -->
    <section class="overview-section">
      <h3 class="overview-section__title">수행직무</h3>
      <ul class="overview-duties">
        <li v-for="(duty, i) in job.duties" :key="i" class="overview-duties__item">
          <span class="list-dot" />
          {{ duty }}
        </li>
      </ul>
    </section>

    <!-- 되는 길 -->
    <section v-if="job.work24?.way" class="overview-section">
      <h3 class="overview-section__title">되는 길</h3>
      <p class="overview-section__text overview-section__text--pre">{{ job.work24.way }}</p>
    </section>

    <!-- 학력 · 전공 -->
    <section v-if="hasEducationInfo" class="overview-section">
      <h3 class="overview-section__title">이 일을 하는 사람들</h3>

      <div v-if="job.work24?.education?.length" class="overview-ratio">
        <span class="overview-ratio__caption">학력</span>
        <div v-for="e in job.work24.education" :key="e.key" class="overview-ratio__row">
          <span class="overview-ratio__label">{{ e.label }}</span>
          <div class="overview-ratio__bar-bg">
            <div class="overview-ratio__bar-fill" :style="{ width: e.ratio + '%' }" />
          </div>
          <span class="overview-ratio__value">{{ e.ratio }}%</span>
        </div>
      </div>

      <div v-if="job.work24?.schoolDepartments?.length" class="overview-ratio">
        <span class="overview-ratio__caption">전공 계열</span>
        <div v-for="s in job.work24.schoolDepartments" :key="s.key" class="overview-ratio__row">
          <span class="overview-ratio__label">{{ s.label }}</span>
          <div class="overview-ratio__bar-bg">
            <div class="overview-ratio__bar-fill overview-ratio__bar-fill--alt" :style="{ width: s.ratio + '%' }" />
          </div>
          <span class="overview-ratio__value">{{ s.ratio }}%</span>
        </div>
      </div>

      <div v-if="job.relatedMajors?.length" class="overview-chips">
        <span class="overview-ratio__caption">관련 학과</span>
        <ul class="overview-chips__list">
          <li v-for="m in job.relatedMajors" :key="m.name" class="overview-chips__item">{{ m.name }}</li>
        </ul>
      </div>

      <div v-if="job.relatedCertifications?.length" class="overview-chips">
        <span class="overview-ratio__caption">관련 자격</span>
        <ul class="overview-chips__list">
          <li v-for="c in job.relatedCertifications" :key="c" class="overview-chips__item overview-chips__item--cert">{{ c }}</li>
        </ul>
      </div>
    </section>

    <!-- 개인요소 / 업무요소 -->
    <section v-for="section in detailSections" :key="section.title" class="overview-section overview-section--cards">
      <div class="overview-section__header">
        <h3 class="overview-section__title">{{ section.title }}</h3>
        <button
          type="button"
          class="compare-toggle"
          :class="{ 'compare-toggle--on': showInter[section.title] }"
          @click="showInter[section.title] = !showInter[section.title]"
        >
          {{ showInter[section.title] ? '직업간 비교 숨기기' : '직업간 비교 보기' }}
        </button>
      </div>

      <div class="pf-cards">
        <article v-for="cat in cardsFor(section)" :key="`${cat.catKey}-${cat.dimKey}`" class="pf-card">
          <div class="pf-card-head">
            <span class="pf-card-title">{{ cat.catKey }}</span>
            <span class="pf-badge">{{ cat.dimKey }}</span>
          </div>

          <!-- 직업 내 (기본 노출, 상위 3개) -->
          <div class="pf-block">
            <p class="pf-block-label">
              <svg class="pf-icon pf-icon--within" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="1" />
              </svg>
              이 직업에서 특히 중요해요
            </p>
            <ul class="pf-chips">
              <li v-for="item in cat.within" :key="item.name" class="pf-chip pf-chip--within">{{ item.name }}</li>
            </ul>
          </div>

          <!-- 직업 간 (토글 시 노출, 상위 3개) -->
          <div v-show="showInter[section.title]" class="pf-block">
            <p class="pf-block-label">
              <svg class="pf-icon pf-icon--between" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.9 7a8 8 0 0 1 1.1 5v1a6 6 0 0 0 .8 3" />
                <path d="M8 11a4 4 0 0 1 8 0v1a10 10 0 0 0 2 6" />
                <path d="M12 11v2a14 14 0 0 0 2.5 8" />
                <path d="M8 15a18 18 0 0 0 1.8 6" />
                <path d="M4.9 19a22 22 0 0 1 -.9 -7v-1a8 8 0 0 1 12 -6.95" />
              </svg>
              다른 직업과 뚜렷이 구별돼요
            </p>
            <ul class="pf-chips">
              <li v-for="item in cat.between" :key="item.name" class="pf-chip pf-chip--between">{{ item.name }}</li>
            </ul>
          </div>
        </article>
      </div>
    </section>

    <!-- 직업 현황 -->
    <section v-if="job.jobSatisfaction != null || job.salary" class="overview-section overview-section--cards">
      <h3 class="overview-section__title">직업 현황</h3>
      <div class="overview-stats">

        <!-- 직업 만족도 -->
        <div v-if="job.jobSatisfaction != null" class="overview-stats__card">
          <span class="overview-stats__label">직업 만족도</span>
          <div class="overview-satisfaction">
            <div class="overview-satisfaction__bar-bg">
              <div
                class="overview-satisfaction__bar-fill"
                :style="{ width: job.jobSatisfaction + '%' }"
              />
            </div>
            <span class="overview-satisfaction__value">상위 {{ (100 - job.jobSatisfaction).toFixed(1) }}%</span>
          </div>
        </div>

        <!-- 임금 정보 -->
        <div v-if="job.salary" class="overview-stats__card">
          <span class="overview-stats__label">연봉 (만원)</span>
          <div class="overview-salary">
            <div class="overview-salary__track">
              <div class="overview-salary__bar" />
              <div class="overview-salary__point overview-salary__point--lower">
                <div class="overview-salary__dot" />
                <span class="overview-salary__tip">하위 25%</span>
                <span class="overview-salary__amount">{{ job.salary.lower.toLocaleString() }}</span>
              </div>
              <div class="overview-salary__point overview-salary__point--median">
                <div class="overview-salary__dot overview-salary__dot--median" />
                <span class="overview-salary__tip">중위</span>
                <span class="overview-salary__amount overview-salary__amount--median">{{ job.salary.median.toLocaleString() }}</span>
              </div>
              <div class="overview-salary__point overview-salary__point--upper">
                <div class="overview-salary__dot" />
                <span class="overview-salary__tip">상위 25%</span>
                <span class="overview-salary__amount">{{ job.salary.upper.toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- 일자리 전망 -->
    <section v-if="job.work24?.prospect?.text || job.work24?.prospect?.distribution?.length" class="overview-section">
      <h3 class="overview-section__title">
        일자리 전망
        <span v-if="prospectYear" class="overview-section__sub">{{ prospectYear }}년 조사</span>
      </h3>

      <div v-if="job.work24?.prospect?.distribution?.length" class="overview-prospect">
        <div v-for="b in job.work24.prospect.distribution" :key="b.name" class="overview-prospect__row">
          <span class="overview-prospect__label">{{ b.name }}</span>
          <div class="overview-prospect__bar-bg">
            <div
              class="overview-prospect__bar-fill"
              :class="prospectToneOf(b.name)"
              :style="{ width: b.ratio + '%' }"
            />
          </div>
          <span class="overview-prospect__value">{{ b.ratio }}%</span>
        </div>
      </div>

      <p v-if="job.work24?.prospect?.text" class="overview-section__text overview-section__text--pre">
        {{ job.work24.prospect.text }}
      </p>
    </section>

    <!-- 관련 직업 -->
    <section v-if="job.work24?.relatedJobs?.length" class="overview-section">
      <h3 class="overview-section__title">관련 직업</h3>
      <ul class="overview-chips__list">
        <li v-for="r in job.work24.relatedJobs" :key="r.jobNm" class="overview-chips__item">{{ r.jobNm }}</li>
      </ul>
    </section>

  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import type { Job, JobDetails, CategoryRankings, RankItem } from '../../../../types/encyclopedia'

const props = defineProps<{ job: Job }>()

type FactorKey = keyof JobDetails
type DimKey = '중요도' | '수준'
type CompareKey = '직업내' | '직업간'

const TOP_N = 3

const detailSections: Array<{ title: string; keys: FactorKey[] }> = [
  { title: '개인요소', keys: ['성격', '지식', '흥미', '가치관'] },
  { title: '업무요소', keys: ['업무수행능력', '업무활동', '업무환경'] },
]

const showInter = reactive<Record<string, boolean>>({
  개인요소: false,
  업무요소: false,
})

function dimensionsOf(catKey: FactorKey): DimKey[] {
  const cat = props.job.details[catKey] as CategoryRankings
  return (['중요도', '수준'] as DimKey[]).filter(k => cat[k] !== undefined)
}

function getItems(catKey: FactorKey, dimKey: DimKey, compareKey: CompareKey): RankItem[] {
  const items = (props.job.details[catKey] as CategoryRankings)[dimKey]?.[compareKey] ?? []
  return [...items].sort((a, b) => b.score - a.score).slice(0, TOP_N)
}

interface FactorCard {
  catKey: FactorKey
  dimKey: DimKey
  within: RankItem[]
  between: RankItem[]
}

const hasEducationInfo = computed(() =>
  !!(props.job.work24?.education?.length
    || props.job.work24?.schoolDepartments?.length
    || props.job.relatedMajors?.length
    || props.job.relatedCertifications?.length),
)

// 상위 직업군 안내를 띄울지. 대표 직업명이 **이 직업 이름과 다를 때만** 의미가 있다.
// ⚠️ `dataSource === 'work24-shared'` 만으로 판정하면 안 된다 — jobNm 이 자기 이름과
//    같은 직업이 6건 있어서(간호사·항공기조종사·회계사무원 등) "아래 정보는 간호사
//    기준이에요" 라는 빈 문장이 뜬다.
const showSharedNotice = computed(() => {
  const nm = props.job.work24?.jobNm
  return props.job.dataSource === 'work24-shared' && !!nm && nm !== props.job.title
})

// 임금·전망 모두 같은 조사년도를 쓴다. 어느 쪽이든 있으면 표시한다.
const prospectYear = computed(() =>
  props.job.work24?.prospect?.distribution?.find(b => b.year)?.year
    ?? props.job.work24?.salarySurveyYear
    ?? null,
)

// 전망 막대 색. 증가 계열/감소 계열만 구분하고 나머지는 기본색.
function prospectToneOf(name: string): string {
  if (name.includes('증가')) return 'overview-prospect__bar-fill--up'
  if (name.includes('감소')) return 'overview-prospect__bar-fill--down'
  return ''
}

function cardsFor(section: { keys: FactorKey[] }): FactorCard[] {
  return section.keys.flatMap(catKey =>
    dimensionsOf(catKey).map(dimKey => ({
      catKey,
      dimKey,
      within: getItems(catKey, dimKey, '직업내'),
      between: getItems(catKey, dimKey, '직업간'),
    })),
  )
}
</script>

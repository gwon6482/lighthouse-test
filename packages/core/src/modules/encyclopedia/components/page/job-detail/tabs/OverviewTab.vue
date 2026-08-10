<template>
  <div class="overview-tab">

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

  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
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

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
          {{ duty }}
        </li>
      </ul>
    </section>

    <!-- 개인요소 / 업무요소 -->
    <section v-for="section in detailSections" :key="section.title" class="overview-section">
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

      <div class="factor-group">
        <div v-for="catKey in section.keys" :key="catKey" class="factor-card">
          <h4 class="factor-card__title">{{ catKey }}</h4>

          <div v-for="dimKey in dimensionsOf(catKey)" :key="dimKey" class="factor-dim">
            <span class="factor-dim__badge">{{ dimKey }}</span>

            <!-- 직업 내 (기본 노출, 상위 3개) -->
            <div class="factor-block">
              <span class="factor-block__label factor-block__label--inner">직업 내</span>
              <ul class="rank-list">
                <li v-for="item in getItems(catKey, dimKey, '직업내')" :key="item.name" class="rank-item">
                  <div class="rank-item__row">
                    <span class="rank-item__name">{{ item.name }}</span>
                    <span class="rank-item__score">{{ item.score }}</span>
                  </div>
                  <div class="rank-bar-bg">
                    <div class="rank-bar-fill rank-bar-fill--inner" :style="{ width: pct(item.score, 7) }" />
                  </div>
                </li>
              </ul>
            </div>

            <!-- 직업 간 (토글 시 노출, 상위 3개) -->
            <div v-if="showInter[section.title]" class="factor-block">
              <span class="factor-block__label factor-block__label--inter">직업 간</span>
              <ul class="rank-list">
                <li v-for="item in getItems(catKey, dimKey, '직업간')" :key="item.name" class="rank-item">
                  <div class="rank-item__row">
                    <span class="rank-item__name">{{ item.name }}</span>
                    <span class="rank-item__score">{{ item.score }}</span>
                  </div>
                  <div class="rank-bar-bg">
                    <div class="rank-bar-fill rank-bar-fill--inter" :style="{ width: pct(item.score, 100) }" />
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 직업 현황 -->
    <section v-if="job.jobSatisfaction != null || job.salary" class="overview-section">
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

function pct(score: number, max: number): string {
  return `${Math.min((score / max) * 100, 100).toFixed(1)}%`
}
</script>

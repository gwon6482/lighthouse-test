<template>
  <section v-if="searchQuery" class="search-result">
    <!-- 분류 보기 — 분류 칩을 눌렀을 때 그 분류의 직업 전체 -->
    <template v-if="scope">
      <button type="button" class="search-result__back" @click="emit('closeGroup')">
        <AppIcon name="ui-back" /> ‘{{ searchQuery }}’ 검색 결과로
      </button>
      <div class="search-result__header">
        <span class="search-result__label">{{ scope.name }}</span>
        <span class="search-result__kind">{{ levelLabel(scope) }}</span>
        <span v-if="!isLoading && scopeResults.length > 0" class="search-result__count">{{ scopeResults.length }}건</span>
      </div>
      <div v-if="isLoading" class="search-result__state">
        <span class="search-result__state-icon"><AppIcon name="ui-search" /></span>
        <span>불러오는 중...</span>
      </div>
      <div v-else-if="failed" class="search-result__state">
        <span class="search-result__state-icon"><AppIcon name="ui-empty-result" /></span>
        <span>불러오지 못했어요. 잠시 후 다시 시도해 주세요</span>
      </div>
      <div v-else-if="scopeResults.length === 0" class="search-result__state">
        <span class="search-result__state-icon"><AppIcon name="ui-empty-result" /></span>
        <span>이 분류에 실린 직업이 없어요</span>
      </div>
      <div v-else class="search-result__list">
        <SearchResultCard v-for="job in scopeResults" :key="job.jobCode" :job="job" />
      </div>
    </template>

    <!-- 검색 결과 -->
    <template v-else>
      <div class="search-result__header">
        <span class="search-result__label">검색 결과</span>
        <span v-if="!isLoading && searchResults.length > 0" class="search-result__count">{{ searchResults.length }}건</span>
      </div>

      <div v-if="isLoading" class="search-result__state">
        <span class="search-result__state-icon"><AppIcon name="ui-search" /></span>
        <span>검색 중...</span>
      </div>
      <div v-else-if="failed" class="search-result__state">
        <span class="search-result__state-icon"><AppIcon name="ui-empty-result" /></span>
        <span>검색하지 못했어요. 잠시 후 다시 시도해 주세요</span>
      </div>
      <template v-else>
        <!-- 검색어가 들어간 분류 — 직업 이름이 생소할 때 분류로 들어가 찾는다(예: '농' → 농림어업직).
             제목은 '관련 분류'(2026-11-17) — 진로백과 홈의 '분류로 찾기'(직무·관심 분야… 로 좁히기)와 이름이 겹치지 않게 -->
        <div v-if="chips.length" class="search-result__groups">
          <span class="search-result__groups-label">관련 분류</span>
          <div class="search-result__chips">
            <button v-for="g in chips" :key="`${g.level}:${g.name}`" type="button" class="search-result__chip" @click="emit('openGroup', g)">
              <span class="search-result__chip-name">{{ g.name }}</span>
              <span class="search-result__chip-count">{{ g.count }}</span>
            </button>
          </div>
        </div>

        <div v-if="searchResults.length === 0" class="search-result__state search-result__state--column">
          <span class="search-result__state-row">
            <span class="search-result__state-icon"><AppIcon name="ui-empty-result" /></span>
            <span><strong>{{ searchQuery }}</strong>에 대한 결과가 없어요</span>
          </span>
          <span class="search-result__hint">{{ chips.length ? '위 분류를 눌러 그 안의 직업을 살펴보세요.' : '직업 이름의 일부(예: 재배, 개발자)나 분야(예: 농림어업, 의료)로 찾아보세요.' }}</span>
        </div>
        <div v-else class="search-result__list">
          <SearchResultCard v-for="job in searchResults" :key="job.jobCode" :job="job" />
        </div>
      </template>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import type { JobSummary, JobSearchGroup } from '@/modules/encyclopedia/types/encyclopedia'
import SearchResultCard from './SearchResultCard.vue'

const props = withDefaults(defineProps<{
  searchQuery: string
  isLoading: boolean
  searchResults: JobSummary[]
  /** 검색어가 들어간 1·2차 분류 */
  groups?: JobSearchGroup[]
  /** 분류 칩을 눌러 보고 있는 분류. null 이면 검색 결과 */
  scope?: JobSearchGroup | null
  scopeResults?: JobSummary[]
  failed?: boolean
}>(), { groups: () => [], scope: null, scopeResults: () => [], failed: false })

const emit = defineEmits<{ openGroup: [group: JobSearchGroup]; closeGroup: [] }>()

// 칩으로 띄울 분류: 1차 분류는 모두, 2차 분류는 직업이 둘 이상일 때만.
//   2차 분류의 직업은 검색 결과에도 들어 있다 — 직업이 하나뿐이면 아래 목록의 그 직업과 같은 줄이라 띄우지 않는다
const MAX_CHIPS = 12
const chips = computed(() => props.groups.filter((g) => g.level === 'primary' || g.count > 1).slice(0, MAX_CHIPS))
const levelLabel = (g: JobSearchGroup) => (g.level === 'primary' ? '1차 분류' : `2차 분류 · ${g.primary ?? ''}`)
</script>

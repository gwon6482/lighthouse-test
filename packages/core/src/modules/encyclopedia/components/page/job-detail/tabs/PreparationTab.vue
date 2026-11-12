<template>
  <div :class="['prep-tab', { 'g-locked': locked }]" @click="onLockedClick">
    <section class="prep-section">
      <div class="prep-section__head">
        <div v-if="locked && journeys.length" class="g-head">
          <h3 class="prep-section__title">
            준비과정 예시 ({{ journeys.length }})
            <span class="prep-section__badge">예시</span>
          </h3>
          <span class="g-pill"><AppIcon name="ui-privacy" :size="12" />가입 후</span>
        </div>
        <h3 v-else class="prep-section__title">
          준비과정 예시 ({{ journeys.length }})
          <span class="prep-section__badge">예시</span>
        </h3>
        <p class="prep-section__desc">
          이 직업에 도달하는 준비과정을 이해하기 쉽게 구성한 <strong>예시</strong>예요.
          실제 인물의 사례가 아니며, 실제 경로는 사람마다 다를 수 있어요.
        </p>
      </div>

      <div v-if="journeys.length === 0" class="prep-empty">
        아직 준비과정이 등록되지 않았습니다.
      </div>

      <ul v-else :class="['prep-list', { 'g-clip': locked }]">
        <li v-for="(journey, ji) in journeys" :key="journey.id" :class="['prep-card', { 'g-veil': locked && ji > 0 }]">
          <!-- 인물 헤더 -->
          <div class="prep-card__head">
            <div class="prep-card__person">
              <span class="prep-card__avatar"><AppIcon name="ui-avatar" /></span>
              <div class="prep-card__who">
                <span class="prep-card__author">{{ journey.author }}</span>
                <span class="prep-card__role">{{ journey.role }}</span>
              </div>
            </div>
            <span class="prep-card__years">{{ journey.years }}년 준비</span>
          </div>

          <p class="prep-card__headline">“{{ journey.headline }}”</p>

          <!-- 준비과정 -->
          <div :class="['prep-block', { 'g-veil': locked }]">
            <span class="prep-block__label">준비과정 {{ journey.projects.length }}</span>
            <div class="prep-block__groups">
              <div v-for="group in groupedProjects(journey)" :key="group.category" class="prep-block__group">
                <p class="prep-block__group-head" :style="{ color: categoryMeta[group.category].color }">
                  {{ categoryMeta[group.category].label }} {{ group.items.length }}
                </p>
                <ul class="prep-block__list">
                  <li v-for="item in group.items" :key="item" class="prep-block__item">
                    <span class="list-dot" />
                    {{ item }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- 루틴 (프로젝트와 별개) -->
          <div :class="['prep-block', 'prep-block--routine', { 'g-veil': locked }]">
            <span class="prep-block__label">루틴 {{ journey.routines.length }}</span>
            <ul class="prep-block__list">
              <li v-for="routine in journey.routines" :key="routine.name" class="prep-routine">
                <span class="prep-routine__freq">{{ routine.freq }}</span>
                <span class="prep-routine__name">{{ routine.name }}</span>
              </li>
            </ul>
          </div>

          <!-- 요약 푸터 -->
          <!-- <div class="prep-card__footer">
            <span
              v-for="cat in categoryOrder"
              v-show="categoryCount(journey, cat)"
              :key="cat"
              class="prep-card__cat"
              :style="{ background: categoryMeta[cat].bg, color: categoryMeta[cat].color }"
            >{{ categoryMeta[cat].label }} {{ categoryCount(journey, cat) }}</span>
          </div> -->
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
import { computed } from 'vue'
import type { ProjectCategory } from '@/modules/career-design/types/career-design'

const props = defineProps<{ jobCode: string; locked?: boolean }>()
const emit = defineEmits<{ (e: 'unlock'): void }>()

// 비회원(2026-11-11): 흐린 곳을 누르면 페이지가 맨 아래 안내 카드로 내린다(또렷한 링크·버튼은 제 할 일을 하게 둔다)
function onLockedClick(e: MouseEvent) {
  if (props.locked && !(e.target as HTMLElement).closest('button, a')) emit('unlock')
}

/**
 * 한 직업인의 준비 여정 (백엔드 준비 전 하드코딩). jobCode 별로 분리.
 *
 * ⚠️ **실제 인물이 아니라 구성한 예시다.** 화면에도 그렇게 표시해야 한다.
 *    2026-09-28 이전에는 "현직자들의 준비과정" 이라는 제목에 `現 세종문화회관 공연기획 팀장`
 *    처럼 **실명 기관**이 붙어 있어서, 사용자가 실제 사례로 믿고 진로를 정할 수 있었다.
 *    기관 입장에서도 곤란하다. → 제목을 '준비과정 예시' 로 바꾸고 기관명을 업계 표기로 일반화했다.
 *
 * ⚠️ 실제 인터뷰 데이터로 교체할 때는 **표시 문구도 같이 되돌려야 한다.**
 *    예시 배지를 단 채 실제 사례를 보여주면 반대로 신뢰를 잃는다.
 */
interface JourneyItem {
  category: ProjectCategory
  name: string
}
interface RoutineItem {
  freq: string   // 예: '매일', '주 2회'
  name: string
}
interface PreparationJourney {
  id: string
  author: string
  role: string         // 現 직함
  years: number
  headline: string     // 한줄 소개
  projects: JourneyItem[]
  routines: RoutineItem[]
}

const categoryMeta: Record<ProjectCategory, { label: string; color: string; bg: string }> = {
  qualification: { label: '자격요건', color: '#1DB95A', bg: '#E8F9EF' },
  knowledge:     { label: '분야지식', color: '#F47820', bg: '#FFF2E8' },
  skill:         { label: '직무기술', color: '#A855F7', bg: '#F5EEFF' },
  portfolio:     { label: '포트폴리오', color: '#4480F5', bg: '#EBF2FF' },
  experience:    { label: '실무경험', color: '#F0507E', bg: '#FFEDF2' },
}
const categoryOrder: ProjectCategory[] = ['qualification', 'knowledge', 'skill', 'portfolio', 'experience']

// 예술·디자인·방송관리자(013601): 문화·예술·방송 기관 운영 관리자로 도달한 현직자 여정
// 준비과정 예시 — 2026-11-11 사용자 결정으로 더미 예시(2개 직업)를 지웠다. 실제 인터뷰·제출 데이터가 생기면 여기(또는 API)로 채운다.
// 비어 있으면 탭은 '아직 준비과정이 등록되지 않았습니다'를 보인다
const SAMPLE_JOURNEYS_BY_JOB: Record<string, PreparationJourney[]> = {}

const journeys = computed<PreparationJourney[]>(() => SAMPLE_JOURNEYS_BY_JOB[props.jobCode] ?? [])

function categoryCount(j: PreparationJourney, cat: ProjectCategory): number {
  return j.projects.filter(i => i.category === cat).length
}

// 준비 활동을 카테고리별로 묶고, 항목 많은 그룹부터 노출
function groupedProjects(journey: PreparationJourney): { category: ProjectCategory; items: string[] }[] {
  const groups = new Map<ProjectCategory, string[]>()
  for (const item of journey.projects) {
    if (!groups.has(item.category)) groups.set(item.category, [])
    groups.get(item.category)!.push(item.name)
  }
  return [...groups.entries()]
    .map(([category, items]) => ({ category, items }))
    .sort((a, b) => b.items.length - a.items.length)
}
</script>

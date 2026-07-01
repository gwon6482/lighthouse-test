<template>
  <div class="prep-tab">
    <section class="prep-section">
      <div class="prep-section__head">
        <h3 class="prep-section__title">현직자들의 준비과정 ({{ journeys.length }})</h3>
        <p class="prep-section__desc">이 직업에 도달한 사람들이 쌓아온 프로젝트와 루틴이에요.</p>
      </div>

      <div v-if="journeys.length === 0" class="prep-empty">
        아직 준비과정이 등록되지 않았습니다.
      </div>

      <ul v-else class="prep-list">
        <li v-for="journey in journeys" :key="journey.id" class="prep-card">
          <!-- 인물 헤더 -->
          <div class="prep-card__head">
            <div class="prep-card__person">
              <span class="prep-card__avatar">🧑</span>
              <div class="prep-card__who">
                <span class="prep-card__author">{{ journey.author }}</span>
                <span class="prep-card__role">現 {{ journey.role }}</span>
              </div>
            </div>
            <span class="prep-card__years">{{ journey.years }}년 준비</span>
          </div>

          <p class="prep-card__headline">“{{ journey.headline }}”</p>

          <!-- 프로젝트 -->
          <div class="prep-block">
            <span class="prep-block__label">프로젝트 {{ journey.projects.length }}</span>
            <ul class="prep-block__list">
              <li v-for="item in journey.projects" :key="item.name" class="prep-block__item">
                <span class="prep-block__dot" :style="{ background: categoryMeta[item.category].color }" />
                {{ item.name }}
              </li>
            </ul>
          </div>

          <!-- 루틴 (프로젝트와 별개) -->
          <div class="prep-block prep-block--routine">
            <span class="prep-block__label">루틴 {{ journey.routines.length }}</span>
            <ul class="prep-block__list">
              <li v-for="routine in journey.routines" :key="routine.name" class="prep-routine">
                <span class="prep-routine__freq">{{ routine.freq }}</span>
                <span class="prep-routine__name">{{ routine.name }}</span>
              </li>
            </ul>
          </div>

          <!-- 요약 푸터 -->
          <div class="prep-card__footer">
            <span
              v-for="cat in categoryOrder"
              v-show="categoryCount(journey, cat)"
              :key="cat"
              class="prep-card__cat"
              :style="{ background: categoryMeta[cat].bg, color: categoryMeta[cat].color }"
            >{{ categoryMeta[cat].label }} {{ categoryCount(journey, cat) }}</span>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProjectCategory } from '@/modules/career-design/types/career-design'

const props = defineProps<{ jobCode: string }>()

/** 한 직업인의 준비 여정 (백엔드 준비 전 하드코딩). jobCode 별로 분리 */
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
}
const categoryOrder: ProjectCategory[] = ['qualification', 'knowledge', 'skill', 'portfolio']

// 예술·디자인·방송관리자(013601): 문화·예술·방송 기관 운영 관리자로 도달한 현직자 여정
const SAMPLE_JOURNEYS_BY_JOB: Record<string, PreparationJourney[]> = {
  '013601': [
    {
      id: 'j1',
      author: '김서연',
      role: '세종문화회관 공연기획 팀장',
      years: 3,
      headline: '무대 뒤 잡일부터 시작했어요. 공연은 결국 사람이랑 예산 싸움이더라고요.',
      projects: [
        { category: 'knowledge', name: '문화예술경영 기초 다지기' },
        { category: 'skill', name: '공연장 운영 현장 경험' },
        { category: 'skill', name: '공연 프로젝트 매니지먼트' },
        { category: 'skill', name: '예산·정산 실무' },
        { category: 'qualification', name: '예술경영 아카데미 수료' },
        { category: 'portfolio', name: '기획공연 1건 총괄' },
        { category: 'skill', name: '팀 리더십·조직관리' },
      ],
      routines: [
        { freq: '매일', name: '공연 리뷰·업계 뉴스 스크랩' },
        { freq: '주 2회', name: '타 공연장 관람하며 기획 벤치마킹' },
      ],
    },
    {
      id: 'j2',
      author: '이도현',
      role: 'CJ ENM 방송제작 운영 매니저',
      years: 4,
      headline: 'PD만 꿈꿨는데, 판을 굴러가게 하는 건 결국 운영이더라고요.',
      projects: [
        { category: 'knowledge', name: '방송 콘텐츠 제작 파이프라인 이해' },
        { category: 'skill', name: '조연출 현장 실무' },
        { category: 'skill', name: '편성·제작 예산 관리' },
        { category: 'knowledge', name: '프로그램 기획 실무' },
        { category: 'skill', name: '외주 제작 관리' },
        { category: 'qualification', name: '저작권·계약 실무 교육' },
        { category: 'portfolio', name: '시즌 프로그램 제작 총괄' },
        { category: 'skill', name: '제작팀 리소스 운영' },
      ],
      routines: [
        { freq: '매일', name: '담당 프로그램 시청률·피드백 정리' },
        { freq: '주 1회', name: '경쟁사 편성표·제작 트렌드 리서치' },
      ],
    },
    {
      id: 'j3',
      author: '박민정',
      role: '국립현대미술관 전시운영 파트장',
      years: 5,
      headline: '도슨트로 3년, 관람객 동선 하나에도 기획이 숨어있다는 걸 배웠어요.',
      projects: [
        { category: 'knowledge', name: '미술사·큐레이팅 기초' },
        { category: 'skill', name: '도슨트·전시 운영 보조' },
        { category: 'skill', name: '전시 기획 실무' },
        { category: 'skill', name: '전시 예산·공간 운영' },
        { category: 'portfolio', name: '대형 기획전 코디네이션' },
        { category: 'qualification', name: '예술경영지원센터 심화과정' },
        { category: 'skill', name: '전시운영팀 관리·조직 리더십' },
      ],
      routines: [
        { freq: '매일 30분', name: '전시 아카이브·도록 리서치' },
        { freq: '주 1회', name: '타 미술관 전시 관람·기록' },
      ],
    },
  ],
}

const journeys = computed<PreparationJourney[]>(() => SAMPLE_JOURNEYS_BY_JOB[props.jobCode] ?? [])

function categoryCount(j: PreparationJourney, cat: ProjectCategory): number {
  return j.projects.filter(i => i.category === cat).length
}
</script>

<style scoped lang="scss">
.prep-tab {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 50px 40px;
  background-color: #f9fafb;
}

.prep-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background-color: #fff;
  padding: 30px;
  border-radius: 20px;

  &__head {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-bottom: 8px;
    border-bottom: 1.5px solid #eee;
  }

  &__title {
    font-size: 17px;
    font-weight: 700;
    color: #333;
  }

  &__desc {
    font-size: 13px;
    color: #999;
  }
}

.prep-empty {
  text-align: center;
  padding: 40px 0;
  font-size: 14px;
  color: #bbb;
}

.prep-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.prep-card {
  background-color: #f8f9fa;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  &__person {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__avatar {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
  }

  &__who {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__author {
    font-size: 15px;
    font-weight: 700;
    color: #222;
  }

  &__role {
    font-size: 12px;
    color: #888;
  }

  &__years {
    font-size: 12px;
    font-weight: 700;
    color: #b57e00;
    background-color: #fff6dc;
    border-radius: 20px;
    padding: 4px 10px;
    flex-shrink: 0;
  }

  &__headline {
    font-size: 14px;
    font-weight: 600;
    color: #444;
    line-height: 1.55;
  }

  &__footer {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__cat {
    font-size: 11px;
    font-weight: 700;
    border-radius: 20px;
    padding: 3px 9px;
  }
}

.prep-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #eee;

  &__label {
    font-size: 12px;
    font-weight: 700;
    color: #666;
  }

  &--routine &__label {
    color: #4a7fc1;
  }

  &__list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #555;
  }

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }
}

.prep-routine {
  display: flex;
  align-items: center;
  gap: 8px;

  &__freq {
    font-size: 11px;
    font-weight: 700;
    color: #4a7fc1;
    background-color: #e8edf8;
    border-radius: 6px;
    padding: 2px 7px;
    flex-shrink: 0;
    min-width: 44px;
    text-align: center;
  }

  &__name {
    font-size: 13px;
    color: #555;
  }
}
</style>

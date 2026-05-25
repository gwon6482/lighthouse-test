<template>
  <div class="cd-result">
    <CdYellowHeader title="나의 진로계획" :subtitle="draftPlan.name || '내 진로계획'" back-to="/career-design/complete" />

    <div class="cd-result__body">
      <!-- 요약 카드 -->
      <div class="cd-result__summary">
        <div class="cd-result__target">
          <span class="cd-result__target-icon">🎯</span>
          <span class="cd-result__target-job">{{ draftPlan.targetJob || '목표 직업 미설정' }}</span>
        </div>
        <div class="cd-result__period-row">
          <span class="cd-result__period">{{ periodLabel }}</span>
          <span class="cd-result__stats">프로젝트 {{ placedCount }}개 배치</span>
        </div>
      </div>

      <!-- 타임라인 -->
      <div class="cd-result__section">
        <h3 class="cd-result__section-title">타임라인</h3>

        <div v-if="!filledSlots.length" class="cd-result__empty">
          배치된 프로젝트가 없어요
        </div>

        <div v-else class="cd-result__timeline">
          <div
            v-for="(slot, si) in filledSlots"
            :key="slot.month"
            class="cd-result__month"
          >
            <!-- 월 라벨 + 세로선 -->
            <div class="cd-result__month-left">
              <div class="cd-result__month-dot" />
              <div v-if="si < filledSlots.length - 1" class="cd-result__month-line" />
            </div>

            <div class="cd-result__month-right">
              <span class="cd-result__month-badge">{{ slot.month }}</span>

              <div class="cd-result__projects">
                <div
                  v-for="project in slot.projects"
                  :key="project.id"
                  class="cd-result__project"
                  :style="{ borderLeftColor: categoryColorMap[project.category] }"
                  @click="openProject(project)"
                >
                  <div class="cd-result__project-top">
                    <span class="cd-result__project-name">{{ project.name }}</span>
                    <span
                      class="cd-result__project-cat"
                      :style="{ color: categoryColorMap[project.category], background: `color-mix(in srgb, ${categoryColorMap[project.category]} 10%, white)` }"
                    >{{ categoryLabel(project.category) }}</span>
                  </div>
                  <p v-if="project.goal" class="cd-result__project-goal">{{ project.goal }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 미배치 프로젝트 -->
      <div v-if="unplacedProjects.length" class="cd-result__section cd-result__section--unplaced">
        <h3 class="cd-result__section-title">미배치 프로젝트 ({{ unplacedProjects.length }})</h3>
        <div class="cd-result__unplaced-list">
          <div
            v-for="project in unplacedProjects"
            :key="project.id"
            class="cd-result__unplaced-chip"
            :style="{ borderColor: categoryColorMap[project.category], color: categoryColorMap[project.category] }"
            @click="openProject(project)"
          >
            {{ project.name }}
          </div>
        </div>
      </div>
    </div>

    <!-- 프로젝트 상세 팝업 -->
    <Teleport to="body">
      <Transition name="cd-popup">
        <div v-if="selectedProject" class="cd-proj-popup" @click.self="closeProject">
          <div class="cd-proj-popup__sheet">
            <!-- 핸들 -->
            <div class="cd-proj-popup__handle" />

            <!-- 헤더 -->
            <div
              class="cd-proj-popup__header"
              :style="{ borderLeftColor: categoryColorMap[selectedProject.category] }"
            >
              <div class="cd-proj-popup__header-left">
                <span
                  class="cd-proj-popup__cat"
                  :style="{ color: categoryColorMap[selectedProject.category], background: `color-mix(in srgb, ${categoryColorMap[selectedProject.category]} 10%, white)` }"
                >{{ categoryLabel(selectedProject.category) }}</span>
                <h2 class="cd-proj-popup__name">{{ selectedProject.name }}</h2>
                <p v-if="selectedProject.goal" class="cd-proj-popup__goal">{{ selectedProject.goal }}</p>
              </div>
              <button class="cd-proj-popup__close" @click="closeProject">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5l10 10" stroke="#888" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </button>
            </div>

            <!-- 주차별 커리큘럼 -->
            <div class="cd-proj-popup__body">
              <div v-if="!selectedProject.curriculum?.length" class="cd-proj-popup__empty">
                등록된 주차별 계획이 없습니다
              </div>
              <div
                v-for="week in selectedProject.curriculum"
                :key="week.week"
                class="cd-proj-popup__week"
              >
                <div class="cd-proj-popup__week-header">
                  <span
                    class="cd-proj-popup__week-badge"
                    :style="{ background: categoryColorMap[selectedProject.category] }"
                  >{{ week.week }}주차</span>
                  <span class="cd-proj-popup__week-title">{{ week.title }}</span>
                </div>
                <ul v-if="week.items?.length" class="cd-proj-popup__items">
                  <li v-for="(item, i) in week.items" :key="i" class="cd-proj-popup__item">
                    {{ item }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 하단 버튼 -->
    <div class="cd-result__footer">
      <button class="cd-result__btn-secondary" @click="router.push('/career-design/complete')">
        계획 수정하기
      </button>
      <button class="cd-result__btn-primary" @click="router.push('/')">
        프로젝트 시작하기
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCareerDesign } from '../composables/useCareerDesign'
import CdYellowHeader from '../components/CdYellowHeader.vue'
import type { Project, ProjectCategory } from '../types/career-design'

const router = useRouter()
const { draftPlan, draftTimeline } = useCareerDesign()

const selectedProject = ref<Project | null>(null)
const openProject  = (p: Project) => { selectedProject.value = p }
const closeProject = () => { selectedProject.value = null }

const categories: { value: ProjectCategory; label: string }[] = [
  { value: 'qualification', label: '자격요건' },
  { value: 'knowledge',     label: '분야지식' },
  { value: 'skill',         label: '직무기술' },
  { value: 'portfolio',     label: '포트폴리오' },
]
const categoryColorMap: Record<ProjectCategory, string> = {
  qualification: '#1DB95A',
  knowledge:     '#F47820',
  skill:         '#A855F7',
  portfolio:     '#4480F5',
}
const categoryLabel = (cat: ProjectCategory) => categories.find(c => c.value === cat)?.label ?? ''

const filledSlots = computed(() => draftTimeline.value.filter(s => s.projects.length > 0))

const placedProjectIds = computed(() =>
  new Set(filledSlots.value.flatMap(s => s.projects.map(p => p.id)))
)
const placedCount = computed(() => placedProjectIds.value.size)

const unplacedProjects = computed(() =>
  draftPlan.projects.filter(p => !placedProjectIds.value.has(p.id))
)

const periodLabel = computed(() => {
  const { startDate, endDate } = draftPlan
  if (!startDate) return ''
  const fmt = (d: string) => { const [y, m] = d.split('-'); return `${y}.${m}` }
  return endDate ? `${fmt(startDate)} ~ ${fmt(endDate)}` : fmt(startDate)
})
</script>

<style lang="scss">
.cd-result {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;

  &__body {
    flex: 1;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* 요약 카드 */
  &__summary {
    background: #fff;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__target {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__target-icon { font-size: 18px; }

  &__target-job {
    font-size: 18px;
    font-weight: 700;
    color: #222;
  }

  &__period-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__period {
    font-size: 13px;
    color: #888;
  }

  &__stats {
    font-size: 12px;
    font-weight: 600;
    color: #FFC700;
    background: #FFFBEC;
    padding: 3px 10px;
    border-radius: 20px;
  }

  /* 섹션 공통 */
  &__section {
    background: #fff;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;

    &--unplaced { gap: 12px; }
  }

  &__section-title {
    font-size: 15px;
    font-weight: 700;
    color: #222;
  }

  &__empty {
    font-size: 13px;
    color: #ccc;
    text-align: center;
    padding: 20px 0;
  }

  /* 타임라인 세로형 */
  &__timeline {
    display: flex;
    flex-direction: column;
  }

  &__month {
    display: flex;
    gap: 14px;
  }

  &__month-left {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-shrink: 0;
    padding-top: 3px;
  }

  &__month-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #FFC700;
    border: 2px solid #fff;
    box-shadow: 0 0 0 2px #FFC700;
    flex-shrink: 0;
  }

  &__month-line {
    flex: 1;
    width: 2px;
    background: #eee;
    margin: 4px 0 0;
  }

  &__month-right {
    flex: 1;
    padding-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__month-badge {
    font-size: 13px;
    font-weight: 700;
    color: #222;
    display: inline-block;
    margin-top: -2px;
  }

  &__projects {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__project {
    background: #fafafa;
    border: 1px solid #eee;
    border-left: 3px solid;
    border-radius: 10px;
    padding: 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    cursor: pointer;
    transition: background 0.12s;

    &:hover { background: #f0f0f0; }
  }

  &__project-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__project-name {
    font-size: 14px;
    font-weight: 600;
    color: #222;
    flex: 1;
  }

  &__project-cat {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 10px;
    white-space: nowrap;
  }

  &__project-goal {
    font-size: 12px;
    color: #888;
    line-height: 1.4;
  }

  /* 미배치 */
  &__unplaced-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__unplaced-chip {
    border: 1.5px solid;
    border-radius: 20px;
    padding: 5px 12px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.12s;

    &:hover { opacity: 0.7; }
  }

  /* 하단 버튼 */
  &__footer {
    padding: 16px 20px 32px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__btn-secondary {
    width: 100%;
    padding: 16px;
    background: #fff;
    border: 2px solid #FFC700;
    border-radius: 16px;
    font-size: 16px;
    font-weight: 600;
    color: #CC9D00;
    cursor: pointer;

    &:active { opacity: 0.85; }
  }

  &__btn-primary {
    width: 100%;
    padding: 18px;
    background: #FFC700;
    border: none;
    border-radius: 16px;
    font-size: 17px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;

    &:active { opacity: 0.85; }
  }
}

/* ── 프로젝트 상세 팝업 ─────────────────────────── */
.cd-proj-popup {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: flex-end;

  &__sheet {
    width: 100%;
    max-height: 80vh;
    background: #fff;
    border-radius: 20px 20px 0 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  &__handle {
    width: 36px;
    height: 4px;
    background: #ddd;
    border-radius: 2px;
    margin: 12px auto 4px;
    flex-shrink: 0;
  }

  &__header {
    padding: 14px 20px 16px;
    border-left: 4px solid;
    margin: 0 20px;
    border-radius: 2px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex-shrink: 0;
  }

  &__header-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__cat {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 10px;
    align-self: flex-start;
  }

  &__name {
    font-size: 17px;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0;
    line-height: 1.3;
  }

  &__goal {
    font-size: 13px;
    color: #888;
    margin: 0;
    line-height: 1.4;
  }

  &__close {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #F5F5F5;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    margin-top: 2px;
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px 32px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__empty {
    font-size: 13px;
    color: #bbb;
    text-align: center;
    padding: 24px 0;
  }

  &__week {
    background: #fafafa;
    border: 1px solid #eee;
    border-radius: 12px;
    overflow: hidden;
  }

  &__week-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border-bottom: 1px solid #eee;
  }

  &__week-badge {
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    padding: 2px 8px;
    border-radius: 10px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__week-title {
    font-size: 13px;
    font-weight: 600;
    color: #222;
  }

  &__items {
    list-style: none;
    margin: 0;
    padding: 8px 14px 10px 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__item {
    font-size: 13px;
    color: #555;
    padding-left: 12px;
    position: relative;
    line-height: 1.4;

    &::before {
      content: '·';
      position: absolute;
      left: 0;
      color: #bbb;
    }
  }
}

/* 팝업 트랜지션 */
.cd-popup-enter-active,
.cd-popup-leave-active {
  transition: opacity 0.22s ease;

  .cd-proj-popup__sheet {
    transition: transform 0.22s ease;
  }
}
.cd-popup-enter-from,
.cd-popup-leave-to {
  opacity: 0;

  .cd-proj-popup__sheet {
    transform: translateY(100%);
  }
}
</style>

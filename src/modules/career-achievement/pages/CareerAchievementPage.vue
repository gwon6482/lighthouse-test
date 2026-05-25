<template>
  <div class="ca">
    <AppHeader />

    <!-- 타이틀 -->
    <div class="ca__hero">
      <h1 class="ca__title">진로달성</h1>
      <p class="ca__subtitle">일일이 쌓여가는 오늘의 기록이 꿈을 완성해요</p>
    </div>

    <!-- 날짜 + 진행 일차 -->
    <div class="ca__date-row">
      <span class="ca__date">{{ todayLabel }}</span>
      <span v-if="daysSinceStart !== null" class="ca__day-counter">
        진로계획 <strong>{{ daysSinceStart }}</strong>일차
      </span>
    </div>

    <!-- 활성 진로계획 없음 -->
    <div v-if="!loading && !hasPlan" class="ca__empty">
      <div class="ca__empty-icon">🏆</div>
      <p class="ca__empty-text">아직 진로계획이 없어요</p>
      <button class="ca__empty-btn" @click="router.push('/career-design')">진로계획 만들러 가기</button>
    </div>

    <template v-else-if="hasPlan">
      <!-- 이번 주 진행률 -->
      <div class="ca__week-card">
        <div class="ca__week-head">
          <div>
            <span class="ca__week-label">이번 주</span>
            <div class="ca__week-percent">{{ week.percent }}<span class="ca__week-percent-unit">%</span></div>
          </div>
          <div class="ca__week-meta">
            <span class="ca__week-meta-row"><strong>{{ week.done }}</strong> / {{ week.planned }} 완료</span>
          </div>
        </div>

        <div class="ca__week-bar">
          <div class="ca__week-bar-fill" :style="{ width: `${week.percent}%` }" />
        </div>

        <div class="ca__week-days">
          <div
            v-for="(d, i) in weekDates"
            :key="i"
            class="ca__week-day"
            :class="{
              'ca__week-day--today': isSameDate(d, today),
              'ca__week-day--past':  d < today && !isSameDate(d, today),
            }"
          >
            <span class="ca__week-day-label">{{ dowLabel(d) }}</span>
            <div class="ca__week-day-circle" :class="circleClass(d)">
              <span v-if="dayStatus(d) === 'done'">✓</span>
              <span v-else>{{ d.getDate() }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 오늘의 루틴 -->
      <div v-if="todayRoutinesList.length" class="ca__section">
        <h3 class="ca__section-title">오늘의 루틴</h3>
        <div class="ca__list">
          <div
            v-for="r in todayRoutinesList"
            :key="r.id"
            class="ca__card ca__card--routine"
            :class="{ 'ca__card--done': isRoutineDone(r.id) }"
          >
            <button class="ca__check" :class="{ 'ca__check--done': isRoutineDone(r.id) }" @click="toggleRoutine(r.id)">
              <span v-if="isRoutineDone(r.id)">✓</span>
            </button>
            <div class="ca__card-body">
              <span class="ca__card-name">{{ r.name }}</span>
              <span class="ca__card-meta">
                {{ r.duration }}분
                <template v-if="r.notification"> · 🔔 {{ r.notificationTime }}</template>
              </span>
            </div>
            <button class="ca__start" :disabled="isRoutineDone(r.id)" @click="startRoutine(r)">시작</button>
          </div>
        </div>
      </div>

      <!-- 오늘의 할일 (프로젝트) -->
      <div v-if="todayProjectsList.length" class="ca__section">
        <h3 class="ca__section-title">오늘의 할일</h3>
        <div class="ca__list">
          <div
            v-for="p in todayProjectsList"
            :key="p.id"
            class="ca__card"
            :class="{ 'ca__card--done': isProjectDone(p.id) }"
            :style="{ borderLeftColor: categoryColor(p.category) }"
          >
            <button class="ca__check" :class="{ 'ca__check--done': isProjectDone(p.id) }" @click="toggleProject(p.id)">
              <span v-if="isProjectDone(p.id)">✓</span>
            </button>
            <div class="ca__card-body">
              <div class="ca__card-top">
                <span class="ca__card-name">{{ p.name }}</span>
                <span
                  class="ca__card-cat"
                  :style="{ color: categoryColor(p.category), background: `color-mix(in srgb, ${categoryColor(p.category)} 12%, white)` }"
                >{{ categoryLabel(p.category) }}</span>
              </div>
              <span class="ca__card-meta">{{ p.duration }}분<template v-if="p.goal"> · {{ p.goal }}</template></span>
            </div>
            <button class="ca__start" :disabled="isProjectDone(p.id)" @click="startProject(p)">시작</button>
          </div>
        </div>
      </div>

      <!-- 오늘 할일 없음 -->
      <div v-if="!todayRoutinesList.length && !todayProjectsList.length" class="ca__rest">
        <span class="ca__rest-icon">☕</span>
        <p class="ca__rest-text">오늘은 예정된 할일이 없어요. 푹 쉬어요!</p>
      </div>
    </template>

    <div v-if="loading" class="ca__loading">불러오는 중...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/shared/components/AppHeader.vue'
import { useCareerDesign } from '@/modules/career-design/composables/useCareerDesign'
import { useAchievement } from '../composables/useAchievement'
import type { Project, Routine, ProjectCategory } from '@/modules/career-design/types/career-design'

const router = useRouter()
const { draftPlan, draftTimeline, fetchMyPlans, loadPlanFromApi } = useCareerDesign()
const {
  today, weekDates, todayRoutines, todayProjects,
  isProjectDone, isRoutineDone, toggleProject, toggleRoutine,
  plannedCount, doneCount, weekProgress, toDateKey,
} = useAchievement()

const loading = ref(true)

const todayLabel = computed(() => {
  const d = today.value
  const dow = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${dow})`
})

const daysSinceStart = computed<number | null>(() => {
  if (!draftPlan.startDate) return null
  const [y, m, d] = draftPlan.startDate.split('-').map(Number)
  if (!y || !m || !d) return null
  const start = new Date(y, m - 1, d)
  start.setHours(0, 0, 0, 0)
  const now = new Date(today.value)
  now.setHours(0, 0, 0, 0)
  const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return diff < 1 ? null : diff
})

const hasPlan = computed(() => !!draftPlan.planId)

const todayRoutinesList = computed(() => todayRoutines(draftPlan.routines))

const timelineForCalc = computed(() =>
  draftTimeline.value.map(s => ({ month: s.month, projects: s.projects.map(p => ({ id: p.id })) }))
)

const todayProjectsList = computed(() =>
  todayProjects(draftPlan.projects, timelineForCalc.value, draftPlan.startDate, draftPlan.endDate)
)

const week = computed(() =>
  weekProgress(draftPlan.projects, draftPlan.routines, timelineForCalc.value, draftPlan.startDate, draftPlan.endDate)
)

// 카테고리
const categories: Record<ProjectCategory, { label: string; color: string }> = {
  qualification: { label: '자격요건',   color: '#1DB95A' },
  knowledge:     { label: '분야지식',   color: '#F47820' },
  skill:         { label: '직무기술',   color: '#A855F7' },
  portfolio:     { label: '포트폴리오', color: '#4480F5' },
}
const categoryLabel = (c: ProjectCategory) => categories[c]?.label ?? ''
const categoryColor = (c: ProjectCategory) => categories[c]?.color ?? '#aaa'

// 주간 캘린더 도우미
function dowLabel(d: Date): string {
  return ['일', '월', '화', '수', '목', '금', '토'][d.getDay()]!
}

function isSameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function dayStatus(d: Date): 'none' | 'partial' | 'done' {
  const planned = plannedCount(d, draftPlan.projects, draftPlan.routines, timelineForCalc.value, draftPlan.startDate, draftPlan.endDate)
  if (!planned) return 'none'
  const done = doneCount(d)
  if (done === 0) return 'none'
  if (done >= planned) return 'done'
  return 'partial'
}

function circleClass(d: Date) {
  const st = dayStatus(d)
  return {
    'ca__week-day-circle--done':    st === 'done',
    'ca__week-day-circle--partial': st === 'partial',
    'ca__week-day-circle--today':   isSameDate(d, today.value),
  }
}

// 시작 버튼 — 다음 작업에서 실제 시작 페이지 라우팅 연결
function startProject(_p: Project) {
  alert('프로젝트 시작 화면은 다음 작업에서 구현됩니다.')
}

function startRoutine(_r: Routine) {
  alert('루틴 시작 화면은 다음 작업에서 구현됩니다.')
}

// 초기 로드: 가장 최근 활성 진로계획 1건 로드
onMounted(async () => {
  try {
    const plans = await fetchMyPlans()
    const target = plans.find((p: any) => p.status === 'active') ?? plans[0]
    if (target?.planId) {
      await loadPlanFromApi(target.planId)
    }
  } finally {
    loading.value = false
  }
})

// 사용하지 않는 import 경고 방지
void toDateKey
</script>

<style lang="scss">
.ca {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;
  padding-bottom: 32px;

  &__hero {
    padding: 28px 20px 8px;
    text-align: center;
  }

  &__title {
    font-size: 26px;
    font-weight: 800;
    color: #222;
    margin: 0 0 8px;
    letter-spacing: -0.4px;

    &::before {
      content: '';
      display: block;
      width: 36px;
      height: 4px;
      background: linear-gradient(90deg, #FFC700, #FFB300);
      border-radius: 2px;
      margin: 0 auto 12px;
    }
  }

  &__subtitle {
    font-size: 13px;
    color: #888;
    margin: 0;
    line-height: 1.6;
  }

  &__date-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 16px 16px 12px;
    padding: 10px 16px;
    background: #fff;
    border-radius: 12px;
    border: 1px solid #EEEEE8;
  }

  &__date {
    font-size: 13px;
    font-weight: 700;
    color: #444;
  }

  &__day-counter {
    font-size: 12px;
    color: #888;
    background: #FFFBEC;
    border-radius: 8px;
    padding: 4px 10px;

    strong {
      color: #CC9D00;
      font-weight: 800;
      font-size: 13px;
    }
  }

  &__loading {
    padding: 40px;
    text-align: center;
    color: #aaa;
  }

  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 60px 20px;
  }

  &__empty-icon { font-size: 48px; }
  &__empty-text { color: #aaa; margin: 0; }
  &__empty-btn {
    margin-top: 8px;
    background: #FFC700;
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 12px 24px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  /* 이번 주 카드 */
  &__week-card {
    background: linear-gradient(135deg, #FFC700 0%, #FFB300 100%);
    color: #fff;
    border-radius: 18px;
    padding: 20px;
    margin: 0 16px 12px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-shadow: 0 4px 16px rgba(255, 199, 0, 0.25);
  }

  &__week-head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
  }

  &__week-label {
    font-size: 12px;
    font-weight: 600;
    opacity: 0.9;
  }

  &__week-percent {
    font-size: 40px;
    font-weight: 800;
    line-height: 1;
    margin-top: 4px;
  }

  &__week-percent-unit {
    font-size: 22px;
    font-weight: 700;
    margin-left: 2px;
  }

  &__week-meta {
    text-align: right;
    font-size: 13px;
    opacity: 0.95;

    strong { font-weight: 800; font-size: 15px; }
  }

  &__week-bar {
    height: 6px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
    overflow: hidden;
  }

  &__week-bar-fill {
    height: 100%;
    background: #fff;
    border-radius: 3px;
    transition: width 0.3s;
  }

  &__week-days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }

  &__week-day {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  &__week-day-label {
    font-size: 11px;
    opacity: 0.85;
    font-weight: 600;
  }

  &__week-day-circle {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.25);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;

    &--done {
      background: #fff;
      color: #FFC700;
    }

    &--partial {
      background: rgba(255, 255, 255, 0.7);
      color: #CC8800;
    }

    &--today {
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.85);
    }
  }

  /* 섹션 공통 */
  &__section {
    margin: 8px 16px 12px;
    background: #fff;
    border-radius: 16px;
    padding: 16px 16px 18px;
  }

  &__section-title {
    font-size: 14px;
    font-weight: 800;
    color: #222;
    margin: 0 0 12px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: #fafafa;
    border: 1px solid #eee;
    border-left: 3px solid transparent;
    border-radius: 12px;
    transition: opacity 0.15s;

    &--routine {
      border-left-color: #FFC700;
      background: #FFFBEC;
      border-color: #FFE99A;
    }

    &--done {
      opacity: 0.5;
      .ca__card-name { text-decoration: line-through; }
    }
  }

  &__check {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid #ccc;
    background: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 13px;
    padding: 0;

    &--done {
      background: #1DB95A;
      border-color: #1DB95A;
    }
  }

  &__card-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__card-top {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__card-name {
    font-size: 14px;
    font-weight: 600;
    color: #222;
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__card-cat {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 8px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__card-meta {
    font-size: 11px;
    color: #888;
  }

  &__start {
    flex-shrink: 0;
    background: #FFC700;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;

    &:disabled {
      background: #ddd;
      color: #aaa;
      cursor: not-allowed;
    }
  }

  &__rest {
    margin: 8px 16px;
    background: #fff;
    border-radius: 16px;
    padding: 32px 20px;
    text-align: center;
  }

  &__rest-icon { font-size: 36px; }
  &__rest-text { color: #888; font-size: 13px; margin: 10px 0 0; }
}
</style>

<template>
  <div class="ca">
    <AppHeader />

    <!-- 활성 진로계획 없음 -->
    <div v-if="!loading && !hasPlan" class="ca__empty">
      <div class="ca__empty-icon">🏆</div>
      <p class="ca__empty-text">아직 진로계획이 없어요</p>
      <button class="ca__empty-btn" @click="router.push('/career-design')">진로계획 만들러 가기</button>
    </div>

    <template v-else-if="hasPlan">
      <!-- 진로계획 hero (N일차 타이틀급 + 타임라인 단계) -->
      <div class="ca__plan-hero">
        <span class="ca__plan-date">{{ todayLabel }}</span>
        <div class="ca__plan-counter">
          <span class="ca__plan-counter-label">진로계획</span>
          <span class="ca__plan-counter-num">{{ daysSinceStart ?? 1 }}</span>
          <span class="ca__plan-counter-unit">일차</span>
        </div>
        <template v-if="month">
          <div class="ca__plan-stage">
            <span class="ca__plan-stage-month">{{ month.monthLabel }}</span>
            <span class="ca__plan-stage-meta"><strong>{{ month.current }}</strong> / {{ month.total }} 단계</span>
          </div>
          <div class="ca__plan-stage-bar">
            <div class="ca__plan-stage-bar-fill" :style="{ width: `${(month.current / month.total) * 100}%` }" />
          </div>
        </template>
      </div>

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

      <!-- 오늘의 할일 (프로젝트) - 강조 -->
      <div v-if="todayProjectsList.length" class="ca__section ca__section--primary">
        <h3 class="ca__section-title ca__section-title--primary">오늘의 할일</h3>
        <div class="ca__list ca__list--primary">
          <div
            v-for="p in todayProjectsList"
            :key="p.id"
            class="ca__pcard"
            :class="{ 'ca__pcard--done': isProjectDone(p.id) }"
            :style="{ '--cat-color': categoryColor(p.category) } as any"
          >
            <div class="ca__pcard-head">
              <span
                class="ca__pcard-cat"
                :style="{ color: categoryColor(p.category), background: `color-mix(in srgb, ${categoryColor(p.category)} 14%, white)` }"
              >{{ categoryLabel(p.category) }}</span>
              <button
                class="ca__pcard-check"
                :class="{ 'ca__pcard-check--done': isProjectDone(p.id) }"
                @click="toggleProject(p.id)"
                :aria-label="isProjectDone(p.id) ? '완료 취소' : '완료 표시'"
              >
                <span v-if="isProjectDone(p.id)">✓</span>
              </button>
            </div>
            <h4 class="ca__pcard-name">{{ p.name }}</h4>
            <p v-if="p.goal" class="ca__pcard-goal">{{ p.goal }}</p>
            <div class="ca__pcard-bottom">
              <span class="ca__pcard-meta">⏱ {{ p.duration }}분</span>
              <button class="ca__pcard-start" :disabled="isProjectDone(p.id)" @click="startProject(p)">
                {{ isProjectDone(p.id) ? '완료됨' : '시작하기' }}
              </button>
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
            <div class="ca__card-body">
              <span class="ca__card-name">{{ r.name }}</span>
              <span class="ca__card-meta">
                {{ r.duration }}분
                <template v-if="r.notification"> · 🔔 {{ r.notificationTime }}</template>
              </span>
            </div>
            <button
              class="ca__rdone"
              :class="{ 'ca__rdone--done': isRoutineDone(r.id) }"
              @click="toggleRoutine(r.id)"
            >
              <span v-if="isRoutineDone(r.id)">✓ 완료</span>
              <span v-else>완료</span>
            </button>
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
import type { Project, ProjectCategory } from '@/modules/career-design/types/career-design'


const router = useRouter()
const { draftPlan, draftTimeline, fetchMyPlans, loadPlanFromApi } = useCareerDesign()
const {
  today, weekDates, todayRoutines, todayProjects,
  isProjectDone, isRoutineDone, toggleProject, toggleRoutine,
  plannedCount, doneCount, weekProgress, monthProgress, toDateKey,
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

const month = computed(() => monthProgress(timelineForCalc.value))

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

function startProject(p: Project) {
  router.push({ path: `/career-achievement/start/project/${p.id}`, query: { date: toDateKey(today.value) } })
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

</script>

<style lang="scss">
.ca {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;
  padding-bottom: 32px;

  /* ── 진로계획 hero (N일차 + 타임라인 단계) ── */
  &__plan-hero {
    margin: 16px 16px 12px;
    padding: 22px 22px 20px;
    border-radius: 22px;
    background: linear-gradient(135deg, #FFC700 0%, #FFB300 100%);
    color: #fff;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 0 6px 20px rgba(255, 199, 0, 0.28);
  }

  &__plan-date {
    font-size: 12px;
    font-weight: 700;
    opacity: 0.92;
    letter-spacing: 0.2px;
  }

  &__plan-counter {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-top: -2px;
  }

  &__plan-counter-label {
    font-size: 16px;
    font-weight: 700;
    opacity: 0.95;
  }

  &__plan-counter-num {
    font-size: 44px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.5px;
  }

  &__plan-counter-unit {
    font-size: 18px;
    font-weight: 700;
    opacity: 0.95;
  }

  &__plan-stage {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-top: 4px;
    font-size: 13px;
    font-weight: 700;
    opacity: 0.95;
  }

  &__plan-stage-month { font-weight: 700; }
  &__plan-stage-meta {
    font-size: 12px;
    opacity: 0.9;
    strong { font-weight: 800; font-size: 14px; }
  }

  &__plan-stage-bar {
    height: 7px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    overflow: hidden;
  }

  &__plan-stage-bar-fill {
    height: 100%;
    background: #fff;
    border-radius: 4px;
    transition: width 0.3s;
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

    &--primary {
      background: transparent;
      padding: 4px 0 12px;
      margin: 12px 16px 8px;
    }
  }

  &__section-title {
    font-size: 14px;
    font-weight: 800;
    color: #222;
    margin: 0 0 12px;

    &--primary {
      font-size: 17px;
      margin: 0 4px 12px;

      &::before {
        content: '';
        display: inline-block;
        width: 4px;
        height: 16px;
        background: #FFC700;
        border-radius: 2px;
        vertical-align: -2px;
        margin-right: 8px;
      }
    }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;

    &--primary { gap: 12px; }
  }

  /* ── 오늘의 할일 (강조 카드) ── */
  &__pcard {
    background: #fff;
    border: 1px solid #EEEEE8;
    border-left: 4px solid var(--cat-color, #FFC700);
    border-radius: 16px;
    padding: 16px 18px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
    transition: opacity 0.15s;

    &--done {
      opacity: 0.55;
      .ca__pcard-name { text-decoration: line-through; }
    }
  }

  &__pcard-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__pcard-cat {
    font-size: 11px;
    font-weight: 800;
    padding: 4px 10px;
    border-radius: 10px;
    white-space: nowrap;
  }

  &__pcard-check {
    flex-shrink: 0;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 2px solid #ddd;
    background: #fff;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 14px;
    padding: 0;
    transition: background 0.15s, border-color 0.15s;

    &--done {
      background: #1DB95A;
      border-color: #1DB95A;
    }
  }

  &__pcard-name {
    font-size: 17px;
    font-weight: 800;
    color: #222;
    margin: 0;
    letter-spacing: -0.2px;
  }

  &__pcard-goal {
    font-size: 13px;
    color: #666;
    margin: -4px 0 0;
    line-height: 1.5;
  }

  &__pcard-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 4px;
  }

  &__pcard-meta {
    font-size: 12px;
    color: #888;
    font-weight: 600;
  }

  &__pcard-start {
    background: #FFC700;
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 11px 22px;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 3px 8px rgba(255, 199, 0, 0.35);
    transition: transform 0.1s;

    &:active { transform: scale(0.97); }

    &:disabled {
      background: #e8e8e8;
      color: #aaa;
      cursor: not-allowed;
      box-shadow: none;
    }
  }

  /* ── 오늘의 루틴 (간략 카드 + 완료 토글) ── */
  &__card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: #fafafa;
    border: 1px solid #eee;
    border-radius: 12px;
    transition: opacity 0.15s;

    &--routine {
      background: #FFFBEC;
      border-color: #FFE99A;
    }

    &--done {
      opacity: 0.55;
      .ca__card-name { text-decoration: line-through; }
    }
  }

  &__card-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__card-name {
    font-size: 14px;
    font-weight: 700;
    color: #222;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__card-meta {
    font-size: 11px;
    color: #888;
  }

  &__rdone {
    flex-shrink: 0;
    background: #fff;
    color: #CC9D00;
    border: 1.5px solid #FFD84D;
    border-radius: 10px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;

    &--done {
      background: #1DB95A;
      border-color: #1DB95A;
      color: #fff;
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

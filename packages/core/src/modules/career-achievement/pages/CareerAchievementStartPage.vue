<template>
  <div class="cas">
    <header class="cas__header">
      <button class="cas__back" @click="confirmExit">←</button>
      <span class="cas__header-title">집중 모드</span>
      <span class="cas__header-spacer" />
    </header>

    <div v-if="loading" class="cas__loading">불러오는 중...</div>

    <template v-else-if="item">
      <!-- 항목 정보 -->
      <div class="cas__item">
        <span
          v-if="categoryInfo"
          class="cas__item-cat"
          :style="{ color: categoryInfo.color, background: `color-mix(in srgb, ${categoryInfo.color} 12%, white)` }"
        >{{ categoryInfo.label }}</span>
        <span v-else class="cas__item-cat cas__item-cat--routine">루틴</span>
        <h2 class="cas__item-name">{{ item.name }}</h2>
        <p v-if="projectGoal" class="cas__item-goal">{{ projectGoal }}</p>
        <span class="cas__item-meta">계획 시간 · {{ item.duration }}분</span>
      </div>

      <!-- 타이머 -->
      <div class="cas__timer-box">
        <div class="cas__timer">{{ formatted }}</div>
        <div class="cas__timer-state">
          <span v-if="!started">시작 버튼을 누르면 시간이 흐릅니다</span>
          <span v-else-if="paused">일시정지됨</span>
          <span v-else>진행 중</span>
        </div>
      </div>

      <!-- 컨트롤 -->
      <div class="cas__controls">
        <button v-if="!started" class="cas__btn cas__btn--primary" @click="start">시작</button>
        <template v-else>
          <button class="cas__btn cas__btn--ghost" @click="togglePause">
            {{ paused ? '재개' : '일시정지' }}
          </button>
          <button class="cas__btn cas__btn--primary" @click="finish">완료</button>
        </template>
      </div>
    </template>

    <div v-else-if="!loading" class="cas__empty">
      <p>항목을 찾을 수 없어요.</p>
      <button class="cas__btn cas__btn--ghost" @click="router.replace('/career-achievement')">돌아가기</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router'
import { useCareerDesign } from '@/modules/career-design/composables/useCareerDesign'
import type { Project, Routine, ProjectCategory } from '@/modules/career-design/types/career-design'

const route = useRoute()
const router = useRouter()
const { draftPlan, fetchMyPlans, loadPlanFromApi } = useCareerDesign()

const itemType = computed<'project' | 'routine'>(() => (route.params.type === 'routine' ? 'routine' : 'project'))
const itemId = computed(() => String(route.params.id ?? ''))
const dateKey = computed(() => String(route.query.date ?? toTodayKey()))

function toTodayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const loading = ref(true)

const item = computed<Project | Routine | null>(() => {
  if (!itemId.value) return null
  if (itemType.value === 'project') {
    return draftPlan.projects.find(p => p.id === itemId.value) ?? null
  }
  return draftPlan.routines.find(r => r.id === itemId.value) ?? null
})

const categories: Record<ProjectCategory, { label: string; color: string }> = {
  qualification: { label: '자격요건',   color: '#1DB95A' },
  knowledge:     { label: '분야지식',   color: '#F47820' },
  skill:         { label: '직무기술',   color: '#A855F7' },
  portfolio:     { label: '포트폴리오', color: '#4480F5' },
}

const categoryInfo = computed(() => {
  if (itemType.value !== 'project') return null
  const cat = (item.value as Project | null)?.category
  return cat ? categories[cat] : null
})

const projectGoal = computed(() => {
  if (itemType.value !== 'project') return ''
  return (item.value as Project | null)?.goal ?? ''
})

// ── 카운트업 타이머 ─────────────────────────────────
const elapsedSec = ref(0)
const started = ref(false)
const paused = ref(false)
let intervalId: number | null = null

function tick() {
  if (!paused.value) elapsedSec.value += 1
}

function start() {
  started.value = true
  paused.value = false
  if (intervalId === null) intervalId = window.setInterval(tick, 1000)
}

function togglePause() {
  paused.value = !paused.value
}

function clearTimer() {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

const formatted = computed(() => {
  const s = elapsedSec.value
  const hh = String(Math.floor(s / 3600)).padStart(2, '0')
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
})

function finish() {
  clearTimer()
  bypassLeaveGuard = true
  router.replace({
    path: `/career-achievement/complete/${itemType.value}/${itemId.value}`,
    query: { date: dateKey.value, elapsed: String(elapsedSec.value) },
  })
}

let bypassLeaveGuard = false

function confirmExit() {
  if (started.value && elapsedSec.value > 0) {
    if (!confirm('진행 중인 기록이 사라져요. 정말 나가시겠어요?')) return
  }
  bypassLeaveGuard = true
  router.back()
}

onBeforeRouteLeave((_to, _from, next) => {
  if (!bypassLeaveGuard && started.value && elapsedSec.value > 0) {
    if (!confirm('진행 중인 기록이 사라져요. 정말 나가시겠어요?')) return next(false)
  }
  clearTimer()
  next()
})

onMounted(async () => {
  try {
    if (!draftPlan.planId) {
      const plans = await fetchMyPlans()
      const target = plans.find((p: any) => p.status === 'active') ?? plans[0]
      if (target?.planId) await loadPlanFromApi(target.planId)
    }
  } finally {
    loading.value = false
  }
})

onBeforeUnmount(() => clearTimer())
</script>

<style lang="scss">
.cas {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;

  &__header {
    position: sticky;
    top: 0;
    z-index: 10;
    display: grid;
    grid-template-columns: 44px 1fr 44px;
    align-items: center;
    height: 52px;
    padding: 0 8px;
    background: #fff;
    border-bottom: 1px solid #EEEEE8;
  }

  &__back {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    font-size: 20px;
    color: #444;
    cursor: pointer;
  }

  &__header-title {
    text-align: center;
    font-size: 14px;
    font-weight: 700;
    color: #222;
  }

  &__header-spacer { width: 44px; }

  &__loading {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #aaa;
  }

  &__item {
    margin: 24px 16px 0;
    background: #fff;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  &__item-cat {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 8px;

    &--routine {
      background: #FFFBEC;
      color: #CC9D00;
    }
  }

  &__item-name {
    font-size: 18px;
    font-weight: 800;
    color: #222;
    margin: 0;
  }

  &__item-goal {
    font-size: 13px;
    color: #666;
    margin: 0;
    line-height: 1.5;
  }

  &__item-meta {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
  }

  &__timer-box {
    flex: 1;
    margin: 24px 16px;
    background: linear-gradient(135deg, #FFC700 0%, #FFB300 100%);
    border-radius: 24px;
    padding: 56px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #fff;
    box-shadow: 0 6px 20px rgba(255, 199, 0, 0.25);
  }

  &__timer {
    font-size: 56px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    letter-spacing: 2px;
    line-height: 1;
  }

  &__timer-state {
    font-size: 13px;
    opacity: 0.9;
    font-weight: 600;
  }

  &__controls {
    display: flex;
    gap: 10px;
    margin: 0 16px 24px;
  }

  &__btn {
    flex: 1;
    height: 52px;
    border-radius: 14px;
    border: none;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;

    &--primary {
      background: #FFC700;
      color: #fff;
    }

    &--ghost {
      background: #fff;
      color: #444;
      border: 1px solid #ddd;
    }
  }

  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    color: #888;
  }
}
</style>

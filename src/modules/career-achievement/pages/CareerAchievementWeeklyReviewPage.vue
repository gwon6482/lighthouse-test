<template>
  <div class="wr">
    <header class="wr__header">
      <button class="wr__back" @click="router.back()">‹</button>
      <span class="wr__header-title">주간 리뷰</span>
      <span class="wr__header-spacer" />
    </header>

    <div v-if="loading" class="wr__loading">불러오는 중...</div>

    <template v-else-if="!draftPlan.planId">
      <div class="wr__empty">
        <span class="wr__empty-icon">📅</span>
        <h2 class="wr__empty-title">진로계획이 없어요</h2>
        <p class="wr__empty-text">먼저 진로계획을 만들어 주세요.</p>
        <button class="wr__empty-btn" @click="router.push('/career-design')">진로계획 만들기</button>
      </div>
    </template>

    <template v-else-if="!prevRange">
      <div class="wr__empty">
        <span class="wr__empty-icon">🌱</span>
        <h2 class="wr__empty-title">아직 리뷰할 한 주가 없어요</h2>
        <p class="wr__empty-text">첫 주를 보낸 뒤 다시 들러주세요.</p>
        <button class="wr__empty-btn" @click="router.replace('/career-achievement')">데일리로 가기</button>
      </div>
    </template>

    <template v-else>
      <!-- 지난 주 회고 -->
      <section class="wr__section">
        <div class="wr__section-head">
          <h2 class="wr__section-title">지난 주 회고</h2>
          <span class="wr__range">{{ fmtRange(prevRange) }}</span>
        </div>

        <div class="wr__metrics">
          <div class="wr__metric">
            <span class="wr__metric-icon">🎯</span>
            <span class="wr__metric-label">루틴 달성</span>
            <span class="wr__metric-value">
              <strong>{{ summary.routineDone }}</strong>
              <span class="wr__metric-slash">/ {{ summary.routinePlanned }}</span>
            </span>
            <span class="wr__metric-pct">{{ pct(summary.routineDone, summary.routinePlanned) }}%</span>
          </div>
          <div class="wr__metric">
            <span class="wr__metric-icon">✅</span>
            <span class="wr__metric-label">프로젝트 완료</span>
            <span class="wr__metric-value">
              <strong>{{ summary.projectDone }}</strong>
              <span class="wr__metric-slash">/ {{ summary.projectPlanned }}</span>
            </span>
            <span class="wr__metric-pct">{{ pct(summary.projectDone, summary.projectPlanned) }}%</span>
          </div>
        </div>

        <div v-if="missedRoutineNames.length" class="wr__missed">
          <span class="wr__missed-label">놓친 루틴</span>
          <div class="wr__missed-chips">
            <span v-for="name in missedRoutineNames" :key="name" class="wr__missed-chip">{{ name }}</span>
          </div>
        </div>

        <label class="wr__label">
          한 주 회고
          <span class="wr__label-hint">잘 된 점 · 아쉬운 점 · 다음 주 다짐</span>
        </label>
        <textarea
          v-model="reviewNote"
          class="wr__note"
          rows="6"
          maxlength="2000"
          placeholder="이번 한 주는 어땠나요? 다음 주에 어떻게 가져갈까요?"
        />
        <div class="wr__counter">{{ reviewNote.length }} / 2000</div>

        <button class="wr__save" :disabled="saving" @click="saveReview" type="button">
          {{ saving ? '저장 중...' : (prevSchedule?.status === 'reviewed' ? '회고 업데이트' : '회고 저장') }}
        </button>
        <p v-if="prevSchedule?.reviewedAt" class="wr__reviewed-at">
          마지막 저장: {{ fmtTimestamp(prevSchedule.reviewedAt) }}
        </p>
      </section>

      <!-- 다음 주 일정 (Phase 4b/4c 에서 채워짐) -->
      <section class="wr__section wr__section--placeholder">
        <h2 class="wr__section-title">다음 주 일정</h2>
        <p class="wr__placeholder-text">다음 주 일정 보기/편집은 곧 추가됩니다.</p>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCareerDesign } from '@/modules/career-design/composables/useCareerDesign'
import {
  useWeeklySchedule, computeWeekRangeContaining, parseDateKey, toDateKey,
} from '../composables/useWeeklySchedule'
import type { WeeklySchedule } from '../composables/useWeeklySchedule'
import { useAchievement } from '../composables/useAchievement'
import { getToday } from '@/shared/utils/dev-date'

const router = useRouter()
const { draftPlan, fetchMyPlans, loadPlanFromApi } = useCareerDesign()
const { fetchScheduleByWeek, updateSchedule } = useWeeklySchedule()
const { isProjectDone, isRoutineDone } = useAchievement()

const loading       = ref(true)
const saving        = ref(false)
const prevSchedule  = ref<WeeklySchedule | null>(null)
const reviewNote    = ref('')

// 오늘 기준 "직전 주" 범위 계산. 현재 주가 첫 주(직전 주가 plan.startDate 이전)면 null.
const prevRange = computed<{ weekStart: string; weekEnd: string } | null>(() => {
  if (!draftPlan.startDate || !draftPlan.reviewDay) return null
  const cur = computeWeekRangeContaining(getToday(), draftPlan.startDate, draftPlan.reviewDay)
  if (!cur) return null
  const curStart = parseDateKey(cur.weekStart)
  const planStart = parseDateKey(draftPlan.startDate)
  if (!curStart || !planStart) return null

  const prevEnd = new Date(curStart)
  prevEnd.setDate(prevEnd.getDate() - 1)
  if (prevEnd.getTime() < planStart.getTime()) return null

  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - 6)
  if (prevStart.getTime() < planStart.getTime()) {
    prevStart.setTime(planStart.getTime())
  }
  return { weekStart: toDateKey(prevStart), weekEnd: toDateKey(prevEnd) }
})

// 지난 주 schedule.items 기반 자동 요약
const summary = computed(() => {
  let rp = 0, rd = 0, pp = 0, pd = 0
  const items = prevSchedule.value?.items ?? []
  for (const it of items) {
    if (it.itemType === 'routine') {
      rp++
      if (isRoutineDone(it.itemId, it.date)) rd++
    } else {
      pp++
      if (isProjectDone(it.itemId, it.date)) pd++
    }
  }
  return { routinePlanned: rp, routineDone: rd, projectPlanned: pp, projectDone: pd }
})

// 놓친 루틴 이름 목록 (중복 제거)
const missedRoutineNames = computed<string[]>(() => {
  const items = prevSchedule.value?.items ?? []
  const set = new Set<string>()
  for (const it of items) {
    if (it.itemType !== 'routine') continue
    if (isRoutineDone(it.itemId, it.date)) continue
    const r = draftPlan.routines.find(x => x.id === it.itemId)
    if (r) set.add(r.name)
  }
  return Array.from(set)
})

function pct(done: number, planned: number): number {
  if (planned <= 0) return 100
  return Math.round((done / planned) * 100)
}

function fmtRange(r: { weekStart: string; weekEnd: string }): string {
  return `${fmtDateLabel(r.weekStart)} ~ ${fmtDateLabel(r.weekEnd)}`
}
function fmtDateLabel(s: string): string {
  const d = parseDateKey(s)
  if (!d) return s
  const DOW = ['일', '월', '화', '수', '목', '금', '토']
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]})`
}
function fmtTimestamp(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}.${m}.${dd} ${hh}:${mm}`
}

async function saveReview() {
  if (!draftPlan.planId || !prevRange.value) return
  saving.value = true
  try {
    const updated = await updateSchedule(draftPlan.planId, prevRange.value.weekStart, {
      reviewNote: reviewNote.value.trim(),
      status:     'reviewed',
    })
    if (updated) prevSchedule.value = updated
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    if (!draftPlan.planId) {
      const plans = await fetchMyPlans()
      const target = plans.find((p: any) => p.status === 'active') ?? plans[0]
      if (target?.planId) await loadPlanFromApi(target.planId)
    }
    if (draftPlan.planId && prevRange.value) {
      const s = await fetchScheduleByWeek(draftPlan.planId, prevRange.value.weekStart)
      prevSchedule.value = s
      if (s) reviewNote.value = s.reviewNote ?? ''
    }
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss">
.wr {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;
  padding-bottom: 32px;

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
    padding: 60px 20px;
    text-align: center;
    color: #aaa;
  }

  &__empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 60px 24px;
    text-align: center;
  }
  &__empty-icon { font-size: 48px; }
  &__empty-title { font-size: 17px; font-weight: 800; color: #222; margin: 4px 0 0; }
  &__empty-text  { font-size: 13px; color: #888; margin: 0; }
  &__empty-btn {
    margin-top: 12px;
    background: #FFC700;
    color: #fff;
    border: none;
    border-radius: 12px;
    padding: 12px 22px;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
  }

  &__section {
    margin: 16px 16px 0;
    background: #fff;
    border-radius: 16px;
    padding: 18px 18px 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__section--placeholder {
    background: #FAFAF7;
    border: 1px dashed #E5E5DD;
  }

  &__section-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  &__section-title {
    font-size: 16px;
    font-weight: 900;
    color: #222;
    margin: 0;
  }

  &__range {
    font-size: 12px;
    font-weight: 700;
    color: #888;
  }

  /* 메트릭 카드 row */
  &__metrics {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 2px;
  }

  &__metric {
    background: #FFFBEC;
    border: 1px solid #FFE99A;
    border-radius: 14px;
    padding: 14px 14px 12px;
    display: grid;
    grid-template-columns: 28px 1fr;
    grid-template-rows: auto auto;
    column-gap: 10px;
    row-gap: 2px;
  }

  &__metric-icon {
    grid-row: 1 / 3;
    align-self: center;
    font-size: 22px;
    text-align: center;
  }

  &__metric-label {
    font-size: 12px;
    font-weight: 700;
    color: #666;
    letter-spacing: 0.2px;
  }

  &__metric-value {
    font-size: 13px;
    font-weight: 700;
    color: #444;
    display: flex;
    align-items: baseline;
    gap: 3px;

    strong {
      font-size: 20px;
      font-weight: 900;
      color: #222;
      letter-spacing: -0.5px;
    }
  }
  &__metric-slash { color: #aaa; font-weight: 700; font-size: 13px; }

  &__metric-pct {
    grid-column: 1 / 3;
    text-align: right;
    margin-top: 2px;
    font-size: 11px;
    font-weight: 800;
    color: #B07800;
  }

  /* 놓친 루틴 chips */
  &__missed {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    background: #FFF5F5;
    border: 1px solid #FFD8D8;
    border-radius: 10px;
  }

  &__missed-label {
    font-size: 11px;
    font-weight: 800;
    color: #C5443A;
  }

  &__missed-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  &__missed-chip {
    font-size: 11px;
    font-weight: 700;
    color: #C5443A;
    background: #fff;
    border: 1px solid #FFCCC8;
    padding: 3px 8px;
    border-radius: 999px;
  }

  &__label {
    font-size: 13px;
    font-weight: 800;
    color: #222;
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-top: 2px;
  }
  &__label-hint {
    font-size: 11px;
    font-weight: 600;
    color: #aaa;
  }

  &__note {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #eee;
    border-radius: 10px;
    padding: 12px;
    font-size: 14px;
    line-height: 1.55;
    resize: vertical;
    font-family: inherit;
    background: #fafafa;
    color: #222;

    &:focus {
      outline: none;
      border-color: #FFC700;
      background: #fff;
    }
  }

  &__counter {
    text-align: right;
    font-size: 11px;
    color: #aaa;
    margin-top: -6px;
  }

  &__save {
    margin-top: 4px;
    background: #FFC700;
    border: none;
    border-radius: 14px;
    padding: 14px;
    font-size: 15px;
    font-weight: 800;
    color: #fff;
    cursor: pointer;
    transition: opacity 0.12s;

    &:active { opacity: 0.85; }

    &:disabled {
      background: #e8e8e8;
      color: #aaa;
      cursor: not-allowed;
    }
  }

  &__reviewed-at {
    text-align: right;
    font-size: 11px;
    color: #888;
    margin: -2px 2px 0;
  }

  &__placeholder-text {
    font-size: 13px;
    color: #888;
    margin: 0;
  }
}
</style>

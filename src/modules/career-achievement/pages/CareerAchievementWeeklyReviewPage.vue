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

      <!-- 다음 주 일정 -->
      <section v-if="nextRange" class="wr__section">
        <div class="wr__section-head">
          <h2 class="wr__section-title">다음 주 일정</h2>
          <span class="wr__range">{{ fmtRange(nextRange) }}</span>
        </div>

        <p class="wr__next-hint">
          다음 주 일정을 미리 보고 조정해 주세요. 변경사항은 자동으로 저장돼요.
          <span v-if="nextSaving" class="wr__autosave">저장 중...</span>
        </p>

        <div v-if="nextDays.length" class="wr__days">
          <div
            v-for="day in nextDays"
            :key="day.date"
            class="wr__day"
            :class="{ 'wr__day--empty': !day.items.length }"
          >
            <div class="wr__day-head">
              <span class="wr__day-dow">{{ day.dow }}</span>
              <span class="wr__day-date">{{ day.dateLabel }}</span>
              <span v-if="day.items.length" class="wr__day-count">{{ day.items.length }}</span>
              <button class="wr__day-add" @click="openAddSheet(day.date)" type="button">+ 추가</button>
            </div>
            <ul v-if="day.items.length" class="wr__day-items">
              <li
                v-for="it in day.items"
                :key="it.id"
                class="wr__day-item"
                :class="`wr__day-item--${it.itemType}`"
                :style="it.color ? { '--cat-color': it.color } as any : undefined"
              >
                <span
                  v-if="it.itemType === 'project'"
                  class="wr__day-item-cat"
                  :style="{ color: it.color, background: `color-mix(in srgb, ${it.color} 14%, white)` }"
                >{{ it.categoryLabel }}</span>
                <span v-else class="wr__day-item-cat wr__day-item-cat--routine">루틴</span>
                <span class="wr__day-item-name">{{ it.name }}</span>
                <span class="wr__day-item-meta">{{ it.duration }}분</span>
                <button
                  class="wr__day-item-remove"
                  @click="removeItem(it.id)"
                  type="button"
                  aria-label="삭제"
                >✕</button>
              </li>
            </ul>
            <p v-else class="wr__day-empty">예정된 일정 없음</p>
          </div>
        </div>
        <p v-else class="wr__placeholder-text">다음 주에 잡힌 일정이 없어요.</p>
      </section>
    </template>

    <!-- 항목 추가 bottom sheet -->
    <Teleport to="body">
      <Transition name="wr-sheet">
        <div v-if="addSheetOpen" class="wr-sheet" @click.self="closeAddSheet">
          <div class="wr-sheet__panel">
            <div class="wr-sheet__handle" />
            <div class="wr-sheet__head">
              <h3 class="wr-sheet__title">{{ addSheetDateLabel }} 에 추가</h3>
              <button class="wr-sheet__close" @click="closeAddSheet" type="button">✕</button>
            </div>

            <div class="wr-sheet__tabs">
              <button
                class="wr-sheet__tab"
                :class="{ 'wr-sheet__tab--active': addTab === 'project' }"
                @click="addTab = 'project'"
                type="button"
              >프로젝트 ({{ draftPlan.projects.length }})</button>
              <button
                class="wr-sheet__tab"
                :class="{ 'wr-sheet__tab--active': addTab === 'routine' }"
                @click="addTab = 'routine'"
                type="button"
              >루틴 ({{ draftPlan.routines.length }})</button>
            </div>

            <div class="wr-sheet__list">
              <template v-if="addTab === 'project'">
                <button
                  v-for="p in draftPlan.projects"
                  :key="p.id"
                  class="wr-sheet__row"
                  @click="addItem('project', p.id)"
                  type="button"
                >
                  <span
                    class="wr-sheet__row-dot"
                    :style="{ background: CAT_COLOR[p.category] }"
                  />
                  <div class="wr-sheet__row-body">
                    <span class="wr-sheet__row-name">{{ p.name }}</span>
                    <span class="wr-sheet__row-meta">{{ CAT_LABEL[p.category] }} · {{ p.duration }}분</span>
                  </div>
                  <span class="wr-sheet__row-plus">＋</span>
                </button>
                <p v-if="!draftPlan.projects.length" class="wr-sheet__empty">등록된 프로젝트가 없어요.</p>
              </template>

              <template v-else>
                <button
                  v-for="r in draftPlan.routines"
                  :key="r.id"
                  class="wr-sheet__row"
                  @click="addItem('routine', r.id)"
                  type="button"
                >
                  <span class="wr-sheet__row-dot" :style="{ background: '#FFD84D' }" />
                  <div class="wr-sheet__row-body">
                    <span class="wr-sheet__row-name">{{ r.name }}</span>
                    <span class="wr-sheet__row-meta">루틴 · {{ r.duration }}분</span>
                  </div>
                  <span class="wr-sheet__row-plus">＋</span>
                </button>
                <p v-if="!draftPlan.routines.length" class="wr-sheet__empty">등록된 루틴이 없어요.</p>
              </template>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
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
import type { ProjectCategory } from '@/modules/career-design/types/career-design'

const router = useRouter()
const { draftPlan, draftTimeline, fetchMyPlans, loadPlanFromApi } = useCareerDesign()
const { fetchScheduleByWeek, updateSchedule, ensureWeekSchedule } = useWeeklySchedule()
const { isProjectDone, isRoutineDone } = useAchievement()

const loading       = ref(true)
const saving        = ref(false)
const nextSaving    = ref(false)
const prevSchedule  = ref<WeeklySchedule | null>(null)
const nextSchedule  = ref<WeeklySchedule | null>(null)
const reviewNote    = ref('')

// 항목 추가 bottom sheet
const addSheetOpen = ref(false)
const addSheetDate = ref('')
const addTab       = ref<'project' | 'routine'>('project')

const addSheetDateLabel = computed(() => addSheetDate.value ? fmtDateLabel(addSheetDate.value) : '')

function openAddSheet(date: string) {
  addSheetDate.value = date
  addTab.value = 'project'
  addSheetOpen.value = true
}
function closeAddSheet() {
  addSheetOpen.value = false
}

// 다음 주 schedule 의 items 를 변경하고 즉시 BE 동기화 (autosave).
// nextSchedule.value 는 미리 local 업데이트해서 UI 가 즉각 반영되도록 함.
async function persistNextItems(newItems: WeeklySchedule['items']) {
  if (!draftPlan.planId || !nextSchedule.value) return
  const planId = draftPlan.planId
  const weekStart = nextSchedule.value.weekStart
  // optimistic
  nextSchedule.value = { ...nextSchedule.value, items: newItems }
  nextSaving.value = true
  try {
    const updated = await updateSchedule(planId, weekStart, { items: newItems })
    if (updated) nextSchedule.value = updated
  } finally {
    nextSaving.value = false
  }
}

function removeItem(itemId: string) {
  if (!nextSchedule.value) return
  const next = nextSchedule.value.items.filter(it => it.id !== itemId)
  persistNextItems(next)
}

function addItem(itemType: 'project' | 'routine', itemId: string) {
  if (!nextSchedule.value || !addSheetDate.value) return
  const newItem = {
    id: crypto.randomUUID(),
    itemType,
    itemId,
    date: addSheetDate.value,
    curriculumWeek: null,
    note: '',
  }
  const next = [...nextSchedule.value.items, newItem]
  persistNextItems(next)
  closeAddSheet()
}

const CAT_COLOR: Record<ProjectCategory, string> = {
  qualification: '#1DB95A',
  knowledge:     '#F47820',
  skill:         '#A855F7',
  portfolio:     '#4480F5',
}
const CAT_LABEL: Record<ProjectCategory, string> = {
  qualification: '자격요건',
  knowledge:     '분야지식',
  skill:         '직무기술',
  portfolio:     '포트폴리오',
}

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

// 다음 주 범위: 현재 주 다음 날부터 +6 일 (next reviewDay)
const nextRange = computed<{ weekStart: string; weekEnd: string } | null>(() => {
  if (!draftPlan.startDate || !draftPlan.reviewDay) return null
  const cur = computeWeekRangeContaining(getToday(), draftPlan.startDate, draftPlan.reviewDay)
  if (!cur) return null
  const curEnd = parseDateKey(cur.weekEnd)
  if (!curEnd) return null
  const ns = new Date(curEnd); ns.setDate(ns.getDate() + 1)
  const ne = new Date(ns);     ne.setDate(ne.getDate() + 6)
  return { weekStart: toDateKey(ns), weekEnd: toDateKey(ne) }
})

// 다음 주 요일별 카드 데이터 (UI 렌더링 편의)
interface NextDayItem {
  id: string
  itemType: 'project' | 'routine'
  itemId: string
  name: string
  duration: number
  categoryLabel: string
  color: string
}
interface NextDay {
  date: string
  dateLabel: string
  dow: string
  items: NextDayItem[]
}

const nextDays = computed<NextDay[]>(() => {
  if (!nextRange.value || !nextSchedule.value) return []
  const sd = parseDateKey(nextRange.value.weekStart)
  const ed = parseDateKey(nextRange.value.weekEnd)
  if (!sd || !ed) return []

  const itemsByDate: Record<string, typeof nextSchedule.value.items> = {}
  for (const it of nextSchedule.value.items) {
    ;(itemsByDate[it.date] ??= []).push(it)
  }

  const DOW = ['일', '월', '화', '수', '목', '금', '토']
  const out: NextDay[] = []
  const cursor = new Date(sd)
  while (cursor.getTime() <= ed.getTime()) {
    const key = toDateKey(cursor)
    const rawItems = itemsByDate[key] ?? []
    const items: NextDayItem[] = []
    for (const it of rawItems) {
      if (it.itemType === 'project') {
        const p = draftPlan.projects.find(x => x.id === it.itemId)
        if (!p) continue
        items.push({
          id: it.id,
          itemType: 'project',
          itemId: it.itemId,
          name: p.name,
          duration: p.duration ?? 0,
          categoryLabel: CAT_LABEL[p.category] ?? '',
          color: CAT_COLOR[p.category] ?? '#888',
        })
      } else {
        const r = draftPlan.routines.find(x => x.id === it.itemId)
        if (!r) continue
        items.push({
          id: it.id,
          itemType: 'routine',
          itemId: it.itemId,
          name: r.name,
          duration: r.duration ?? 0,
          categoryLabel: '',
          color: '#CC9D00',
        })
      }
    }
    out.push({
      date: key,
      dateLabel: `${cursor.getMonth() + 1}/${cursor.getDate()}`,
      dow: DOW[cursor.getDay()]!,
      items,
    })
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
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
    if (draftPlan.planId && nextRange.value) {
      nextSchedule.value = await ensureWeekSchedule(
        draftPlan.planId,
        { projects: draftPlan.projects, routines: draftPlan.routines },
        draftTimeline.value,
        nextRange.value.weekStart,
        nextRange.value.weekEnd,
      )
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

  /* ── 다음 주 일정 ───────────────────── */
  &__next-hint {
    font-size: 12px;
    color: #888;
    margin: -4px 0 2px;
    line-height: 1.5;
  }

  &__days {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__day {
    border: 1px solid #EEEEE8;
    border-radius: 12px;
    padding: 12px 14px 10px;
    background: #fff;

    &--empty {
      background: #FAFAF7;
      border-style: dashed;
    }
  }

  &__day-head {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__day-dow {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #FFF5E0;
    color: #B07800;
    font-size: 11px;
    font-weight: 900;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__day-date {
    flex: 1;
    font-size: 13px;
    font-weight: 800;
    color: #222;
  }

  &__day-count {
    font-size: 11px;
    font-weight: 800;
    color: #888;
    background: #F0F0F0;
    border-radius: 999px;
    padding: 2px 8px;
  }

  &__day-items {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__day-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    background: #FAFAF7;
    border-radius: 8px;
    border-left: 3px solid var(--cat-color, #FFC700);

    &--routine {
      border-left-color: #FFD84D;
    }
  }

  &__day-item-cat {
    flex-shrink: 0;
    font-size: 10px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 8px;
    letter-spacing: 0.2px;
    white-space: nowrap;

    &--routine {
      color: #B07800;
      background: #FFFBEC;
    }
  }

  &__day-item-name {
    flex: 1;
    min-width: 0;
    font-size: 13px;
    font-weight: 700;
    color: #222;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__day-item-meta {
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 600;
    color: #888;
  }

  &__day-empty {
    font-size: 12px;
    color: #bbb;
    margin: 0;
    text-align: center;
    padding: 4px 0;
  }

  &__day-add {
    flex-shrink: 0;
    background: transparent;
    border: 1px dashed #DDD;
    color: #888;
    font-size: 11px;
    font-weight: 800;
    padding: 4px 10px;
    border-radius: 999px;
    cursor: pointer;
    transition: border-color 0.12s, color 0.12s, background 0.12s;

    &:hover {
      border-color: #FFC700;
      color: #B07800;
      background: #FFFBEC;
    }
  }

  &__day-item-remove {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: #bbb;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.12s, color 0.12s;

    &:hover {
      background: #FFE8E8;
      color: #C5443A;
    }
  }

  &__autosave {
    margin-left: 6px;
    font-size: 11px;
    font-weight: 700;
    color: #B07800;
  }
}

/* ── 항목 추가 bottom sheet (Teleport 대상이라 scoped 외부) ────────── */
.wr-sheet {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;

  &__panel {
    width: 100%;
    max-width: 480px;
    max-height: 70vh;
    background: #fff;
    border-radius: 22px 22px 0 0;
    padding: 14px 16px 20px;
    box-shadow: 0 -8px 28px rgba(0, 0, 0, 0.18);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__handle {
    width: 44px;
    height: 4px;
    border-radius: 2px;
    background: #DDD;
    align-self: center;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__title {
    font-size: 16px;
    font-weight: 900;
    color: #222;
    margin: 0;
  }

  &__close {
    background: none;
    border: none;
    color: #888;
    font-size: 14px;
    cursor: pointer;
    width: 28px;
    height: 28px;
    border-radius: 50%;

    &:hover { background: #F0F0F0; }
  }

  &__tabs {
    display: flex;
    gap: 6px;
    padding: 2px 0 4px;
  }

  &__tab {
    flex: 1;
    background: #FAFAF7;
    border: 1px solid #EEEEE8;
    border-radius: 10px;
    padding: 8px;
    font-size: 12px;
    font-weight: 800;
    color: #888;
    cursor: pointer;

    &--active {
      background: #FFFBEC;
      border-color: #FFE99A;
      color: #B07800;
    }
  }

  &__list {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-bottom: 4px;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: #FAFAF7;
    border: 1px solid #EEEEE8;
    border-radius: 10px;
    text-align: left;
    cursor: pointer;
    transition: background 0.12s;

    &:hover { background: #FFFBEC; border-color: #FFE99A; }
  }

  &__row-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__row-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__row-name {
    font-size: 13px;
    font-weight: 800;
    color: #222;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__row-meta {
    font-size: 11px;
    color: #888;
    font-weight: 600;
  }

  &__row-plus {
    font-size: 18px;
    color: #B07800;
    font-weight: 900;
    flex-shrink: 0;
  }

  &__empty {
    font-size: 12px;
    color: #aaa;
    text-align: center;
    padding: 20px 0;
    margin: 0;
  }
}

.wr-sheet-enter-active, .wr-sheet-leave-active {
  transition: opacity 0.18s ease;
  .wr-sheet__panel { transition: transform 0.22s cubic-bezier(.2,.8,.2,1); }
}
.wr-sheet-enter-from, .wr-sheet-leave-to {
  opacity: 0;
  .wr-sheet__panel { transform: translateY(40px); }
}
</style>

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
      <!-- 진로계획 hero (N일차 + 전체 진행률 + 이번 주 path) -->
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

        <!-- 이번 달 주차 path (세로 zigzag, prev / current(큰 카드) / next) -->
        <div class="ca__vpath">
          <div class="ca__vpath-title">
            <span>이번 달 주차별 목표</span>
            <span class="ca__vpath-meta"><strong>{{ weekTotals.done }}</strong> / {{ weekTotals.planned }}</span>
          </div>

          <template v-for="(n, i) in visibleNodes" :key="i">
            <!-- prev / next (작은 노드) -->
            <div
              v-if="n && i !== 1"
              class="ca__vnode"
              :class="i === 0 ? 'ca__vnode--prev' : 'ca__vnode--next'"
            >
              <div
                class="ca__vnode-circle"
                :class="{
                  'ca__vnode-circle--done':    n.status === 'done',
                  'ca__vnode-circle--partial': n.status === 'partial',
                  'ca__vnode-circle--past':    n.isPast && n.status !== 'done',
                }"
              >
                <span v-if="n.status === 'done'">✓</span>
                <span v-else>{{ n.index }}</span>
              </div>
              <div class="ca__vnode-info">
                <span class="ca__vnode-label">{{ n.index }}주차</span>
                <span class="ca__vnode-range">{{ shortRange(n) }}</span>
              </div>
            </div>

            <!-- current (큰 카드 + 목표 list) -->
            <div v-else-if="n && i === 1" class="ca__vcard">
              <span class="ca__vcard-bubble">START</span>
              <div class="ca__vcard-head">
                <div class="ca__vcard-circle">{{ n.index }}</div>
                <div class="ca__vcard-headinfo">
                  <span class="ca__vcard-label">{{ n.index }}주차</span>
                  <span class="ca__vcard-range">{{ shortRange(n) }}</span>
                </div>
                <span class="ca__vcard-meta"><strong>{{ n.done }}</strong> / {{ n.planned }}</span>
              </div>

              <ul v-if="currentWeekProjectBars.length" class="ca__pgoals">
                <li
                  v-for="bar in currentWeekProjectBars"
                  :key="bar.project.id"
                  class="ca__pgoal"
                >
                  <button class="ca__pgoal-head" @click="toggleExpand(bar.project.id)">
                    <span
                      class="ca__pgoal-dot"
                      :style="{ background: categoryColor(bar.project.category) }"
                    />
                    <span class="ca__pgoal-name">{{ bar.project.name }}</span>
                    <span class="ca__pgoal-week">{{ bar.weekIdx }}주차</span>
                    <span class="ca__pgoal-count">
                      <strong>{{ bar.itemsDone }}</strong> / {{ bar.itemsTotal }}
                    </span>
                    <span class="ca__pgoal-chev" :class="{ 'ca__pgoal-chev--open': expandedProjects[bar.project.id] }">▾</span>
                  </button>

                  <div class="ca__pgoal-bar">
                    <span
                      v-for="i in bar.itemsTotal"
                      :key="i"
                      class="ca__pgoal-seg"
                      :class="{ 'ca__pgoal-seg--done': isItemDone(bar.project.id, bar.curriculumWeek.week, i - 1) }"
                      :style="isItemDone(bar.project.id, bar.curriculumWeek.week, i - 1) ? { background: categoryColor(bar.project.category) } : undefined"
                    />
                  </div>

                  <ul v-if="expandedProjects[bar.project.id]" class="ca__pgoal-items">
                    <li
                      v-for="(text, idx) in bar.curriculumWeek.items"
                      :key="idx"
                      class="ca__pgoal-item"
                      :class="{ 'ca__pgoal-item--done': isItemDone(bar.project.id, bar.curriculumWeek.week, idx) }"
                      @click="toggleItem(bar.project.id, bar.curriculumWeek.week, idx)"
                    >
                      <span class="ca__pgoal-check" :class="{ 'ca__pgoal-check--done': isItemDone(bar.project.id, bar.curriculumWeek.week, idx) }">
                        <span v-if="isItemDone(bar.project.id, bar.curriculumWeek.week, idx)">✓</span>
                      </span>
                      <span class="ca__pgoal-text">{{ text }}</span>
                    </li>
                  </ul>
                </li>
              </ul>
              <p v-else class="ca__vgoals-empty">이번 주에 예정된 목표가 없어요</p>
            </div>
          </template>
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

    <CelebrationModal
      v-model="celebrate"
      title="오늘 모든 목표 완료!"
      :sub="`진로계획 ${daysSinceStart ?? 1}일차를 멋지게 마쳤어요`"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/shared/components/AppHeader.vue'
import CelebrationModal from '../components/CelebrationModal.vue'
import { useCareerDesign } from '@/modules/career-design/composables/useCareerDesign'
import { useAchievement } from '../composables/useAchievement'
import { useCurriculumCompletion } from '../composables/useCurriculumCompletion'
import type { Project, ProjectCategory, WeekCurriculum } from '@/modules/career-design/types/career-design'


const router = useRouter()
const { draftPlan, draftTimeline, fetchMyPlans, loadPlanFromApi } = useCareerDesign()
const {
  today, todayKey, todayRoutines, todayProjects, dateProjects, parseMonthLabel,
  isProjectDone, isRoutineDone, toggleProject, toggleRoutine,
  plannedCount, doneCount, monthProgress, toDateKey,
} = useAchievement()
const { isItemDone, toggleItem, weekItemsDoneCount } = useCurriculumCompletion()

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

const month = computed(() => monthProgress(timelineForCalc.value))

type WeekNodeStatus = 'none' | 'partial' | 'done'
interface WeekNode {
  index: number
  start: Date
  end: Date
  planned: number
  done: number
  status: WeekNodeStatus
  isCurrent: boolean
  isPast: boolean
}

const weekNodes = computed<WeekNode[]>(() => {
  const t = today.value
  const first = new Date(t.getFullYear(), t.getMonth(), 1)
  const last = new Date(t.getFullYear(), t.getMonth() + 1, 0)
  const tNorm = new Date(t); tNorm.setHours(0, 0, 0, 0)

  const nodes: WeekNode[] = []
  const cursor = new Date(first)
  let idx = 1
  while (cursor <= last) {
    const wStart = new Date(cursor)
    const wEnd = new Date(cursor)
    wEnd.setDate(wStart.getDate() + 6)
    if (wEnd > last) wEnd.setTime(last.getTime())

    let planned = 0
    let done = 0
    const d = new Date(wStart)
    while (d <= wEnd) {
      planned += plannedCount(d, draftPlan.projects, draftPlan.routines, timelineForCalc.value, draftPlan.startDate, draftPlan.endDate)
      done    += doneCount(d)
      d.setDate(d.getDate() + 1)
    }

    const isCurrent = tNorm >= wStart && tNorm <= wEnd
    const isPast = wEnd < tNorm && !isCurrent
    const status: WeekNodeStatus =
      planned === 0 ? 'none' :
      done >= planned ? 'done' :
      done > 0 ? 'partial' : 'none'

    nodes.push({ index: idx, start: wStart, end: wEnd, planned, done, status, isCurrent, isPast })
    cursor.setDate(cursor.getDate() + 7)
    idx++
  }
  return nodes
})

const weekTotals = computed(() =>
  weekNodes.value.reduce((acc, n) => ({ planned: acc.planned + n.planned, done: acc.done + n.done }), { planned: 0, done: 0 })
)

function shortRange(n: WeekNode): string {
  const s = `${n.start.getMonth() + 1}/${n.start.getDate()}`
  const e = `${n.end.getMonth() + 1}/${n.end.getDate()}`
  return `${s}~${e}`
}

// 현재 주차 인덱스 + 보이는 3개 노드 (prev / current / next, 가장자리면 null)
const currentWeekIdx = computed(() => weekNodes.value.findIndex(n => n.isCurrent))

const visibleNodes = computed<(WeekNode | null)[]>(() => {
  const all = weekNodes.value
  const i = currentWeekIdx.value
  if (!all.length) return [null, null, null]
  if (i === -1) {
    // 현재 월에 isCurrent가 없는 경우(첫/끝 경계) — 첫 3개 표시
    return [all[0] ?? null, all[1] ?? null, all[2] ?? null]
  }
  return [
    i - 1 >= 0 ? all[i - 1]! : null,
    all[i]!,
    i + 1 < all.length ? all[i + 1]! : null,
  ]
})

// 프로젝트가 처음 timeline에 배치된 month의 1일 (1주차 시작일)
function projectFirstMonthFirstDay(projectId: string): Date | null {
  let best: { year: number; month: number } | null = null
  for (const slot of timelineForCalc.value) {
    if (!slot.projects.some(p => p.id === projectId)) continue
    const parsed = parseMonthLabel(slot.month)
    if (!parsed) continue
    if (!best || (parsed.year < best.year) || (parsed.year === best.year && parsed.month < best.month)) {
      best = parsed
    }
  }
  return best ? new Date(best.year, best.month - 1, 1) : null
}

// 현재 주차의 시작일과 첫 배치월 1일 차이 / 7 + 1 = 그 프로젝트의 N주차
function projectWeekIdx(projectId: string, weekStart: Date): number | null {
  const firstDay = projectFirstMonthFirstDay(projectId)
  if (!firstDay) return null
  const days = Math.floor((weekStart.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24))
  if (days < 0) return null
  return Math.floor(days / 7) + 1
}

// 현재 주차 vcard용 프로젝트별 progress bar 데이터
interface ProjectBar {
  project: Project
  weekIdx: number                    // 그 프로젝트의 N주차 (1-based)
  curriculumWeek: WeekCurriculum     // curriculum[weekIdx-1] (반드시 존재)
  itemsTotal: number
  itemsDone: number
}

const currentWeekProjectBars = computed<ProjectBar[]>(() => {
  const cur = currentWeekIdx.value === -1 ? null : weekNodes.value[currentWeekIdx.value] ?? null
  if (!cur) return []

  const seen = new Set<string>()
  const out: ProjectBar[] = []

  const d = new Date(cur.start)
  while (d <= cur.end) {
    const ps = dateProjects(d, draftPlan.projects, timelineForCalc.value, draftPlan.startDate, draftPlan.endDate)
    for (const p of ps) {
      if (seen.has(p.id)) continue
      seen.add(p.id)

      const wIdx = projectWeekIdx(p.id, cur.start)
      if (wIdx === null) continue
      const cw = p.curriculum?.find(c => c.week === wIdx)
      if (!cw || !cw.items?.length) continue

      out.push({
        project: p,
        weekIdx: wIdx,
        curriculumWeek: cw,
        itemsTotal: cw.items.length,
        itemsDone: weekItemsDoneCount(p.id, cw.week, cw.items.length),
      })
    }
    d.setDate(d.getDate() + 1)
  }
  return out
})

// 프로젝트별 펼침 상태 (vcard 안)
const expandedProjects = ref<Record<string, boolean>>({})
function toggleExpand(projectId: string) {
  expandedProjects.value = { ...expandedProjects.value, [projectId]: !expandedProjects.value[projectId] }
}

// 카테고리
const categories: Record<ProjectCategory, { label: string; color: string }> = {
  qualification: { label: '자격요건',   color: '#1DB95A' },
  knowledge:     { label: '분야지식',   color: '#F47820' },
  skill:         { label: '직무기술',   color: '#A855F7' },
  portfolio:     { label: '포트폴리오', color: '#4480F5' },
}
const categoryLabel = (c: ProjectCategory) => categories[c]?.label ?? ''
const categoryColor = (c: ProjectCategory) => categories[c]?.color ?? '#aaa'

function startProject(p: Project) {
  router.push({ path: `/career-achievement/start/project/${p.id}`, query: { date: toDateKey(today.value) } })
}

// ── 오늘 전체 완료 시 축하 팝업 ─────────────────────
const celebrate = ref(false)
const CELEBRATION_KEY_PREFIX = 'lh_celebration_'

const allTodayDone = computed(() => {
  const total = todayProjectsList.value.length + todayRoutinesList.value.length
  if (total === 0) return false
  return (
    todayProjectsList.value.every(p => isProjectDone(p.id)) &&
    todayRoutinesList.value.every(r => isRoutineDone(r.id))
  )
})

function alreadyCelebratedToday(): boolean {
  try {
    return localStorage.getItem(CELEBRATION_KEY_PREFIX + todayKey.value) === '1'
  } catch { return false }
}

function markCelebratedToday() {
  try { localStorage.setItem(CELEBRATION_KEY_PREFIX + todayKey.value, '1') } catch { /* quota */ }
}

watch(allTodayDone, (now) => {
  if (now && !alreadyCelebratedToday()) {
    celebrate.value = true
    markCelebratedToday()
  }
})

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

  /* ── 진로계획 hero (N일차 + 타임라인 단계 + 세로 path) ── */
  &__plan-hero {
    margin: 16px 16px 12px;
    padding: 22px 22px 22px;
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

  /* ── 세로 path (prev / current(큰 카드) / next) ── */
  &__vpath {
    margin-top: 6px;
    padding-top: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.28);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__vpath-title {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 800;
    opacity: 0.98;
    margin-bottom: 2px;
  }

  &__vpath-meta {
    font-size: 12px;
    opacity: 0.9;
    strong { font-weight: 800; font-size: 13px; }
  }

  /* prev/next 작은 노드 (좌/우 정렬로 zigzag) */
  &__vnode {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 10px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.14);
    max-width: 64%;
    backdrop-filter: blur(2px);

    &--prev { align-self: flex-start; }
    &--next { align-self: flex-end; flex-direction: row-reverse; }
  }

  &__vnode-circle {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.28);
    color: rgba(255, 255, 255, 0.78);
    font-size: 12px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.08);

    &--done {
      background: #fff;
      color: #FFB300;
    }
    &--partial {
      background: rgba(255, 255, 255, 0.75);
      color: #B07800;
    }
    &--past {
      background: rgba(255, 255, 255, 0.16);
      color: rgba(255, 255, 255, 0.55);
    }
  }

  &__vnode-info {
    display: flex;
    flex-direction: column;
    line-height: 1.2;
  }

  &__vnode-label {
    font-size: 12px;
    font-weight: 800;
  }

  &__vnode-range {
    font-size: 10px;
    font-weight: 600;
    opacity: 0.78;
  }

  /* current 큰 카드 */
  &__vcard {
    position: relative;
    margin: 6px 0;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 18px;
    padding: 18px 18px 16px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
    color: #333;
  }

  &__vcard-bubble {
    position: absolute;
    top: -12px;
    left: 18px;
    background: #FF8A00;
    color: #fff;
    font-size: 11px;
    font-weight: 900;
    letter-spacing: 0.5px;
    padding: 4px 10px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
  }

  &__vcard-head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 12px;
    border-bottom: 1px dashed #EEEEE8;
  }

  &__vcard-circle {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #FFC700 0%, #FFB300 100%);
    color: #fff;
    font-size: 18px;
    font-weight: 900;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 10px rgba(255, 138, 0, 0.35);
  }

  &__vcard-headinfo {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__vcard-label {
    font-size: 17px;
    font-weight: 900;
    color: #222;
  }

  &__vcard-range {
    font-size: 12px;
    font-weight: 600;
    color: #888;
  }

  &__vcard-meta {
    font-size: 12px;
    color: #888;
    font-weight: 600;

    strong {
      color: #FF8A00;
      font-weight: 900;
      font-size: 14px;
    }
  }

  /* 현재 주차 — 프로젝트별 progress bar list */
  &__pgoals {
    list-style: none;
    margin: 14px 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__vgoals-empty {
    font-size: 12px;
    color: #aaa;
    text-align: center;
    margin: 14px 0 4px;
  }

  &__pgoal {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__pgoal-head {
    display: flex;
    align-items: center;
    gap: 8px;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    width: 100%;
    text-align: left;
    color: inherit;
  }

  &__pgoal-dot {
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  &__pgoal-name {
    flex: 1;
    min-width: 0;
    font-size: 14px;
    font-weight: 800;
    color: #222;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__pgoal-week {
    flex-shrink: 0;
    font-size: 11px;
    font-weight: 700;
    color: #FF8A00;
    background: #FFF5E0;
    padding: 2px 7px;
    border-radius: 8px;
  }

  &__pgoal-count {
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 600;
    color: #888;

    strong {
      font-weight: 900;
      color: #222;
    }
  }

  &__pgoal-chev {
    flex-shrink: 0;
    color: #aaa;
    font-size: 12px;
    transition: transform 0.2s;

    &--open { transform: rotate(180deg); }
  }

  &__pgoal-bar {
    display: flex;
    gap: 3px;
    height: 8px;
  }

  &__pgoal-seg {
    flex: 1;
    height: 100%;
    background: #EEEEE8;
    border-radius: 4px;
    transition: background 0.25s;

    &--done {
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
    }
  }

  &__pgoal-items {
    list-style: none;
    margin: 4px 0 0;
    padding: 4px 0 0;
    border-top: 1px dashed #EEEEE8;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__pgoal-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 4px;
    border-radius: 8px;
    font-size: 13px;
    color: #444;
    cursor: pointer;
    transition: background 0.12s;

    &:hover { background: #fafafa; }

    &--done {
      color: #888;
    }
  }

  &__pgoal-check {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid #ddd;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 11px;
    font-weight: 900;

    &--done {
      background: #1DB95A;
      border-color: #1DB95A;
    }
  }

  &__pgoal-text {
    flex: 1;
    min-width: 0;
    line-height: 1.4;
    word-break: break-word;
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

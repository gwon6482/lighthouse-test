<template>
  <div class="cd-complete">
    <CdYellowHeader title="나의 진로계획" :subtitle="draftPlan.name || '내 진로계획'" back-to="/career-design/plan/projects" />

    <div class="cd-complete__body">
      <!-- 계획 요약 -->
      <div class="cd-complete__summary">
        <div class="cd-complete__summary-row">
          <span class="cd-complete__target">🎯 {{ draftPlan.targetJob || '목표 직업 미설정' }}</span>
          <span class="cd-complete__period">{{ periodLabel }}</span>
        </div>
        <div v-if="draftPlan.duties.length" class="cd-complete__duties">
          <span v-for="duty in draftPlan.duties" :key="duty" class="cd-complete__duty-chip">{{ duty }}</span>
        </div>
      </div>

      <!-- 프로젝트 풀 -->
      <div class="cd-complete__section">
        <div class="cd-complete__section-header">
          <h3 class="cd-complete__section-title">프로젝트</h3>
          <span class="cd-complete__section-count">총 {{ draftPlan.projects.length }}개</span>
        </div>

        <!-- 카테고리 탭 -->
        <div class="cd-complete__tabs">
          <button
            v-for="cat in categories"
            :key="cat.value"
            class="cd-complete__tab"
            :class="{
              'cd-complete__tab--active': activeTab === cat.value,
              'cd-complete__tab--done': isCategoryDone[cat.value],
            }"
            :style="activeTab === cat.value
              ? { color: categoryColorMap[cat.value], borderBottomColor: categoryColorMap[cat.value] }
              : {}"
            @click="activeTab = cat.value"
          >
            {{ cat.label }}
            <span
              v-if="isCategoryDone[cat.value]"
              class="cd-complete__tab-done"
              :style="{ background: categoryColorMap[cat.value] }"
            >✓</span>
            <span
              v-else
              class="cd-complete__tab-count"
              :style="activeTab === cat.value ? { background: categoryColorMap[cat.value] } : {}"
            >{{ projectsByCategory[cat.value].length }}</span>
          </button>
        </div>

        <!-- 프로젝트 칩 -->
        <div class="cd-complete__pool">
          <p v-if="!poolProjects.length" class="cd-complete__pool-empty">
            이 카테고리에 프로젝트가 없어요
          </p>
          <div
            v-for="project in poolProjects"
            :key="project.id"
            class="cd-complete__pool-chip"
            :class="{
              'cd-complete__pool-chip--placed': isPlaced(project.id),
              'cd-complete__pool-chip--selected': selectedProject?.id === project.id,
            }"
            :style="chipStyle(project)"
            @click="selectProject(project)"
          >
            {{ project.name }}
          </div>
        </div>

        <p class="cd-complete__hint">
          {{ selectedProject ? `"${selectedProject.name}" 선택됨 — 아래 월을 탭해서 배치` : '칩을 탭해서 선택하세요' }}
        </p>
      </div>

      <!-- 타임라인 드롭존 -->
      <div class="cd-complete__section">
        <div class="cd-complete__section-header">
          <h3 class="cd-complete__section-title">타임라인</h3>
          <span class="cd-complete__section-count">{{ placedCount }}개 배치됨</span>
        </div>

        <div v-if="!draftPlan.startDate" class="cd-complete__timeline-empty">
          진로계획 세우기에서 목표 기간을 먼저 설정해주세요
        </div>

        <template v-else>
          <!-- 시작/종료 날짜 범위 표시 -->
          <div class="cd-complete__tl-range">
            <div class="cd-complete__tl-range-item">
              <span class="cd-complete__tl-dot cd-complete__tl-dot--start" />
              <span class="cd-complete__tl-range-label">{{ startMonthStr }}</span>
            </div>
            <div class="cd-complete__tl-range-bar" />
            <div class="cd-complete__tl-range-item">
              <span class="cd-complete__tl-range-label">{{ endMonthStr || '목표일 미설정' }}</span>
              <span class="cd-complete__tl-dot cd-complete__tl-dot--end" />
            </div>
          </div>

          <div class="cd-complete__slots">
            <!-- 슬롯 없을 때: 시작월 초기 탭존 -->
            <div
              v-if="draftTimeline.length === 0"
              class="cd-complete__slot"
              :class="{ 'cd-complete__slot--active': !!selectedProject }"
              @click="addToSlot('__initial__')"
            >
              <div class="cd-complete__slot-head">
                <span class="cd-complete__slot-badge">{{ startMonthStr }}</span>
                <div class="cd-complete__slot-line" />
              </div>
              <div class="cd-complete__slot-placeholder">
                {{ selectedProject ? '탭해서 추가' : '위에서 프로젝트를 선택하세요' }}
              </div>
            </div>

            <!-- 동적 생성 슬롯 -->
            <template v-else>
              <div
                v-for="slot in draftTimeline"
                :key="slot.month"
                class="cd-complete__slot"
                :class="{ 'cd-complete__slot--active': !!selectedProject }"
                @click="addToSlot(slot.month)"
              >
                <div class="cd-complete__slot-head">
                  <span class="cd-complete__slot-badge">{{ slot.month }}</span>
                  <div class="cd-complete__slot-line" />
                </div>
                <div class="cd-complete__slot-body">
                  <div v-if="!slot.projects.length" class="cd-complete__slot-placeholder">
                    {{ selectedProject ? '탭해서 추가' : '비어 있음' }}
                  </div>
                  <div
                    v-for="project in slot.projects"
                    :key="project.id"
                    class="cd-complete__slot-item"
                    :style="{ borderLeftColor: categoryColorMap[project.category] }"
                    @click.stop="openProjectPopup(project)"
                  >
                    <span class="cd-complete__slot-item-name">{{ project.name }}</span>
                    <span class="cd-complete__slot-item-cat" :style="{ color: categoryColorMap[project.category] }">
                      {{ categoryLabel(project.category) }}
                    </span>
                    <button class="cd-complete__slot-item-del" @click.stop="removeFromSlot(slot.month, project.id)">✕</button>
                  </div>
                </div>
              </div>
            </template>

            <!-- 다음 달 추가 버튼 -->
            <button class="cd-complete__add-month" @click="addNextMonth">＋</button>
          </div>
        </template>
      </div>
    </div>

    <!-- 프로젝트 상세 팝업 -->
    <Teleport to="body">
      <Transition name="cd-popup">
        <div v-if="popupProject" class="cd-proj-popup" @click.self="closeProjectPopup">
          <div class="cd-proj-popup__sheet">
            <div class="cd-proj-popup__handle" />

            <div
              class="cd-proj-popup__header"
              :style="{ borderLeftColor: categoryColorMap[popupProject.category] }"
            >
              <div class="cd-proj-popup__header-left">
                <span
                  class="cd-proj-popup__cat"
                  :style="{ color: categoryColorMap[popupProject.category], background: `color-mix(in srgb, ${categoryColorMap[popupProject.category]} 10%, white)` }"
                >{{ categoryLabel(popupProject.category) }}</span>
                <h2 class="cd-proj-popup__name">{{ popupProject.name }}</h2>
                <p v-if="popupProject.goal" class="cd-proj-popup__goal">{{ popupProject.goal }}</p>
              </div>
              <button class="cd-proj-popup__close" @click="closeProjectPopup">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M15 5L5 15M5 5l10 10" stroke="#888" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </button>
            </div>

            <div class="cd-proj-popup__body">
              <div v-if="!popupProject.curriculum?.length" class="cd-proj-popup__empty">
                등록된 주차별 계획이 없습니다
              </div>
              <div
                v-for="week in popupProject.curriculum"
                :key="week.week"
                class="cd-proj-popup__week"
              >
                <div class="cd-proj-popup__week-header">
                  <span
                    class="cd-proj-popup__week-badge"
                    :style="{ background: categoryColorMap[popupProject.category] }"
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
    <div class="cd-complete__footer">
      <button class="cd-complete__btn-secondary" @click="router.push('/career-design/plan/new')">
        계획 수정하기
      </button>
      <button class="cd-complete__btn-primary" @click="goComplete">
        완료
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
const { draftPlan, draftTimeline, syncTimeline } = useCareerDesign()

async function goComplete() {
  await syncTimeline()
  router.push('/career-design/result')
}

// ── 카테고리 ──────────────────────────────────────
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

// ── 프로젝트 풀 ───────────────────────────────────
const activeTab = ref<ProjectCategory>('knowledge')

const projectsByCategory = computed(() => {
  const map = {} as Record<ProjectCategory, Project[]>
  categories.forEach(c => { map[c.value] = [] })
  draftPlan.projects.forEach(p => map[p.category]?.push(p))
  return map
})

const poolProjects = computed(() => projectsByCategory.value[activeTab.value])

function chipStyle(project: Project) {
  const color = categoryColorMap[project.category]
  if (isPlaced(project.id)) {
    return { borderColor: '#ddd', color: '#bbb', background: '#fafafa' }
  }
  return {
    borderColor: color,
    color,
    background: `color-mix(in srgb, ${color} 8%, white)`,
  }
}

// ── 타임라인 슬롯 (composable 공유 상태) ─────────────
type TimelineSlot = { month: string; projects: Project[] }

function formatMonthStr(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
}

function parseMonthStr(monthStr: string): Date {
  const match = monthStr.match(/(\d+)년 (\d+)월/)
  if (!match) return new Date()
  return new Date(parseInt(match[1]), parseInt(match[2]) - 1, 1)
}

const startMonthStr = computed(() => {
  if (!draftPlan.startDate) return ''
  return formatMonthStr(new Date(draftPlan.startDate))
})

const endMonthStr = computed(() => {
  if (!draftPlan.endDate) return ''
  return formatMonthStr(new Date(draftPlan.endDate))
})

function normalizeSlots() {
  const slots = [...draftTimeline.value].sort(
    (a, b) => parseMonthStr(a.month).getTime() - parseMonthStr(b.month).getTime()
  )

  // 마지막으로 채워진 슬롯의 인덱스
  let lastFilledIdx = -1
  for (let i = slots.length - 1; i >= 0; i--) {
    if (slots[i].projects.length > 0) { lastFilledIdx = i; break }
  }

  if (lastFilledIdx === -1) {
    draftTimeline.value = []
    return
  }

  // 마지막 채워진 슬롯까지는 빈 슬롯 포함 전부 유지
  const kept = slots.slice(0, lastFilledIdx + 1)

  // 그 다음 달 빈 슬롯 하나만 추가
  const last = kept[kept.length - 1]
  const nextDate = parseMonthStr(last.month)
  nextDate.setMonth(nextDate.getMonth() + 1)
  kept.push({ month: formatMonthStr(nextDate), projects: [] })

  draftTimeline.value = kept
}

// ── 배치 상태 ─────────────────────────────────────
const placedProjectIds = computed(() =>
  new Set(draftTimeline.value.flatMap(s => s.projects.map(p => p.id)))
)
const isPlaced = (id: string) => placedProjectIds.value.has(id)
const placedCount = computed(() => placedProjectIds.value.size)

const isCategoryDone = computed(() => {
  const result: Partial<Record<ProjectCategory, boolean>> = {}
  for (const cat of categories) {
    const projects = projectsByCategory.value[cat.value]
    result[cat.value] = projects.length > 0 && projects.every(p => isPlaced(p.id))
  }
  return result
})

// ── 요약 정보 ─────────────────────────────────────
const periodLabel = computed(() => {
  const { startDate, endDate } = draftPlan
  if (!startDate) return ''
  const fmt = (d: string) => { const [y, m] = d.split('-'); return `${y}.${m}` }
  return endDate ? `${fmt(startDate)} ~ ${fmt(endDate)}` : fmt(startDate)
})

// ── 선택 → 추가 ───────────────────────────────────
const selectedProject = ref<Project | null>(null)

function selectProject(project: Project) {
  selectedProject.value = selectedProject.value?.id === project.id ? null : project
}

// ── 프로젝트 상세 팝업 ────────────────────────────
const popupProject = ref<Project | null>(null)
const openProjectPopup  = (p: Project) => { popupProject.value = p }
const closeProjectPopup = () => { popupProject.value = null }

function addToSlot(month: string) {
  const project = selectedProject.value
  if (!project) return

  const targetMonth = month === '__initial__' ? startMonthStr.value : month

  // 기존 슬롯에서 제거 (이동)
  draftTimeline.value.forEach(s => {
    const idx = s.projects.findIndex(p => p.id === project.id)
    if (idx >= 0) s.projects.splice(idx, 1)
  })

  // 대상 슬롯 찾기 또는 생성
  let slot = draftTimeline.value.find(s => s.month === targetMonth)
  if (!slot) {
    slot = { month: targetMonth, projects: [] }
    draftTimeline.value.push(slot)
  }

  if (!slot.projects.find(p => p.id === project.id)) {
    slot.projects.push(project)
  }

  normalizeSlots()
  selectedProject.value = null
}

function removeFromSlot(month: string, projectId: string) {
  const slot = draftTimeline.value.find(s => s.month === month)
  if (!slot) return
  const idx = slot.projects.findIndex(p => p.id === projectId)
  if (idx >= 0) slot.projects.splice(idx, 1)
  normalizeSlots()
}

function addNextMonth() {
  if (draftTimeline.value.length === 0) {
    const next = parseMonthStr(startMonthStr.value)
    next.setMonth(next.getMonth() + 1)
    draftTimeline.value = [
      { month: startMonthStr.value, projects: [] },
      { month: formatMonthStr(next), projects: [] },
    ]
  } else {
    const last = draftTimeline.value[draftTimeline.value.length - 1]
    const next = parseMonthStr(last.month)
    next.setMonth(next.getMonth() + 1)
    draftTimeline.value.push({ month: formatMonthStr(next), projects: [] })
  }
}
</script>

<style lang="scss">
.cd-complete {
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

  /* 요약 */
  &__summary {
    background: #fff;
    border-radius: 16px;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__summary-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__target {
    font-size: 15px;
    font-weight: 700;
    color: #222;
  }

  &__period {
    font-size: 12px;
    color: #aaa;
    white-space: nowrap;
  }

  &__duties {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__duty-chip {
    background: #F5F5F5;
    border-radius: 8px;
    padding: 4px 10px;
    font-size: 12px;
    color: #555;
  }

  /* 공통 섹션 */
  &__section {
    background: #fff;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__section-title {
    font-size: 15px;
    font-weight: 700;
    color: #222;
  }

  &__section-count {
    font-size: 12px;
    color: #aaa;
  }

  /* 카테고리 탭 */
  &__tabs {
    display: flex;
    border-bottom: 1.5px solid #eee;
    gap: 4px;
  }

  &__tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    padding: 8px 4px;
    background: none;
    border: none;
    border-bottom: 2.5px solid transparent;
    font-size: 12px;
    font-weight: 500;
    color: #aaa;
    cursor: pointer;
    transition: all 0.15s;
    margin-bottom: -1.5px;

    &--active { font-weight: 700; color: #222; }
    &--done { color: #555; font-weight: 600; }
  }

  &__tab-done {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    border-radius: 8px;
    padding: 0 4px;
    font-size: 10px;
    font-weight: 700;
    color: #fff;
  }

  &__tab-count {
    background: #eee;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    padding: 1px 5px;
    border-radius: 10px;
    line-height: 1.4;
    transition: background 0.15s;
  }

  /* 프로젝트 풀 */
  &__pool {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 8px;
    min-height: 44px;
  }

  &__pool-empty {
    font-size: 13px;
    color: #ccc;
    padding: 10px 0;
  }

  &__pool-chip {
    border: 1.5px solid;
    border-radius: 20px;
    padding: 6px 14px;
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
    transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;

    &:active { opacity: 0.75; }

    &--selected {
      border-width: 2.5px;
      font-weight: 700;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: currentColor;
        opacity: 0.18;
        pointer-events: none;
      }
    }
  }

  &__hint {
    font-size: 12px;
    color: #bbb;
    text-align: center;
    margin-top: -4px;
  }

  /* 날짜 범위 바 */
  &__tl-range {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__tl-range-item {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
  }

  &__tl-range-label {
    font-size: 12px;
    font-weight: 600;
    color: #555;
  }

  &__tl-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;

    &--start { background: #FFC700; }
    &--end   { background: #ccc; }
  }

  &__tl-range-bar {
    flex: 1;
    height: 2px;
    background: linear-gradient(to right, #FFC700, #ddd);
    border-radius: 2px;
  }

  /* 타임라인 */
  &__timeline-empty {
    font-size: 13px;
    color: #ccc;
    text-align: center;
    padding: 20px 0;
  }

  &__slots {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__add-month {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    margin: 4px auto 0;
    border-radius: 50%;
    border: 1.5px dashed #d0d0d0;
    background: none;
    color: #c8c8c8;
    font-size: 18px;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;

    &:hover { border-color: #aaa; color: #aaa; }
  }

  &__slot {
    border: 1.5px dashed #e0e0e0;
    border-radius: 12px;
    padding: 12px 14px;
    transition: border-color 0.15s, background 0.15s;
    cursor: default;

    &--active {
      border-color: #FFC700;
      background: #FFFBEC;
      cursor: pointer;

      .cd-complete__slot-placeholder { color: #CC9D00; font-weight: 600; }
    }
  }

  &__slot-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
  }

  &__slot-badge {
    background: #FFC700;
    color: #222;
    font-size: 12px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 20px;
    white-space: nowrap;
  }

  &__slot-line {
    flex: 1;
    height: 1px;
    background: #eee;
  }

  &__slot-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__slot-placeholder {
    font-size: 12px;
    color: #ccc;
    padding: 6px 0;
    text-align: center;
  }

  &__slot-item {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fff;
    border: 1px solid #eee;
    border-left: 3px solid;
    border-radius: 8px;
    padding: 8px 12px;
  }

  &__slot-item-name {
    flex: 1;
    font-size: 14px;
    font-weight: 500;
    color: #222;
  }

  &__slot-item-cat {
    font-size: 11px;
    font-weight: 600;
  }

  &__slot-item-del {
    background: none;
    border: none;
    font-size: 12px;
    color: #ccc;
    cursor: pointer;
    padding: 0 2px;
    flex-shrink: 0;

    &:hover { color: #FF5555; }
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

/* CompletePage 슬롯 아이템 클릭 가능 표시 */
.cd-complete__slot-item {
  cursor: pointer;
  transition: background 0.12s;

  &:hover { background: #fafafa; }
}
</style>

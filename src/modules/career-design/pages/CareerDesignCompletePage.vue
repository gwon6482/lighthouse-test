<template>
  <div class="cd-complete">
    <CdYellowHeader title="나의 진로계획" :subtitle="draftPlan.name || '내 진로계획'" />

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
            :class="{ 'cd-complete__tab--active': activeTab === cat.value }"
            :style="activeTab === cat.value
              ? { color: categoryColorMap[cat.value], borderBottomColor: categoryColorMap[cat.value] }
              : {}"
            @click="activeTab = cat.value"
          >
            {{ cat.label }}
            <span
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
            <div
              v-else
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
                >
                  <span class="cd-complete__slot-item-name">{{ project.name }}</span>
                  <span class="cd-complete__slot-item-cat" :style="{ color: categoryColorMap[project.category] }">
                    {{ categoryLabel(project.category) }}
                  </span>
                  <button class="cd-complete__slot-item-del" @click.stop="removeFromSlot(slot.month, project.id)">✕</button>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 하단 버튼 -->
    <div class="cd-complete__footer">
      <button class="cd-complete__btn-secondary" @click="router.push('/career-design/plan/new')">
        계획 수정하기
      </button>
      <button class="cd-complete__btn-primary" @click="router.push('/career-design/result')">
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
const { draftPlan, draftTimeline } = useCareerDesign()

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
  // 비어있는 슬롯은 제거 (맨 마지막 빈 슬롯 제외)
  const filled = draftTimeline.value.filter(s => s.projects.length > 0)

  if (filled.length === 0) {
    draftTimeline.value = []
    return
  }

  // 마지막 채워진 슬롯 다음 달을 빈 드롭존으로 추가
  const last = filled[filled.length - 1]
  const nextDate = parseMonthStr(last.month)
  nextDate.setMonth(nextDate.getMonth() + 1)
  filled.push({ month: formatMonthStr(nextDate), projects: [] })

  draftTimeline.value = filled
}

// ── 배치 상태 ─────────────────────────────────────
const placedProjectIds = computed(() =>
  new Set(draftTimeline.value.flatMap(s => s.projects.map(p => p.id)))
)
const isPlaced = (id: string) => placedProjectIds.value.has(id)
const placedCount = computed(() => placedProjectIds.value.size)

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
    cursor: pointer;
    user-select: none;
    transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;

    &:active { transform: scale(0.95); }

    &--selected {
      box-shadow: 0 0 0 3px currentColor;
      font-weight: 700;
      transform: scale(1.04);
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
</style>

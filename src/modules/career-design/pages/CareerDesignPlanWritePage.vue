<template>
  <div class="cd-plan-write">
    <!-- 헤더 -->
    <CdYellowHeader
      title="진로계획 세우기"
      :subtitle="`${draftPlan.targetJob || '목표 직업'}을 위한 프로젝트를 만들어 보세요`"
    />

    <div class="cd-plan-write__body">

      <!-- 목표 설정 -->
      <div class="cd-plan-write__section">
        <h3 class="cd-plan-write__section-title">목표 설정</h3>

        <div class="cd-plan-write__preview">
          <!-- 목표 직업 -->
          <div class="cd-plan-write__prow">
            <span class="cd-plan-write__plabel">직업</span>
            <input
              v-model="draftPlan.targetJob"
              class="cd-plan-write__pinput"
              placeholder="예: 마케팅 기획자"
            />
          </div>

          <!-- 계획명 -->
          <div class="cd-plan-write__prow">
            <span class="cd-plan-write__plabel">계획명</span>
            <input
              v-model="draftPlan.name"
              class="cd-plan-write__pinput"
              placeholder="예: OOO의 마케팅 기획자 되기 프로젝트"
            />
          </div>

          <!-- 준비 기간 -->
          <div class="cd-plan-write__prow">
            <span class="cd-plan-write__plabel">기간</span>
            <div class="cd-plan-write__date-row">
              <CdDatePicker v-model="draftPlan.startDate" placeholder="시작일" />
              <span class="cd-plan-write__date-tilde">~</span>
              <CdDatePicker v-model="draftPlan.endDate" placeholder="종료일" />
            </div>
          </div>

          <!-- 목표 직무 태그 -->
          <div class="cd-plan-write__prow cd-plan-write__prow--top">
            <span class="cd-plan-write__plabel">직무</span>
            <div class="cd-plan-write__duties-wrap">
              <template v-for="(duty, i) in draftPlan.duties" :key="i">
                <!-- 일반 모드 -->
                <div v-if="editingIndex !== i" class="cd-plan-write__duty-tag">
                  <span>{{ duty }}</span>
                  <button class="cd-plan-write__tag-btn" @click="startEdit(i)">✏️</button>
                  <button class="cd-plan-write__tag-btn cd-plan-write__tag-btn--del" @click="deleteDuty(i)">✕</button>
                </div>
                <!-- 편집 모드 -->
                <div v-else class="cd-plan-write__duty-tag cd-plan-write__duty-tag--editing">
                  <input
                    v-model="editingValue"
                    class="cd-plan-write__duty-edit-input"
                    @keyup.enter="confirmEdit(i)"
                    @keyup.esc="cancelEdit"
                  />
                  <button class="cd-plan-write__tag-btn cd-plan-write__tag-btn--ok" @click="confirmEdit(i)">✓</button>
                  <button class="cd-plan-write__tag-btn" @click="cancelEdit">✕</button>
                </div>
              </template>

              <!-- 추가 입력 -->
              <div class="cd-plan-write__duty-tag cd-plan-write__duty-tag--add">
                <input
                  v-model="newDuty"
                  class="cd-plan-write__duty-new-input"
                  placeholder="직무 추가..."
                  @keyup.enter="addDuty"
                />
                <button class="cd-plan-write__tag-btn cd-plan-write__tag-btn--plus" @click="addDuty">+</button>
              </div>
            </div>
          </div>
        </div>

        <button class="cd-plan-write__duty-link" @click="router.push('/career-encyclopedia')">
          진로백과에서 채용공고 확인하기 →
        </button>
      </div>

      <!-- 프로젝트 추가하기 -->
      <div class="cd-plan-write__section">
        <h3 class="cd-plan-write__section-title">프로젝트 추가하기</h3>

        <div class="cd-plan-write__categories">
          <div
            v-for="cat in categories"
            :key="cat.value"
            class="cd-plan-write__cat-item"
            :class="{ 'cd-plan-write__cat-item--active': selectedCategory === cat.value }"
            @click="selectedCategory = cat.value"
          >
            <img
              class="cd-plan-write__cat-icon"
              :src="`/career-design/icon-${cat.value}.svg`"
              :alt="cat.label"
            />
            <span class="cd-plan-write__cat-label">{{ cat.label }}</span>
          </div>
        </div>

        <div class="cd-plan-write__plan-items">
          <div
            v-for="project in categoryProjects"
            :key="project.id"
            class="cd-plan-write__plan-chip"
            :style="{ background: currentColors.chipBg }"
          >
            <span class="cd-plan-write__plan-chip-name" :style="{ color: currentColors.chipText }">{{ project.name }}</span>
            <div class="cd-plan-write__plan-chip-actions">
              <button class="cd-plan-write__plan-btn cd-plan-write__plan-btn--edit" @click="editProject(project)">✏️</button>
              <button class="cd-plan-write__plan-btn cd-plan-write__plan-btn--delete" @click="deleteProject(project.id)">✕</button>
            </div>
          </div>
          <button
            class="cd-plan-write__add-btn"
            :style="{ background: currentColors.btn }"
            @click="goToAddProject"
          >프로젝트 추가하기</button>
        </div>
      </div>
    </div>

    <!-- 하단 버튼 -->
    <div class="cd-plan-write__footer">
      <button class="cd-plan-write__cta" @click="goNext">다음으로</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useCareerDesign } from '../composables/useCareerDesign'
import CdYellowHeader from '../components/CdYellowHeader.vue'
import CdDatePicker from '../components/CdDatePicker.vue'
import type { Project, ProjectCategory } from '../types/career-design'

const router = useRouter()
const { draftPlan, draftProject, editingProjectId, resetDraftProject } = useCareerDesign()

const newDuty = ref('')
const editingIndex = ref<number | null>(null)
const editingValue = ref('')
const selectedCategory = ref<ProjectCategory>('knowledge')

const categories = [
  { value: 'qualification' as ProjectCategory, label: '자격요건' },
  { value: 'knowledge' as ProjectCategory, label: '분야지식' },
  { value: 'skill' as ProjectCategory, label: '직무기술' },
  { value: 'portfolio' as ProjectCategory, label: '포트폴리오' },
]

const categoryColorMap: Record<ProjectCategory, { chipBg: string; chipText: string; btn: string }> = {
  qualification: { chipBg: '#E8F9EF', chipText: '#1DB95A', btn: '#1DB95A' },
  knowledge:     { chipBg: '#FFF2E8', chipText: '#F47820', btn: '#F47820' },
  skill:         { chipBg: '#F5EEFF', chipText: '#A855F7', btn: '#A855F7' },
  portfolio:     { chipBg: '#EBF2FF', chipText: '#4480F5', btn: '#4480F5' },
}

const currentColors = computed(() => categoryColorMap[selectedCategory.value])

const categoryProjects = computed(() =>
  draftPlan.projects.filter(p => p.category === selectedCategory.value)
)

function addDuty() {
  if (newDuty.value.trim()) {
    draftPlan.duties.push(newDuty.value.trim())
    newDuty.value = ''
  }
}

function deleteDuty(i: number) {
  draftPlan.duties.splice(i, 1)
  if (editingIndex.value === i) cancelEdit()
}

async function startEdit(i: number) {
  editingIndex.value = i
  editingValue.value = draftPlan.duties[i]
  await nextTick()
  document.querySelector<HTMLInputElement>('.cd-plan-write__duty-edit-input')?.focus()
}

function confirmEdit(i: number) {
  if (editingValue.value.trim()) {
    draftPlan.duties[i] = editingValue.value.trim()
  }
  cancelEdit()
}

function cancelEdit() {
  editingIndex.value = null
  editingValue.value = ''
}


function goToAddProject() {
  editingProjectId.value = null
  resetDraftProject()
  draftProject.category = selectedCategory.value
  router.push('/career-design/project/new')
}

function editProject(project: Project) {
  editingProjectId.value = project.id
  resetDraftProject()
  Object.assign(draftProject, {
    ...project,
    days: [...project.days],
    curriculum: project.curriculum?.map(w => ({ ...w, items: [...w.items] })) ?? [],
  })
  router.push('/career-design/project/new')
}

function deleteProject(projectId: string) {
  const idx = draftPlan.projects.findIndex(p => p.id === projectId)
  if (idx >= 0) draftPlan.projects.splice(idx, 1)
}

function goNext() {
  router.push('/career-design/complete')
}
</script>

<style lang="scss">
.cd-plan-write {
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

  &__section {
    background: #fff;
    border-radius: 16px;
    padding: 20px;
  }

  &__section-title {
    font-size: 15px;
    font-weight: 700;
    color: #222;
    margin-bottom: 12px;
  }

  &__duty-link {
    background: none;
    border: none;
    font-size: 12px;
    color: #FFC700;
    font-weight: 600;
    cursor: pointer;
    padding: 12px 0 0;
    display: block;
    text-align: right;
    white-space: nowrap;

    &:hover { text-decoration: underline; }
  }

  /* 미리보기 영역 */
  &__preview {
    background: #F8F8F8;
    border-radius: 12px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__prow {
    display: flex;
    align-items: center;
    gap: 10px;

    &--top { align-items: flex-start; }
  }

  &__plabel {
    font-size: 11px;
    font-weight: 600;
    color: #aaa;
    min-width: 34px;
    padding-top: 1px;
  }

  &__pinput {
    flex: 1;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 500;
    color: #222;
    outline: none;
    transition: border-color 0.15s;

    &::placeholder { color: #bbb; font-weight: 400; }
    &:focus { border-color: #FFC700; }
  }

  /* 날짜 row */
  &__date-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }

  &__date-box {
    position: relative;
    flex: 1;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: border-color 0.15s;

    &:focus-within { border-color: #FFC700; }
  }

  &__date-tilde {
    font-size: 13px;
    color: #bbb;
    flex-shrink: 0;
  }

  /* 직무 태그 wrap */
  &__duties-wrap {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: flex-start;
  }

  &__duty-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 5px 8px 5px 10px;
    font-size: 12px;
    color: #333;

    &--editing {
      border-color: #FFC700;
      background: #FFFBEC;
    }

    &--add {
      border: 1.5px dashed #FFC700;
      padding: 5px 8px;
    }
  }

  &__tag-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 11px;
    padding: 1px 3px;
    border-radius: 4px;
    line-height: 1;
    color: #aaa;
    transition: background 0.1s, color 0.1s;

    &--del  { &:hover { color: #FF5555; background: #FFE8E8; } }
    &--ok   { color: #1DB95A; font-weight: 700; &:hover { background: #E8F9EF; } }
    &--plus { color: #FFC700; font-weight: 700; font-size: 14px; }
  }

  &__duty-edit-input {
    border: none;
    outline: none;
    background: transparent;
    font-size: 12px;
    color: #222;
    min-width: 60px;
    max-width: 140px;
  }

  &__duty-new-input {
    border: none;
    outline: none;
    background: transparent;
    font-size: 12px;
    color: #333;
    min-width: 70px;

    &::placeholder { color: #FFC700; }
  }

  &__categories {
    display: flex;
    justify-content: space-around;
    margin-bottom: 16px;
  }

  &__cat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }

  &__cat-icon {
    width: 52px;
    height: 52px;
    border-radius: 12px;
    border: 2.5px solid transparent;
    transition: border-color 0.15s;
    box-sizing: border-box;
  }

  &__cat-item--active &__cat-icon {
    border-color: #222;
  }

  &__cat-label {
    font-size: 12px;
    color: #555;
  }

  &__plan-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__plan-chip {
    border-radius: 10px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;

    &-name {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
    }

    &-actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }
  }

  &__plan-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 6px;
    font-size: 13px;
    line-height: 1;
    transition: background 0.12s;

    &--edit   { color: #888; &:hover { background: rgba(0,0,0,0.08); } }
    &--delete { color: rgba(0,0,0,0.2); &:hover { background: #FFE8E8; color: #FF5555; } }
  }

  &__add-btn {
    width: 100%;
    padding: 14px;
    background: #2D7A4F;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    cursor: pointer;
    margin-top: 4px;

    &:active { opacity: 0.85; }
  }

  &__footer {
    padding: 16px 20px 32px;
  }

  &__cta {
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

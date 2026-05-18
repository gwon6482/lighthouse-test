<template>
  <div class="cd-plan-write">
    <!-- 헤더 -->
    <CdYellowHeader
      title="진로계획 세우기"
      :subtitle="`${draftPlan.targetJob || '목표 직업'}을 위한 프로젝트를 만들어 보세요`"
    />

    <div class="cd-plan-write__body">
      <!-- 진로계획 이름 -->
      <div class="cd-plan-write__section">
        <h3 class="cd-plan-write__section-title">진로계획 이름</h3>
        <input
          v-model="draftPlan.name"
          class="cd-plan-write__input"
          placeholder="예 : OOO의 마케팅 기획자 되기 프로젝트"
        />
      </div>

      <!-- 목표 직무 -->
      <div class="cd-plan-write__section">
        <h3 class="cd-plan-write__section-title">목표 직무</h3>
        <div class="cd-plan-write__duties">
          <div
            v-for="(duty, i) in draftPlan.duties"
            :key="i"
            class="cd-plan-write__duty-chip"
          >
            {{ duty }}
          </div>
          <div class="cd-plan-write__duty-chip cd-plan-write__duty-chip--add">
            <input
              v-model="newDuty"
              class="cd-plan-write__duty-input"
              placeholder="새 직무를 추가하세요..."
              @keyup.enter="addDuty"
            />
          </div>
        </div>
      </div>

      <!-- 카테고리 + 계획 -->
      <div class="cd-plan-write__section">
        <!-- 카테고리 선택 -->
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

        <!-- 해당 카테고리의 계획 목록 -->
        <div class="cd-plan-write__plan-items">
          <div
            v-for="project in categoryProjects"
            :key="project.id"
            class="cd-plan-write__plan-chip"
            :style="{ background: currentColors.chipBg, color: currentColors.chipText }"
          >
            {{ project.name }}
          </div>
          <button
            class="cd-plan-write__add-btn"
            :style="{ background: currentColors.btn }"
            @click="goToAddProject"
          >계획 추가하기</button>
        </div>
      </div>

      <!-- 목표 기간 -->
      <div class="cd-plan-write__section">
        <h3 class="cd-plan-write__section-title">목표 기간</h3>
        <div class="cd-plan-write__dates">
          <div class="cd-plan-write__date-field">
            <label>시작일</label>
            <div class="cd-plan-write__date-input">
              <input v-model="draftPlan.startDate" type="date" class="cd-plan-write__date-raw" />
              <span v-if="!draftPlan.startDate" class="cd-plan-write__date-placeholder">연도. 월. 일</span>
              <span v-else class="cd-plan-write__date-value">{{ formatDate(draftPlan.startDate) }}</span>
              <span class="cd-plan-write__date-icon">📅</span>
            </div>
          </div>
          <div class="cd-plan-write__date-field">
            <label>종료일 (선택)</label>
            <div class="cd-plan-write__date-input">
              <input v-model="draftPlan.endDate" type="date" class="cd-plan-write__date-raw" />
              <span v-if="!draftPlan.endDate" class="cd-plan-write__date-placeholder">연도. 월. 일</span>
              <span v-else class="cd-plan-write__date-value">{{ formatDate(draftPlan.endDate) }}</span>
              <span class="cd-plan-write__date-icon">📅</span>
            </div>
          </div>
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
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCareerDesign } from '../composables/useCareerDesign'
import CdYellowHeader from '../components/CdYellowHeader.vue'
import type { ProjectCategory } from '../types/career-design'

const router = useRouter()
const { draftPlan } = useCareerDesign()

const newDuty = ref('')
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

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${y}년 ${m}월 ${d}일`
}

function goToAddProject() {
  router.push('/career-design/project/new')
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

  &__input {
    width: 100%;
    border: 1.5px solid #eee;
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 14px;
    outline: none;
    color: #333;

    &::placeholder { color: #bbb; }
    &:focus { border-color: #FFC700; }
  }

  &__duties {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__duty-chip {
    background: #F0F0F0;
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 14px;
    color: #333;

    &--add {
      border: 1.5px dashed #ccc;
      background: transparent;
    }
  }

  &__duty-input {
    border: none;
    outline: none;
    background: transparent;
    font-size: 14px;
    width: 100%;
    color: #333;

    &::placeholder { color: #bbb; }
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
    background: #E8F5EC;
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 14px;
    color: #2D7A4F;
    font-weight: 500;
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

  &__dates {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__date-field {
    display: flex;
    flex-direction: column;
    gap: 6px;

    label {
      font-size: 13px;
      color: #888;
    }
  }

  &__date-input {
    position: relative;
    border: 1.5px solid #eee;
    border-radius: 10px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__date-raw {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
  }

  &__date-placeholder { font-size: 14px; color: #bbb; }
  &__date-value { font-size: 14px; color: #333; }
  &__date-icon { font-size: 16px; }

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

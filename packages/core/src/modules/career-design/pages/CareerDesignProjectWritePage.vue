<template>
  <div class="cd-proj-write" :style="{ '--cat-color': currentColor }">
    <CdYellowHeader
      title="새로운 프로젝트 추가"
      :subtitle="`${draftPlan.targetJob || '목표 직업'}을 위한 프로젝트를 만들어 보세요`"
      :color="currentColor"
      back-to="/career-design/plan/projects"
    />

    <div class="cd-proj-write__body">
      <!-- 카테고리 선택 -->
      <div class="cd-proj-write__section">
        <h3 class="cd-proj-write__label">카테고리</h3>
        <div class="cd-proj-write__categories">
          <div
            v-for="cat in categories"
            :key="cat.value"
            class="cd-proj-write__cat-item"
            :class="{ 'cd-proj-write__cat-item--active': draftProject.category === cat.value }"
            :style="draftProject.category === cat.value ? { borderColor: categoryColorMap[cat.value] } : {}"
            @click="draftProject.category = cat.value"
          >
            <img
              class="cd-proj-write__cat-icon"
              :src="`/career-design/icon-${cat.value}.svg`"
              :alt="cat.label"
            />
            <span
              class="cd-proj-write__cat-label"
              :style="draftProject.category === cat.value ? { color: categoryColorMap[cat.value], fontWeight: '700' } : {}"
            >{{ cat.label }}</span>
          </div>
        </div>
      </div>

      <!-- 프로젝트 이름 -->
      <div class="cd-proj-write__section">
        <h3 class="cd-proj-write__label">프로젝트 이름</h3>
        <input
          v-model="draftProject.name"
          class="cd-proj-write__input"
          placeholder="예 : OO강의 듣기"
        />
      </div>

      <!-- 계획 목표 -->
      <div class="cd-proj-write__section">
        <h3 class="cd-proj-write__label">계획 목표</h3>
        <input
          v-model="draftProject.goal"
          class="cd-proj-write__input"
          placeholder="예 : OO강의의 완강, OO자격 취득, OO 완성하기"
        />
      </div>

      <!-- 실행 주기 -->
      <div class="cd-proj-write__section">
        <h3 class="cd-proj-write__label">실행 주기</h3>
        <div class="cd-proj-write__days">
          <button
            v-for="day in allDays"
            :key="day"
            class="cd-proj-write__day-btn"
            :class="{ 'cd-proj-write__day-btn--active': draftProject.days?.includes(day) }"
            @click="toggleDay(day)"
          >
            {{ day }}
          </button>
        </div>
      </div>

      <!-- 실행 시간 -->
      <div class="cd-proj-write__section">
        <h3 class="cd-proj-write__label">실행 시간</h3>
        <p class="cd-proj-write__sub-label">1회 당 실행 시간</p>
        <div class="cd-proj-write__slider-row">
          <input
            v-model.number="draftProject.duration"
            type="range"
            min="15"
            max="180"
            step="15"
            class="cd-proj-write__slider"
          />
          <span class="cd-proj-write__duration-badge">{{ draftProject.duration }}분</span>
        </div>
        <div class="cd-proj-write__slider-labels">
          <span>15분</span><span>3시간</span>
        </div>
        <div class="cd-proj-write__tip">
          💡 추천: 처음 시작할 때는 30-60분이 적당해요. 너무 긴 시간을 설정하면 부담스러울 수 있어요
        </div>
      </div>

      <!-- 우선순위 -->
      <div class="cd-proj-write__section">
        <h3 class="cd-proj-write__label">우선순위</h3>
        <div class="cd-proj-write__priorities">
          <button
            v-for="p in priorities"
            :key="p.value"
            class="cd-proj-write__priority-btn"
            :class="[`cd-proj-write__priority-btn--${p.value}`, { 'cd-proj-write__priority-btn--active': draftProject.priority === p.value }]"
            @click="draftProject.priority = p.value"
          >
            {{ p.icon }} {{ p.label }}
          </button>
        </div>
      </div>

      <!-- 알림 설정 -->
      <div class="cd-proj-write__section">
        <h3 class="cd-proj-write__label">알림설정</h3>
        <div class="cd-proj-write__notify-row">
          <div class="cd-proj-write__notify-text">
            <span class="cd-proj-write__notify-title">요일 알림</span>
            <span class="cd-proj-write__notify-desc">계획 실행 예정 요일에 아침에 알림을 받아요</span>
          </div>
          <input type="checkbox" v-model="draftProject.notification" class="cd-proj-write__checkbox" />
        </div>
        <div class="cd-proj-write__divider" />
        <div class="cd-proj-write__notify-row">
          <div class="cd-proj-write__notify-text">
            <span class="cd-proj-write__notify-title">놓친 계획 다시 알림</span>
            <span class="cd-proj-write__notify-desc">계획을 실행하지 못했다면, 다음날 다시 알림이 가요</span>
          </div>
          <input type="checkbox" v-model="draftProject.missedNotification" class="cd-proj-write__checkbox" />
        </div>
        <div v-if="draftProject.notification || draftProject.missedNotification" class="cd-proj-write__time-field">
          <label class="cd-proj-write__time-label">알림 시간</label>
          <div class="cd-proj-write__time-input">
            <input v-model="draftProject.notificationTime" type="time" class="cd-proj-write__time-raw" />
            <span class="cd-proj-write__time-display">오전 {{ draftProject.notificationTime }}</span>
            <span>🕐</span>
          </div>
        </div>
      </div>

      <!-- 메모 -->
      <div class="cd-proj-write__section">
        <h3 class="cd-proj-write__label">메모 (선택)</h3>
        <textarea
          v-model="draftProject.memo"
          class="cd-proj-write__textarea"
          placeholder="추가로 기억하고 싶은 내용이나 세부 계획을 작성하세요"
          rows="4"
        />
      </div>

      <!-- 주차별 커리큘럼 -->
      <div class="cd-proj-write__section">
        <div class="cd-proj-write__curr-header">
          <h3 class="cd-proj-write__label">주차별 커리큘럼 <span class="cd-proj-write__optional">선택</span></h3>
          <button class="cd-proj-write__week-add-btn" @click="addWeek">+ 주차 추가</button>
        </div>

        <p v-if="!draftProject.curriculum?.length" class="cd-proj-write__curr-empty">
          주차별 학습 내용을 추가해보세요
        </p>

        <div v-else class="cd-proj-write__weeks">
          <div
            v-for="(week, wi) in draftProject.curriculum"
            :key="wi"
            class="cd-proj-write__week-card"
          >
            <!-- 주차 헤더 -->
            <div class="cd-proj-write__week-head">
              <span class="cd-proj-write__week-num">{{ week.week }}주차</span>
              <input
                v-model="week.title"
                class="cd-proj-write__week-title"
                placeholder="주차 제목 입력..."
              />
              <button class="cd-proj-write__week-del" @click="deleteWeek(wi)">✕</button>
            </div>

            <!-- 항목 목록 -->
            <ol v-if="week.items.length" class="cd-proj-write__week-items">
              <li
                v-for="(item, ii) in week.items"
                :key="ii"
                class="cd-proj-write__week-item"
              >
                <span class="cd-proj-write__week-item-text">{{ item }}</span>
                <button class="cd-proj-write__item-del" @click="deleteItem(wi, ii)">✕</button>
              </li>
            </ol>

            <!-- 항목 추가 input -->
            <div class="cd-proj-write__item-add">
              <input
                v-model="weekItemInputs[wi]"
                class="cd-proj-write__item-input"
                placeholder="항목 입력 후 Enter"
                @keyup.enter="addItem(wi)"
              />
              <button
                class="cd-proj-write__item-btn"
                :style="{ color: currentColor }"
                @click="addItem(wi)"
              >추가</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 하단 버튼 -->
    <div class="cd-proj-write__footer">
      <button class="cd-proj-write__cta" @click="addProject">추가하기</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCareerDesign } from '../composables/useCareerDesign'
import CdYellowHeader from '../components/CdYellowHeader.vue'
import type { DayOfWeek, Priority, ProjectCategory } from '../types/career-design'

const router = useRouter()
const { draftPlan, draftProject, editingProjectId, syncAddProject, syncUpdateProject } = useCareerDesign()

const weekItemInputs = ref<string[]>([])

onMounted(() => {
  window.scrollTo(0, 0)
  weekItemInputs.value = (draftProject.curriculum ?? []).map(() => '')
})

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

const currentColor = computed(() => categoryColorMap[draftProject.category ?? 'knowledge'])

const allDays: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일']

const priorities: { value: Priority; icon: string; label: string }[] = [
  { value: 'high', icon: '🔥', label: '높음' },
  { value: 'normal', icon: '⭐', label: '보통' },
  { value: 'low', icon: '📈', label: '낮음' },
]

function toggleDay(day: DayOfWeek) {
  if (!draftProject.days) draftProject.days = []
  const idx = draftProject.days.indexOf(day)
  if (idx >= 0) draftProject.days.splice(idx, 1)
  else draftProject.days.push(day)
}

async function addWeek() {
  if (!draftProject.curriculum) draftProject.curriculum = []
  draftProject.curriculum.push({ week: draftProject.curriculum.length + 1, title: '', items: [] })
  weekItemInputs.value.push('')
  await nextTick()
  const titleInputs = document.querySelectorAll<HTMLInputElement>('.cd-proj-write__week-title')
  titleInputs[titleInputs.length - 1]?.focus()
}

function deleteWeek(wi: number) {
  draftProject.curriculum?.splice(wi, 1)
  weekItemInputs.value.splice(wi, 1)
  draftProject.curriculum?.forEach((w, i) => { w.week = i + 1 })
}

function addItem(wi: number) {
  const text = weekItemInputs.value[wi]?.trim()
  const week = draftProject.curriculum?.[wi]
  if (!text || !week) return
  week.items.push(text)
  weekItemInputs.value[wi] = ''
}

function deleteItem(wi: number, ii: number) {
  draftProject.curriculum?.[wi]?.items.splice(ii, 1)
}

async function addProject() {
  if (!draftProject.name) return

  const projectData = {
    category: draftProject.category ?? 'knowledge',
    name: draftProject.name ?? '',
    goal: draftProject.goal ?? '',
    days: [...(draftProject.days ?? [])],
    duration: draftProject.duration ?? 60,
    priority: draftProject.priority ?? 'normal',
    notification: draftProject.notification ?? false,
    missedNotification: draftProject.missedNotification ?? true,
    notificationTime: draftProject.notificationTime ?? '09:00',
    memo: draftProject.memo ?? '',
    curriculum: (draftProject.curriculum ?? []).map(w => ({ ...w, items: [...w.items] })),
  }

  if (editingProjectId.value) {
    const idx = draftPlan.projects.findIndex(p => p.id === editingProjectId.value)
    const target = idx >= 0 ? draftPlan.projects[idx] : undefined
    if (target) {
      Object.assign(target, projectData)
      await syncUpdateProject(target)
    }
    editingProjectId.value = null
  } else {
    const newProject = { id: `draft-${Date.now()}`, ...projectData }
    draftPlan.projects.push(newProject)
    await syncAddProject(newProject)
  }

  router.back()
}
</script>

<style lang="scss">
.cd-proj-write {
  --cat-color: #F47820;
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

  &__label {
    font-size: 15px;
    font-weight: 700;
    color: #222;
    margin-bottom: 12px;
  }

  &__sub-label {
    font-size: 12px;
    color: #aaa;
    margin-bottom: 10px;
  }

  /* 카테고리 선택 */
  &__categories {
    display: flex;
    justify-content: space-around;
  }

  &__cat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    padding: 8px;
    border-radius: 12px;
    border: 2px solid transparent;
    transition: border-color 0.15s;
  }

  &__cat-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
  }

  &__cat-label {
    font-size: 12px;
    color: #888;
    transition: color 0.15s, font-weight 0.15s;
  }

  &__input {
    width: 100%;
    border: 1.5px solid #eee;
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 14px;
    outline: none;
    color: #333;
    transition: border-color 0.15s;

    &::placeholder { color: #bbb; }
    &:focus { border-color: var(--cat-color); }
  }

  &__days {
    display: flex;
    gap: 8px;
  }

  &__day-btn {
    flex: 1;
    padding: 10px 0;
    border: 1.5px solid #eee;
    border-radius: 10px;
    background: #fff;
    font-size: 14px;
    font-weight: 600;
    color: #aaa;
    cursor: pointer;
    transition: all 0.15s;

    &--active {
      background: var(--cat-color);
      border-color: var(--cat-color);
      color: #fff;
    }
  }

  &__slider-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
  }

  &__slider {
    flex: 1;
    accent-color: var(--cat-color);
    height: 4px;
  }

  &__duration-badge {
    background: #F0F0F0;
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 14px;
    font-weight: 600;
    color: #333;
    white-space: nowrap;
  }

  &__slider-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #aaa;
    margin-bottom: 12px;
  }

  &__tip {
    background: #EEF4FF;
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 13px;
    color: #4A6FA5;
    line-height: 1.5;
  }

  &__priorities {
    display: flex;
    gap: 10px;
  }

  &__priority-btn {
    flex: 1;
    padding: 12px 0;
    border: 1.5px solid #eee;
    border-radius: 12px;
    background: #fff;
    font-size: 14px;
    font-weight: 600;
    color: #aaa;
    cursor: pointer;
    transition: all 0.15s;

    &--high.cd-proj-write__priority-btn--active {
      background: #FFF0F0;
      border-color: #FF6B6B;
      color: #FF6B6B;
    }

    &--normal.cd-proj-write__priority-btn--active {
      background: #FFFBEC;
      border-color: #FFC700;
      color: #CC9D00;
    }

    &--low.cd-proj-write__priority-btn--active {
      background: #F0F8FF;
      border-color: #4A8CF7;
      color: #4A8CF7;
    }
  }

  &__notify-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 4px 0;
  }

  &__notify-text {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__notify-title {
    font-size: 14px;
    font-weight: 600;
    color: #222;
  }

  &__notify-desc {
    font-size: 12px;
    color: #aaa;
    line-height: 1.4;
  }

  &__checkbox {
    width: 20px;
    height: 20px;
    accent-color: var(--cat-color);
    flex-shrink: 0;
  }

  &__divider {
    height: 1px;
    background: #f0f0f0;
    margin: 12px 0;
  }

  &__time-field {
    margin-top: 12px;
  }

  &__time-label {
    font-size: 12px;
    color: #aaa;
    display: block;
    margin-bottom: 6px;
  }

  &__time-input {
    position: relative;
    border: 1.5px solid #eee;
    border-radius: 10px;
    padding: 12px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__time-raw {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
    width: 100%;
  }

  &__time-display {
    font-size: 14px;
    color: #333;
  }

  &__textarea {
    width: 100%;
    border: 1.5px solid #eee;
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 14px;
    outline: none;
    color: #333;
    resize: none;
    font-family: inherit;
    transition: border-color 0.15s;

    &::placeholder { color: #bbb; }
    &:focus { border-color: var(--cat-color); }
  }

  /* 커리큘럼 */
  &__curr-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;

    .cd-proj-write__label { margin-bottom: 0; }
  }

  &__optional {
    font-size: 12px;
    font-weight: 400;
    color: #aaa;
    margin-left: 6px;
  }

  &__week-add-btn {
    background: none;
    border: 1.5px solid var(--cat-color);
    border-radius: 8px;
    padding: 5px 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--cat-color);
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.12s;

    &:hover { background: color-mix(in srgb, var(--cat-color) 8%, transparent); }
  }

  &__curr-empty {
    font-size: 13px;
    color: #bbb;
    text-align: center;
    padding: 20px 0 8px;
  }

  &__weeks {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__week-card {
    border: 1.5px solid #eee;
    border-left: 3px solid var(--cat-color);
    border-radius: 12px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__week-head {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  &__week-num {
    font-size: 12px;
    font-weight: 700;
    color: var(--cat-color);
    white-space: nowrap;
    background: color-mix(in srgb, var(--cat-color) 10%, white);
    padding: 2px 8px;
    border-radius: 20px;
  }

  &__week-title {
    flex: 1;
    border: none;
    outline: none;
    font-size: 15px;
    font-weight: 700;
    color: #222;
    padding: 0;
    background: transparent;

    &::placeholder { color: #ccc; font-weight: 400; }
  }

  &__week-del {
    background: none;
    border: none;
    font-size: 14px;
    color: #ddd;
    cursor: pointer;
    padding: 2px 4px;
    border-radius: 4px;
    flex-shrink: 0;

    &:hover { background: #FFE8E8; color: #FF5555; }
  }

  &__week-items {
    list-style: decimal;
    padding-left: 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 0;

    ::marker { color: var(--cat-color); font-weight: 600; }
  }

  &__week-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 14px;
    color: #444;
    line-height: 1.5;
    padding: 2px 0;
  }

  &__week-item-text {
    flex: 1;
  }

  &__item-del {
    background: none;
    border: none;
    font-size: 11px;
    color: #ddd;
    cursor: pointer;
    padding: 0 2px;
    flex-shrink: 0;
    line-height: 1;

    &:hover { color: #FF5555; }
  }

  &__item-add {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1.5px dashed #ddd;
    border-radius: 8px;
    padding: 8px 12px;
    transition: border-color 0.15s;

    &:focus-within { border-color: var(--cat-color); }
  }

  &__item-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 13px;
    color: #333;

    &::placeholder { color: #ccc; }
  }

  &__item-btn {
    background: none;
    border: none;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    white-space: nowrap;

    &:hover { text-decoration: underline; }
  }

  &__footer {
    padding: 16px 20px 32px;
  }

  &__cta {
    width: 100%;
    padding: 18px;
    background: var(--cat-color);
    border: none;
    border-radius: 16px;
    font-size: 17px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;
    transition: background 0.2s;

    &:active { opacity: 0.85; }
  }
}
</style>

<template>
  <div class="cd-proj-write">
    <CdYellowHeader
      title="새로운 프로젝트 추가"
      :subtitle="`${draftPlan.targetJob || '목표 직업'}을 위한 프로젝트를 만들어 보세요`"
    />

    <div class="cd-proj-write__body">
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
    </div>

    <!-- 하단 버튼 -->
    <div class="cd-proj-write__footer">
      <button class="cd-proj-write__cta" @click="addProject">추가하기</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCareerDesign } from '../composables/useCareerDesign'
import CdYellowHeader from '../components/CdYellowHeader.vue'
import type { DayOfWeek, Priority } from '../types/career-design'

const router = useRouter()
const { draftPlan, draftProject } = useCareerDesign()

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

function addProject() {
  if (!draftProject.name) return
  draftPlan.projects.push({
    id: `draft-${Date.now()}`,
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
  })
  router.back()
}
</script>

<style lang="scss">
.cd-proj-write {
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
      background: #FFC700;
      border-color: #FFC700;
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
    accent-color: #4A8CF7;
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
    accent-color: #4A8CF7;
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

    &::placeholder { color: #bbb; }
    &:focus { border-color: #FFC700; }
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

<template>
  <div class="cd-routines">
    <CdYellowHeader
      title="루틴 만들기"
      :subtitle="`${draftPlan.targetJob || '목표 직업'}을 위한 매일의 루틴을 추가해 보세요`"
      back-to="/career-design/complete"
    />

    <div class="cd-routines__body">
      <div class="cd-routines__section">
        <p class="cd-routines__intro">
          루틴은 진로계획이 끝날 때까지 꾸준히 반복하는 규칙이에요.
        </p>

        <div class="cd-routines__list">
          <div
            v-for="routine in draftPlan.routines"
            :key="routine.id"
            class="cd-routines__chip"
          >
            <div class="cd-routines__chip-left">
              <span class="cd-routines__chip-name">{{ routine.name }}</span>
              <span class="cd-routines__chip-meta">
                {{ daysSummary(routine.days) }} · {{ routine.duration }}분
                <template v-if="routine.notification"> · 🔔 {{ routine.notificationTime }}</template>
              </span>
            </div>
            <div class="cd-routines__chip-actions">
              <button class="cd-routines__btn cd-routines__btn--edit" @click="editRoutine(routine)">✏️</button>
              <button class="cd-routines__btn cd-routines__btn--delete" @click="deleteRoutine(routine.id)">✕</button>
            </div>
          </div>

          <p v-if="!draftPlan.routines.length" class="cd-routines__empty">
            아직 추가된 루틴이 없어요
          </p>
        </div>

        <button class="cd-routines__add-btn" @click="goToAddRoutine">+ 루틴 추가하기</button>
      </div>
    </div>

    <div class="cd-routines__footer">
      <button class="cd-routines__cta" @click="goNext">완료</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCareerDesign } from '../composables/useCareerDesign'
import CdYellowHeader from '../components/CdYellowHeader.vue'
import type { Routine, DayOfWeek } from '../types/career-design'

const router = useRouter()
const { draftPlan, draftRoutine, editingRoutineId, resetDraftRoutine, syncDeleteRoutine } = useCareerDesign()

const ALL_DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일']

function daysSummary(days: DayOfWeek[]): string {
  if (days.length === 7) return '매일'
  if (days.length === 5 && ALL_DAYS.slice(0, 5).every(d => days.includes(d))) return '평일'
  if (days.length === 2 && days.includes('토') && days.includes('일')) return '주말'
  return days.join('·')
}

function goToAddRoutine() {
  editingRoutineId.value = null
  resetDraftRoutine()
  router.push('/career-design/routine/new')
}

function editRoutine(routine: Routine) {
  editingRoutineId.value = routine.id
  resetDraftRoutine()
  Object.assign(draftRoutine, { ...routine, days: [...routine.days] })
  router.push('/career-design/routine/new')
}

async function deleteRoutine(routineId: string) {
  const idx = draftPlan.routines.findIndex(r => r.id === routineId)
  if (idx >= 0) {
    draftPlan.routines.splice(idx, 1)
    await syncDeleteRoutine(routineId)
  }
}

function goNext() {
  router.push('/career-design/result')
}
</script>

<style lang="scss">
.cd-routines {
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
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__intro {
    font-size: 13px;
    color: #888;
    line-height: 1.5;
    margin: 0;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 48px;
  }

  &__chip {
    border-radius: 10px;
    padding: 12px 14px;
    background: #FFFBEC;
    border: 1px solid #FFE99A;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__chip-left {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__chip-name {
    font-size: 14px;
    font-weight: 600;
    color: #222;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__chip-meta {
    font-size: 12px;
    color: #888;
  }

  &__chip-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  &__btn {
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

  &__empty {
    font-size: 13px;
    color: #bbb;
    text-align: center;
    padding: 8px 0;
    margin: 0;
  }

  &__add-btn {
    width: 100%;
    padding: 14px;
    background: #FFC700;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    cursor: pointer;

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

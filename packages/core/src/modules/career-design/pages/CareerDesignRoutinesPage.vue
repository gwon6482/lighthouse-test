<template>
  <div class="cd-routines">
    <CdYellowHeader
      title="루틴 만들기"
      subtitle="정해진 요일마다 반복할 일을 정해 보세요"
      :back-to="prevPath('routines')" :cancel-edit="editing"
    />
    <CdStepIndicator step="routines" />

    <div class="cd-routines__body">
      <div class="cd-routines__section">
        <p class="cd-routines__intro">반복해서 몸에 익혀야 하는 연습은 루틴으로 따로 두면 매일 하기 쉬워요.</p>

        <!-- 제안(2026-11-21 루틴 리뉴얼 정할 것 3) — 고른 예시 계획에 반복 연습 프로젝트가 있을 때만. 자동으로 넣지 않는다.
             넣으면 그 프로젝트는 주 1회 기록 재기·점검으로 줄고(시간은 한 번만 센다), 루틴을 빼면 되돌린다 -->
        <ul v-if="suggestions.length" class="cd-routines__sugs">
          <li v-for="s in suggestions" :key="s.project.id" class="cd-routines__sug">
            <div class="cd-routines__sug-main">
              <span class="cd-routines__sug-name"><AppIcon name="ui-repeat" /> {{ s.sug.name }}</span>
              <span class="cd-routines__sug-line">‘{{ s.project.name }}’{{ josaWa(s.project.name) }} 함께<template v-if="s.weeks"> · {{ s.weeks.from }}~{{ s.weeks.to }}주차</template></span>
              <span class="cd-routines__sug-line">{{ daysSummary(s.sug.days) }} · {{ s.sug.minutes }}분<template v-if="s.sug.measure"> · 주 1회 기록 재기</template></span>
              <span class="cd-routines__sug-note">{{ s.sug.example }}</span>
            </div>
            <button type="button" class="cd-routines__sug-add" @click="addSuggestion(s.project)">넣기</button>
          </li>
        </ul>

        <div v-if="draftPlan.routines.length" class="cd-routines__list">
          <div
            v-for="routine in draftPlan.routines"
            :key="routine.id"
            class="cd-routines__chip"
          >
            <div class="cd-routines__chip-left">
              <span class="cd-routines__chip-name">{{ routine.name }}</span>
              <span class="cd-routines__chip-meta">
                <template v-if="routine.kind">{{ KIND_LABEL[routine.kind] }} · </template>{{ daysSummary(routine.days) }} · {{ routine.duration }}분
              </span>
              <span v-if="projectName(routine)" class="cd-routines__chip-meta">‘{{ projectName(routine) }}’{{ josaWa(projectName(routine)) }} 함께</span>
            </div>
            <div class="cd-routines__chip-actions">
              <button class="cd-routines__btn cd-routines__btn--edit" aria-label="고치기" @click="editRoutine(routine)"><AppIcon name="ui-edit" /></button>
              <button class="cd-routines__btn cd-routines__btn--delete" aria-label="빼기" @click="deleteRoutine(routine.id)"><AppIcon name="ui-close" /></button>
            </div>
          </div>
        </div>
        <p v-else-if="!suggestions.length" class="cd-routines__empty">아직 추가된 루틴이 없어요</p>

        <button class="cd-routines__add-btn" @click="goToAddRoutine">+ 직접 만들기</button>
      </div>
    </div>

    <div class="cd-routines__footer">
      <button class="cd-routines__btn-secondary" @click="goPrev">이전으로</button>
      <button class="cd-routines__btn-primary" @click="goNext">다음으로</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { useRouter } from 'vue-router'
import { useCareerDesign } from '../composables/useCareerDesign'
import CdYellowHeader from '../components/CdYellowHeader.vue'
import CdStepIndicator from '../components/CdStepIndicator.vue'
import { useDesignSteps } from '../composables/useDesignSteps'
import { KIND_LABEL, applySuggestion, josaWa, attachedWeeks, daysSummary, restoreProject, routineFromSuggestion } from '../lib/routine'
import type { Project, Routine } from '../types/career-design'

const router = useRouter()
const { prevPath, nextPath, editing } = useDesignSteps() // 이전·다음은 새 계획/수정에 따라 다르다(useDesignSteps)
const { draftPlan, draftTimeline, draftRoutine, editingRoutineId, resetDraftRoutine, syncAddRoutine, syncDeleteRoutine, syncUpdateProject } = useCareerDesign()

// 아직 넣지 않은 제안 — 템플릿에서 온 반복 연습 프로젝트(설계 중에만 routine 이 붙어 있다)
const suggestions = computed(() => draftPlan.projects
  .filter((p) => p.routine && !draftPlan.routines.some((r) => r.projectId === p.id))
  .map((p) => ({ project: p, sug: p.routine!, weeks: attachedWeeks(p.id, draftPlan.projects, draftTimeline.value) })))

const projectName = (r: Routine) => (r.projectId ? draftPlan.projects.find((p) => p.id === r.projectId)?.name ?? '' : '')

async function addSuggestion(p: Project) {
  const i = draftPlan.projects.findIndex((x) => x.id === p.id)
  if (i < 0 || !p.routine) return
  const routine = routineFromSuggestion(p.routine, p.id, `draft-${Date.now()}`)
  const next = applySuggestion(p, p.routine)
  draftPlan.projects.splice(i, 1, next)
  draftPlan.routines.push(routine)
  await syncUpdateProject(next)
  await syncAddRoutine(routine)
}

function goToAddRoutine() {
  editingRoutineId.value = null
  resetDraftRoutine()
  router.push('/career-design/routine/new')
}

function editRoutine(routine: Routine) {
  editingRoutineId.value = routine.id
  resetDraftRoutine()
  Object.assign(draftRoutine, JSON.parse(JSON.stringify(routine)))
  router.push('/career-design/routine/new')
}

// 빼면 — 제안을 넣으며 줄였던 프로젝트를 원래대로 되돌린다
async function deleteRoutine(routineId: string) {
  const idx = draftPlan.routines.findIndex(r => r.id === routineId)
  if (idx < 0) return
  const [removed] = draftPlan.routines.splice(idx, 1)
  await syncDeleteRoutine(routineId)
  const pi = removed?.projectId ? draftPlan.projects.findIndex((p) => p.id === removed.projectId) : -1
  const p = pi >= 0 ? draftPlan.projects[pi]! : null
  if (p?.routineBackup && !draftPlan.routines.some((r) => r.projectId === p.id)) {
    const back = restoreProject(p)
    draftPlan.projects.splice(pi, 1, back)
    await syncUpdateProject(back)
  }
}

function goPrev() {
  router.push(prevPath('routines'))
}

function goNext() {
  router.push(nextPath('routines'))
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

  // 루틴 제안(2026-11-21) — 루틴 색(파랑) 하나로
  &__sugs { list-style: none; display: flex; flex-direction: column; gap: 8px; }
  &__sug { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 12px; background: #EEF4FF; }
  &__sug-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
  &__sug-name { display: inline-flex; align-items: center; gap: 5px; font-size: 15px; font-weight: 700; color: #1E3A6E; }
  &__sug-line { font-size: 12.5px; color: #44608F; word-break: keep-all; }
  &__sug-note { margin-top: 2px; font-size: 11px; color: #7B8BA8; }
  &__sug-add {
    flex: none; padding: 9px 16px; border: 0; border-radius: 999px; background: #3B6FD8; color: #fff;
    font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer;
    &:active { opacity: 0.85; }
    &:focus-visible { outline: 2px solid #FFC700; outline-offset: 2px; }
  }

  &__tip {
    background: #EEF4FF;
    border-radius: 10px;
    padding: 12px 14px;
    font-size: 13px;
    color: #4A6FA5;
    line-height: 1.6;
    margin-bottom: 16px;
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
    display: flex;
    gap: 10px;
  }

  &__btn-secondary {
    flex: 1;
    padding: 18px;
    background: #fff;
    border: 1.5px solid #ddd;
    border-radius: 16px;
    font-size: 15px;
    font-weight: 700;
    color: #666;
    cursor: pointer;

    &:active { opacity: 0.85; }
  }

  &__btn-primary {
    flex: 2;
    padding: 18px;
    background: #FFC700;
    border: none;
    border-radius: 16px;
    font-size: 17px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;

    &:active { opacity: 0.85; }

    &:disabled {
      background: #e8e8e8;
      color: #aaa;
      cursor: not-allowed;
    }
  }
}
</style>

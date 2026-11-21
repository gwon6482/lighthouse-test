<template>
  <div class="cd-rt-write">
    <CdYellowHeader
      :title="editingRoutineId ? '루틴 수정' : '루틴 추가'"
      subtitle="정해진 요일마다 반복할 일이에요"
      back-to="/career-design/plan/routines"
    />

    <div class="cd-rt-write__body">
      <!-- 이름 -->
      <div class="cd-rt-write__section">
        <h3 class="cd-rt-write__label">루틴 이름</h3>
        <input
          v-model="draftRoutine.name"
          class="cd-rt-write__input"
          placeholder="예: 체력 훈련, 아침 스트레칭"
        />
      </div>

      <!-- 종류(2026-11-21 루틴 리뉴얼 정할 것 2) — 끝나는 때와 기록 재기가 종류로 정해진다 -->
      <div class="cd-rt-write__section">
        <h3 class="cd-rt-write__label">어떤 연습인가요</h3>
        <div class="cd-rt-write__kinds" role="radiogroup" aria-label="루틴 종류">
          <button
            v-for="k in KINDS" :key="k" type="button" role="radio"
            class="cd-rt-write__kind" :class="{ 'cd-rt-write__kind--on': kind === k }" :aria-checked="kind === k"
            @click="setKind(k)"
          >{{ KIND_LABEL[k] }}</button>
        </div>
        <p class="cd-rt-write__hint">{{ KIND_DESC[kind] }}</p>
      </div>

      <!-- 함께 할 프로젝트(정할 것 1) — 붙이면 그 프로젝트가 놓인 주에만 나온다 -->
      <div v-if="projectOptions.length" class="cd-rt-write__section">
        <h3 class="cd-rt-write__label">함께 할 프로젝트 <span class="cd-rt-write__optional">선택</span></h3>
        <select v-model="projectId" class="cd-rt-write__select" aria-label="함께 할 프로젝트">
          <option value="">없음 · 계획 끝까지</option>
          <option v-for="o in projectOptions" :key="o.id" :value="o.id">{{ o.label }}</option>
        </select>
      </div>

      <!-- 요일 -->
      <div class="cd-rt-write__section">
        <h3 class="cd-rt-write__label">요일</h3>
        <div class="cd-rt-write__days">
          <button
            v-for="day in allDays"
            :key="day"
            type="button"
            class="cd-rt-write__day-btn"
            :class="{ 'cd-rt-write__day-btn--active': draftRoutine.days?.includes(day) }"
            :aria-pressed="!!draftRoutine.days?.includes(day)"
            @click="toggleDay(day)"
          >
            {{ day }}
          </button>
        </div>
        <div class="cd-rt-write__day-presets">
          <button type="button" class="cd-rt-write__preset" @click="setDays(['월','화','수','목','금','토','일'])">매일</button>
          <button type="button" class="cd-rt-write__preset" @click="setDays(['월','화','수','목','금'])">평일</button>
          <button type="button" class="cd-rt-write__preset" @click="setDays(['토','일'])">주말</button>
        </div>
        <!-- 과정(학교·학원) 다니는 날은 기본으로 뺀다(정할 것 5) — 과정이 있는 계획에만 묻는다 -->
        <label v-if="hasPeriod" class="cd-rt-write__check">
          <input v-model="onCourseDays" type="checkbox" />
          <span>과정에 다니는 날에도 해요</span>
        </label>
      </div>

      <!-- 1회 시간 -->
      <div class="cd-rt-write__section">
        <h3 class="cd-rt-write__label">1회 시간</h3>
        <div class="cd-rt-write__slider-row">
          <input
            v-model.number="draftRoutine.duration"
            type="range"
            min="5"
            max="120"
            step="5"
            class="cd-rt-write__slider"
            aria-label="1회 시간"
          />
          <span class="cd-rt-write__duration-badge">{{ draftRoutine.duration }}분</span>
        </div>
        <div class="cd-rt-write__slider-labels">
          <span>5분</span><span>2시간</span>
        </div>
        <div class="cd-rt-write__min">
          <span class="cd-rt-write__min-label">바쁜 날엔</span>
          <select v-model.number="minMinutes" class="cd-rt-write__select cd-rt-write__select--small" aria-label="바쁜 날 최소 시간">
            <option :value="0">정하지 않음</option>
            <option v-for="m in MIN_OPTIONS" :key="m" :value="m" :disabled="m >= (draftRoutine.duration ?? 30)">{{ m }}분만</option>
          </select>
        </div>
      </div>

      <!-- 주 1회 기록 재기(정할 것 4) — 기준 넘기·실력 올리기만 -->
      <div v-if="kind !== 'keep'" class="cd-rt-write__section">
        <h3 class="cd-rt-write__label">주 1회 기록 재기 <span class="cd-rt-write__optional">선택</span></h3>
        <input
          v-model="measureLabel"
          class="cd-rt-write__input"
          :placeholder="kind === 'target' ? '예: 순환식 코스 시간' : '예: 낭독 녹음'"
          aria-label="재는 기록"
        />
        <div v-if="measureLabel.trim()" class="cd-rt-write__units" role="radiogroup" aria-label="기록 단위">
          <button
            v-for="u in UNITS" :key="u" type="button" role="radio"
            class="cd-rt-write__kind cd-rt-write__kind--small" :class="{ 'cd-rt-write__kind--on': measureUnit === u }" :aria-checked="measureUnit === u"
            @click="measureUnit = u"
          >{{ UNIT_LABEL[u] }}</button>
        </div>
      </div>

      <!-- 안전 문구(체력·발성 — 라이브러리 제안에서 온 루틴에 고정) -->
      <p v-if="draftRoutine.safety" class="cd-rt-write__safety"><AppIcon name="tip-warning" /> {{ SAFETY_TEXT[draftRoutine.safety] }}</p>

      <!-- 메모 -->
      <div class="cd-rt-write__section">
        <h3 class="cd-rt-write__label">메모 <span class="cd-rt-write__optional">선택</span></h3>
        <textarea
          v-model="draftRoutine.memo"
          class="cd-rt-write__textarea"
          placeholder="기억하고 싶은 내용을 적어 주세요"
          rows="3"
        />
      </div>
    </div>

    <div class="cd-rt-write__footer">
      <button class="cd-rt-write__cta" :disabled="!draftRoutine.name?.trim() || !draftRoutine.days?.length" @click="saveRoutine">저장하기</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { safeBack } from '@/shared/utils/navigation'
import { useUnsavedGuard } from '@/shared/composables/useUnsavedGuard'
import { useCareerDesign } from '../composables/useCareerDesign'
import CdYellowHeader from '../components/CdYellowHeader.vue'
import { KINDS, KIND_DESC, KIND_LABEL, SAFETY_TEXT, UNIT_LABEL, attachedWeeks } from '../lib/routine'
import type { DayOfWeek, MeasureUnit, Routine, RoutineKind } from '../types/career-design'

const router = useRouter()
const { draftPlan, draftTimeline, draftRoutine, editingRoutineId, syncAddRoutine, syncUpdateRoutine } = useCareerDesign()

const allDays: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일']
const UNITS: MeasureUnit[] = ['time', 'count', 'number', 'media']
const MIN_OPTIONS = [5, 10, 15, 20, 30]

onMounted(() => window.scrollTo(0, 0))

// 미저장 이탈 가드 (R2)
const { bypass } = useUnsavedGuard(() => JSON.stringify(draftRoutine))

// 옛 루틴(종류 없음)은 감 유지로 보여 준다 — 고칠 때 종류를 고를 수 있다
const kind = computed<RoutineKind>(() => draftRoutine.kind ?? 'keep')
function setKind(k: RoutineKind) {
  draftRoutine.kind = k
  if (k === 'keep') draftRoutine.measure = null
}
const projectId = computed({
  get: () => draftRoutine.projectId ?? '',
  set: (v: string) => { draftRoutine.projectId = v },
})
// 과정은 다니는 날 '완료' 한 번이라 붙이지 않는다
const projectOptions = computed(() => draftPlan.projects.filter((p) => !p.period).map((p) => {
  const w = attachedWeeks(p.id, draftPlan.projects, draftTimeline.value)
  return { id: p.id, label: w ? `${p.name} · ${w.from}~${w.to}주차` : p.name }
}))
const hasPeriod = computed(() => draftPlan.projects.some((p) => p.period))
const onCourseDays = computed({
  get: () => draftRoutine.onCourseDays === true,
  set: (v: boolean) => { draftRoutine.onCourseDays = v },
})
const minMinutes = computed({
  get: () => draftRoutine.minMinutes ?? 0,
  set: (v: number) => { if (v) draftRoutine.minMinutes = v; else delete draftRoutine.minMinutes },
})
const measureLabel = ref(draftRoutine.measure?.label ?? '')
const measureUnit = ref<MeasureUnit>(draftRoutine.measure?.unit ?? 'time')

function toggleDay(day: DayOfWeek) {
  if (!draftRoutine.days) draftRoutine.days = []
  const idx = draftRoutine.days.indexOf(day)
  if (idx >= 0) draftRoutine.days.splice(idx, 1)
  else draftRoutine.days.push(day)
}

function setDays(days: DayOfWeek[]) {
  draftRoutine.days = [...days]
}

async function saveRoutine() {
  const name = draftRoutine.name?.trim()
  if (!name) return
  const label = measureLabel.value.trim()
  const keepMeasure = draftRoutine.measure && draftRoutine.measure.label === label && draftRoutine.measure.unit === measureUnit.value
  const routineData: Omit<Routine, 'id'> = {
    name,
    days: allDays.filter((d) => draftRoutine.days?.includes(d)),
    duration: draftRoutine.duration ?? 30,
    memo: draftRoutine.memo ?? '',
    kind: kind.value,
    ...(draftRoutine.projectId ? { projectId: draftRoutine.projectId } : { projectId: '' }),
    measure: kind.value !== 'keep' && label ? (keepMeasure ? { ...draftRoutine.measure! } : { label, unit: measureUnit.value }) : null,
    ...(draftRoutine.minMinutes && draftRoutine.minMinutes < (draftRoutine.duration ?? 30) ? { minMinutes: draftRoutine.minMinutes } : {}),
    ...(draftRoutine.safety ? { safety: draftRoutine.safety } : {}),
    onCourseDays: draftRoutine.onCourseDays === true,
  }

  if (editingRoutineId.value) {
    const target = draftPlan.routines.find(r => r.id === editingRoutineId.value)
    if (target) {
      if (!routineData.minMinutes) delete target.minMinutes
      Object.assign(target, routineData)
      delete target.notification
      delete target.notificationTime
      await syncUpdateRoutine(target)
    }
    editingRoutineId.value = null
  } else {
    const newRoutine: Routine = { id: `draft-${Date.now()}`, ...routineData }
    draftPlan.routines.push(newRoutine)
    await syncAddRoutine(newRoutine)
  }

  bypass()
  safeBack(router, '/career-design/plan/routines')
}
</script>

<style lang="scss">
.cd-rt-write {
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
    margin: 0 0 12px;
  }

  &__optional {
    font-size: 12px;
    font-weight: 400;
    color: #aaa;
    margin-left: 6px;
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

  &__day-presets {
    display: flex;
    gap: 6px;
    margin-top: 10px;
  }

  &__preset {
    background: #F5F5F5;
    border: none;
    border-radius: 8px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    color: #666;
    cursor: pointer;
    transition: background 0.12s;

    &:hover { background: #FFFBEC; color: #CC9D00; }
  }

  &__slider-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
  }

  &__slider {
    flex: 1;
    accent-color: #FFC700;
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
  }

  &__notify-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
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
    accent-color: #FFC700;
    flex-shrink: 0;
  }

  &__time-field {
    margin-top: 14px;
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

  // 2026-11-21 루틴 리뉴얼
  &__kinds, &__units { display: flex; flex-wrap: wrap; gap: 6px; }
  &__units { margin-top: 10px; }
  &__kind {
    padding: 9px 14px; border: 1.5px solid #E6E8EC; border-radius: 999px; background: #fff;
    font-family: inherit; font-size: 13.5px; font-weight: 600; color: #666; cursor: pointer;
    &--on { border-color: #222; background: #222; color: #fff; }
    &--small { padding: 7px 12px; font-size: 12.5px; }
    &:focus-visible { outline: 2px solid #FFC700; outline-offset: 2px; }
  }
  &__hint { margin: 10px 2px 0; font-size: 12.5px; color: #777; }
  &__select {
    width: 100%; padding: 12px 14px; border: 1.5px solid #eee; border-radius: 10px; background: #fff;
    font-family: inherit; font-size: 14px; color: #222;
    &--small { width: auto; padding: 8px 10px; font-size: 13px; }
  }
  &__check { display: flex; align-items: center; gap: 8px; margin-top: 12px; font-size: 13px; color: #555; input { width: 18px; height: 18px; accent-color: #222; } }
  &__min { display: flex; align-items: center; gap: 8px; margin-top: 14px; }
  &__min-label { font-size: 13px; color: #555; }
  &__safety { display: flex; gap: 6px; padding: 12px 14px; border-radius: 12px; background: #FFF4E5; font-size: 12.5px; line-height: 1.5; color: #5B3A12; word-break: keep-all; }

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
    transition: opacity 0.15s;

    &:disabled { opacity: 0.4; cursor: not-allowed; }
    &:not(:disabled):active { opacity: 0.85; }
  }
}
</style>

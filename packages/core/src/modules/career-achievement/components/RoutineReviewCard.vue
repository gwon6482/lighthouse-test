<template>
  <!-- 주간결산 3단계의 루틴 카드(2026-11-21 루틴 리뉴얼 정할 것 4·6) — 'N번 중 M번', 주 1회 기록 추이,
       2주 연속 절반 미만이면 맞춰 보기(과정 '일정 바꾸기'와 같은 모양). 빨간 X나 '실패' 같은 말은 쓰지 않는다 -->
  <section class="rrc">
    <header class="rrc__head">
      <p class="rrc__name"><span class="rrc__chip"><AppIcon name="ui-repeat" /></span>{{ card.routine.name }}</p>
      <p class="rrc__count">이번 주 {{ card.cur.planned }}번 중 <strong>{{ card.cur.done }}번</strong></p>
    </header>

    <div v-if="card.trend && card.trend.points.length && measure" class="rrc__trend">
      <ol v-if="measure.unit !== 'media'" class="rrc__bars" :aria-label="`${measure.label} 추이`">
        <li v-for="pt in card.trend.points" :key="pt.week" class="rrc__bar">
          <span class="rrc__val">{{ formatMeasure(pt.value, measure, pt.total) }}</span>
          <i :style="{ height: `${barHeight(pt.value, pt.total)}%` }" />
          <span class="rrc__wk">{{ pt.week }}주</span>
        </li>
      </ol>
      <p class="rrc__line">{{ card.trend.line }}</p>
    </div>

    <template v-if="card.low">
      <p class="rrc__ask">2주째 절반을 못 했어요. 이번 주에 맞춰 볼까요?</p>
      <div class="rrc__opts" role="radiogroup" aria-label="맞춰 보기">
        <button
          v-for="o in options" :key="o.kind" type="button" role="radio" class="rrc__opt"
          :class="{ 'is-on': draft.kind === o.kind }" :aria-checked="draft.kind === o.kind"
          @click="draft.kind = draft.kind === o.kind ? '' : o.kind"
        >{{ o.label }}</button>
      </div>
      <div v-if="draft.kind === 'days'" class="rrc__days" role="group" aria-label="요일">
        <button
          v-for="d in DAYS" :key="d" type="button" :class="{ 'is-on': draft.days.includes(d) }"
          :aria-pressed="draft.days.includes(d)" @click="toggleDay(d)"
        >{{ d }}</button>
      </div>
      <p v-if="draft.kind" class="rrc__note">마지막 단계에서 [다음 주 시작하기]를 누르면 적용돼요</p>
    </template>
    <p v-if="card.routine.minMinutes" class="rrc__min">바쁜 날엔 {{ card.routine.minMinutes }}분<template v-if="card.routine.minNote">({{ card.routine.minNote }})</template>만 해도 이어져요</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { formatMeasure, measureOf } from '@/modules/career-design/lib/routine'
import type { DayOfWeek } from '@/modules/career-design/types/career-design'
import { routineDraftOf, type RoutineAdjust, type RoutineCard } from '../composables/useWeekReview'

const props = defineProps<{ card: RoutineCard }>()
const DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일']
const draft = computed(() => routineDraftOf(props.card.routine))
const measure = computed(() => measureOf(props.card.routine))
const options = computed<{ kind: Exclude<RoutineAdjust, ''>; label: string }[]>(() => [
  ...(props.card.shorter < props.card.routine.duration ? [{ kind: 'shorter' as const, label: `시간 줄이기(${props.card.shorter}분)` }] : []),
  { kind: 'days', label: '요일 바꾸기' },
  { kind: 'pause', label: '한 주 쉬기' },
  { kind: 'stop', label: '그만두기' },
])
function toggleDay(d: DayOfWeek) {
  const list = draft.value.days
  const i = list.indexOf(d)
  if (i >= 0) list.splice(i, 1)
  else list.push(d)
}
// 막대 높이 — 값의 크기 그대로(낮을수록 좋은 기록도 값대로 그리고, 방향은 아래 한 줄이 말한다)
function barHeight(v: number | null, total?: number): number {
  const ratio = measure.value?.unit === 'ratio'
  const val = (x: number | null, t?: number) => (ratio && t ? (x ?? 0) / t : x ?? 0)
  const vals = (props.card.trend?.points ?? []).map((p) => val(p.value, p.total))
  const max = Math.max(...vals, ratio ? 0.01 : 1)
  return Math.max(12, Math.round((val(v, total) / max) * 100))
}
</script>

<style scoped lang="scss">
.rrc {
  display: flex; flex-direction: column; gap: 10px; padding: 16px; border-radius: 16px; background: #fff; border: 1px solid #DCE6FA;
  &__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px; }
  &__name { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 15px; font-weight: 700; color: #222; }
  &__chip { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 8px; background: #E6F0FF; color: #3B6FD8; font-size: 15px; }
  &__count { margin: 0; font-size: 13px; color: #555; strong { color: #3B6FD8; } }
  &__trend { display: flex; flex-direction: column; gap: 8px; }
  &__bars { list-style: none; display: flex; align-items: flex-end; gap: 14px; height: 96px; padding: 0 4px; }
  &__bar {
    flex: 1; max-width: 56px; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 4px;
    i { width: 100%; border-radius: 6px 6px 2px 2px; background: #BFD3F7; }
    &:last-child i { background: #3B6FD8; }
  }
  &__val { font-size: 12px; font-weight: 700; color: #333; font-variant-numeric: tabular-nums; }
  &__wk { font-size: 11px; color: #888; }
  &__line { margin: 0; font-size: 12.5px; color: #44608F; }
  &__ask { margin: 4px 0 0; font-size: 13.5px; font-weight: 700; color: #333; }
  &__opts { display: flex; flex-wrap: wrap; gap: 6px; }
  &__opt {
    padding: 8px 12px; border: 1.5px solid #E6E8EC; border-radius: 999px; background: #fff;
    font-family: inherit; font-size: 12.5px; font-weight: 600; color: #555; cursor: pointer;
    &.is-on { border-color: #3B6FD8; background: #3B6FD8; color: #fff; }
  }
  &__days { display: flex; gap: 4px; button { flex: 1; padding: 8px 0; border: 1.5px solid #E6E8EC; border-radius: 8px; background: #fff; font-family: inherit; font-size: 13px; color: #555; cursor: pointer; &.is-on { border-color: #3B6FD8; background: #EEF4FF; color: #1E3A6E; font-weight: 700; } } }
  &__note { margin: 0; font-size: 11.5px; color: #888; }
  &__min { margin: 0; font-size: 12px; color: #7B8BA8; }
}
</style>

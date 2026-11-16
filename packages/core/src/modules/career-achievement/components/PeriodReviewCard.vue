<template>
  <!-- 주간결산 3단계의 과정 카드(2026-11-16, 정할 것 1번 — 시안 화면 6·7).
       과정이 진행 중인 동안 매주 나온다: 점검(점검 주에만, 지난주에 못 한 것 한 번 더) + 일정(그대로/바뀌었어요).
       바뀌었으면 끝나는 주·잠시 쉬어요·요일·그만뒀어요 중 하나 — 결산을 마칠 때 적용(useWeekReview.finishReview) -->
  <section class="prc">
    <header class="prc__head">
      <p class="prc__name"><PeriodTag /> <span>{{ card.project.name }}</span></p>
      <p class="prc__sub">{{ subLine }}</p>
    </header>

    <div v-if="card.checks.length" class="prc__checks">
      <p class="prc__label">이번 주 점검<small v-if="card.carried"> · 지난주에 못 한 것 {{ card.carried }}개</small></p>
      <button
        v-for="c in card.checks" :key="c" type="button" class="prc__check" :class="{ 'is-on': draft.checked.includes(c) }"
        role="checkbox" :aria-checked="draft.checked.includes(c)" @click="toggleCheck(c)"
      ><span class="prc__box" aria-hidden="true" />{{ c }}</button>
      <p class="prc__note">못 한 것은 다음 주 결산에 한 번 더 나와요</p>
    </div>

    <div class="prc__sched" role="radiogroup" aria-label="일정">
      <span>일정</span>
      <button type="button" :class="{ 'is-on': !draft.changed }" role="radio" :aria-checked="!draft.changed" @click="draft.changed = false">그대로예요</button>
      <button type="button" :class="{ 'is-on': draft.changed }" role="radio" :aria-checked="draft.changed" @click="draft.changed = true">바뀌었어요</button>
    </div>

    <template v-if="draft.changed">
      <ul class="prc__opts" role="radiogroup" aria-label="무엇이 바뀌었나요">
        <li v-for="o in OPTIONS" :key="o.kind" :class="{ 'is-on': draft.kind === o.kind }">
          <button type="button" class="prc__opt" role="radio" :aria-checked="draft.kind === o.kind" @click="draft.kind = o.kind">
            {{ o.label }}<small v-if="o.hint">{{ o.hint }}</small>
          </button>
          <div v-if="draft.kind === o.kind" class="prc__body">
            <div v-if="o.kind === 'end'" class="prc__stepper">
              <span>끝나는 주</span>
              <button type="button" aria-label="한 주 줄이기" :disabled="draft.endDelta <= -shrinkable" @click="draft.endDelta -= 1">−</button>
              <b>{{ card.endWeek + draft.endDelta }}주차</b>
              <button type="button" aria-label="한 주 늘리기" :disabled="draft.endDelta >= END_MAX" @click="draft.endDelta += 1">+</button>
            </div>
            <div v-else-if="o.kind === 'pause'" class="prc__stepper">
              <span>쉬는 기간</span>
              <button type="button" aria-label="한 주 줄이기" :disabled="draft.pauseWeeks <= 1" @click="draft.pauseWeeks -= 1">−</button>
              <b>{{ draft.pauseWeeks }}주</b>
              <button type="button" aria-label="한 주 늘리기" :disabled="draft.pauseWeeks >= PAUSE_MAX" @click="draft.pauseWeeks += 1">+</button>
            </div>
            <div v-else-if="o.kind === 'days'" class="prc__days" role="group" aria-label="다니는 요일">
              <button
                v-for="d in DAYS" :key="d" type="button" :class="{ 'is-on': draft.days.includes(d) }"
                :aria-pressed="draft.days.includes(d)" @click="toggleDay(d)"
              >{{ d }}</button>
            </div>
            <p v-if="impact" class="prc__impact">{{ impact }}</p>
          </div>
        </li>
      </ul>
      <p class="prc__note">마지막 단계에서 [다음 주 시작하기]를 누르면 적용돼요</p>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PeriodTag from '@/modules/career-design/components/PeriodTag.vue'
import { END_MAX, PAUSE_MAX, periodShrinkable } from '@/modules/career-design/lib/period'
import type { DayOfWeek } from '@/modules/career-design/types/career-design'
import { periodDraftOf, type PeriodCard, type PeriodKind } from '../composables/useWeekReview'
import { parsePlanDate } from '../lib/planBoard'

const props = defineProps<{
  card: PeriodCard
  // 바뀐 일정의 미리보기(useWeekReview.periodPreview) — 바뀐 게 없으면 null
  preview: { endFrom: number; endTo: number; moved: number; planEndFrom: string; planEndTo: string } | null
  weekLabel: (week: number) => string   // 계획 주차 → '2/27'
}>()

const OPTIONS: { kind: PeriodKind; label: string; hint: string }[] = [
  { kind: 'end', label: '끝나는 주가 바뀌었어요', hint: '늘었어요·줄었어요' },
  { kind: 'pause', label: '잠시 쉬어요', hint: '밀렸어요' },
  { kind: 'days', label: '다니는 요일이 바뀌었어요', hint: '' },
  { kind: 'stop', label: '그만뒀어요', hint: '이번 주까지' },
]
const DAYS: DayOfWeek[] = ['월', '화', '수', '목', '금', '토', '일']

const draft = computed(() => periodDraftOf(props.card.project))
const shrinkable = computed(() => periodShrinkable(props.card.project, props.card.idx))

const subLine = computed(() => {
  const i = props.card.info
  const now = !i ? '' : i.pause ? '쉬는 주' : `${i.label} ${i.nth}/${i.of}주`
  const end = `끝 예정 ${props.card.endWeek}주차${props.weekLabel(props.card.endWeek) ? `(${props.weekLabel(props.card.endWeek)})` : ''}`
  return [now, end].filter(Boolean).join(' · ')
})

const ymd = (s: string) => { const d = parsePlanDate(s); return d ? `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}` : '' }
const impact = computed(() => {
  const d = draft.value
  const p = props.preview
  if (d.kind === 'days') return d.days.length ? `다음 주부터 ${d.days.join('·')}에 '완료' 줄이 나와요. 기간은 그대로예요.` : '요일을 하나 이상 골라 주세요.'
  if (!p) return d.kind === 'end' ? '−/+로 끝나는 주를 고쳐 주세요.' : ''
  const plan = p.planEndFrom && p.planEndTo && p.planEndFrom !== p.planEndTo ? ` 완료 예정 ${ymd(p.planEndFrom)} → ${ymd(p.planEndTo)}.` : ''
  if (d.kind === 'stop') {
    const moved = p.moved ? ` 기다리던 프로젝트 ${p.moved}개가 다음 주부터 다시 놓여요.` : ''
    return `이번 주까지로 끝내요. 로드맵에는 '그만둠'으로 남아요.${moved}${plan}`
  }
  const later = p.endTo > p.endFrom
  const lead = d.kind === 'pause' ? `다음 주부터 ${d.pauseWeeks}주 동안은 오늘 할 일에 나오지 않아요. ` : ''
  const end = p.moved
    ? `끝이 ${p.endFrom}주차 → ${p.endTo}주차로 ${later ? '늦어지고' : '당겨지고'}, 그 뒤 프로젝트 ${p.moved}개가 함께 옮겨져요.`
    : `끝이 ${p.endFrom}주차 → ${p.endTo}주차로 ${later ? '늦어져요' : '당겨져요'}.`
  return `${lead}${end}${plan}`
})

function toggleCheck(c: string) {
  const list = draft.value.checked
  const i = list.indexOf(c)
  if (i >= 0) list.splice(i, 1)
  else list.push(c)
}
function toggleDay(day: DayOfWeek) {
  const list = draft.value.days
  const i = list.indexOf(day)
  if (i >= 0) { if (list.length > 1) list.splice(i, 1) }
  else list.splice(DAYS.filter((x) => list.includes(x) || x === day).indexOf(day), 0, day)
}
</script>

<style lang="scss">
.prc {
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1.5px solid #f0dcaa;
  border-radius: 16px;
  background: #ffffff;

  &__head { display: grid; gap: 2px; }
  &__name { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 800; color: #222222; span { min-width: 0; } }
  &__sub { font-size: 12px; color: #999999; }
  &__checks { display: grid; gap: 6px; }
  &__label { font-size: 12px; font-weight: 800; color: #666666; small { font-weight: 600; color: #999999; } }
  // 점검은 여러 개를 고르는 체크 목록 — 라디오(동그라미)로 보이지 않게 앱의 체크박스(내 진로상황 '이미 해 둔 것')와 같은 네모 + ✓
  &__check {
    display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; border: 0; border-radius: 10px;
    background: #fafafa; font-family: inherit; font-size: 13px; font-weight: 600; color: #333333; text-align: left; cursor: pointer;
    &:focus-visible { outline: 2px solid #ffc700; outline-offset: 2px; }
  }
  &__box { flex: none; width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid #cfd3d9; background: #ffffff; display: grid; place-items: center; box-sizing: border-box; }
  &__check.is-on &__box { background: #ffc700; border-color: #ffc700; }
  &__check.is-on &__box::after { content: ''; width: 9px; height: 5px; border-left: 2px solid #ffffff; border-bottom: 2px solid #ffffff; transform: rotate(-45deg) translate(1px, -1px); }
  &__note { font-size: 11.5px; color: #999999; }
  &__sched {
    display: grid; grid-template-columns: auto 1fr 1fr; gap: 6px; align-items: center; padding-top: 10px; border-top: 1px solid #f3ecdc;
    > span { padding-right: 4px; font-size: 12px; font-weight: 800; color: #666666; }
    button {
      padding: 9px 4px; border: 1.5px solid #e6e8ec; border-radius: 10px; background: #ffffff;
      font-family: inherit; font-size: 13px; font-weight: 700; color: #666666; cursor: pointer;
      &.is-on { border-color: #222222; background: #222222; color: #ffffff; }
      &:focus-visible { outline: 2px solid #ffc700; outline-offset: 2px; }
    }
  }
  &__opts {
    display: grid; gap: 6px; margin: 0; padding: 0; list-style: none;
    > li { display: grid; gap: 8px; padding: 10px 11px; border: 1.5px solid #e6e8ec; border-radius: 12px; background: #ffffff; }
    > li.is-on { border-color: #d9b25a; background: #fffaf0; }
  }
  &__opt {
    display: flex; align-items: center; gap: 8px; width: 100%; padding: 0; border: 0; background: none;
    font-family: inherit; font-size: 13px; font-weight: 700; color: #222222; text-align: left; cursor: pointer;
    &::before { content: ""; flex: none; width: 17px; height: 17px; border-radius: 50%; border: 1.8px solid #cfd3d9; background: #ffffff; box-sizing: border-box; }
    small { margin-left: auto; font-size: 11px; font-weight: 600; color: #999999; }
    &:focus-visible { outline: 2px solid #ffc700; outline-offset: 3px; border-radius: 6px; }
  }
  li.is-on &__opt::before { border-color: #8a5a00; background: #8a5a00; box-shadow: inset 0 0 0 3.5px #ffffff; }
  &__body { display: grid; gap: 8px; }
  &__stepper {
    display: flex; align-items: center; gap: 10px; font-size: 12.5px; color: #666666;
    > span { margin-right: auto; }
    button {
      width: 30px; height: 30px; border: 1.5px solid #e6e8ec; border-radius: 9px; background: #ffffff;
      font-family: inherit; font-size: 16px; font-weight: 800; color: #222222; cursor: pointer;
      &:disabled { color: #cccccc; cursor: default; }
    }
    b { min-width: 52px; text-align: center; font-size: 15px; color: #222222; }
  }
  &__days {
    display: flex; flex-wrap: wrap; gap: 6px;
    button {
      width: 34px; height: 34px; border: 0; border-radius: 50%; background: #f2f3f5;
      font-family: inherit; font-size: 12.5px; font-weight: 700; color: #999999; cursor: pointer;
      &.is-on { background: #222222; color: #ffffff; }
    }
  }
  &__impact { padding: 9px 11px; border-radius: 10px; background: #fff4d6; font-size: 12px; line-height: 1.55; color: #5c4500; }
}
</style>

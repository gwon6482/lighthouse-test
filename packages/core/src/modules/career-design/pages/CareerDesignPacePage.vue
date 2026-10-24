<template>
  <div class="cd-pace">
    <CdYellowHeader
      title="얼마나 시간을 낼 수 있어요?"
      subtitle="생활에 맞는 속도를 고르면 타임라인을 채워 드려요"
      back-to="/career-design/plan/projects"
    />

    <div class="cd-pace__body">
      <!-- ① 생활 모습 카드 — 숫자 대신 '언제 끝나는지'를 보고 고른다 -->
      <div class="cd-pace__cards" role="radiogroup" aria-label="진행 속도">
        <div
          v-for="p in options"
          :key="p.key"
          role="radio"
          tabindex="0"
          class="cd-pace__card"
          :class="{ 'cd-pace__card--on': selectedKey === p.key }"
          :aria-checked="selectedKey === p.key"
          @click="selectedKey = p.key"
          @keydown.enter.prevent="selectedKey = p.key"
          @keydown.space.prevent="selectedKey = p.key"
        >
          <div class="cd-pace__card-row">
            <span class="cd-pace__emoji" aria-hidden="true">{{ p.emoji }}</span>
            <span class="cd-pace__main">
              <span class="cd-pace__title">{{ p.title }}</span>
              <span class="cd-pace__life">{{ p.life }}</span>
            </span>
            <span class="cd-pace__result">
              <span class="cd-pace__end">{{ p.endLabel }} 완성</span>
              <span class="cd-pace__meta">{{ p.monthsLabel }} · 주 {{ p.hours }}시간</span>
            </span>
          </div>

          <!-- 올인: 하루 시간을 직접 — 고른 카드일 때만 펼친다 -->
          <div v-if="p.key === 'allin' && selectedKey === 'allin'" class="cd-pace__daily" @click.stop>
            <span class="cd-pace__daily-label">하루</span>
            <button type="button" class="cd-pace__daily-btn" :disabled="daily <= ALLIN_DAILY.min" aria-label="하루 1시간 줄이기" @click="daily--">−</button>
            <span class="cd-pace__daily-value">{{ daily }}시간</span>
            <button type="button" class="cd-pace__daily-btn" :disabled="daily >= ALLIN_DAILY.max" aria-label="하루 1시간 늘리기" @click="daily++">+</button>
            <span class="cd-pace__daily-note">주 6일 기준</span>
          </div>
        </div>
      </div>

      <!-- ② 순서 확인 — 붙여 두고 필요할 때만 연다(너무 길어지면 화면을 나눈다: 2026-10-22 사용자) -->
      <div class="cd-pace__order-box">
        <button type="button" class="cd-pace__order-toggle" :aria-expanded="orderOpen" @click="orderOpen = !orderOpen">
          <span>이 순서로 진행해요</span>
          <span class="cd-pace__order-link">{{ orderOpen ? '접기 ▲' : `순서 보기 (${draftPlan.projects.length}개) ▼` }}</span>
        </button>
        <template v-if="orderOpen">
          <p class="cd-pace__order-hint">오른쪽 ☰ 를 잡고 끌어서 순서를 바꿔요</p>
          <!-- 드래그 정렬 — 손잡이(☰)만 끌 수 있다(목록 위에서 페이지 스크롤과 겹치지 않게). 나머지 줄은 move 전환으로 비켜 준다 -->
          <TransitionGroup tag="ol" name="cd-pace-order" class="cd-pace__order">
            <li
              v-for="(p, i) in draftPlan.projects"
              :key="p.id"
              :data-id="p.id"
              class="cd-pace__order-item"
              :class="{ 'cd-pace__order-item--drag': dragId === p.id }"
              :style="dragId === p.id ? { transform: `translateY(${dragDy}px)` } : undefined"
            >
              <span class="cd-pace__order-no">{{ i + 1 }}</span>
              <span class="cd-pace__order-sw" :style="{ background: CAT_COLOR[p.category] }" />
              <span class="cd-pace__order-name">{{ p.name }}</span>
              <button
                type="button"
                class="cd-pace__order-grip"
                :aria-label="`${p.name} 순서 옮기기 (위·아래 화살표)`"
                @pointerdown="startDrag($event, p.id)"
                @keydown.up.prevent="keyMove(i, -1)"
                @keydown.down.prevent="keyMove(i, 1)"
              >☰</button>
            </li>
          </TransitionGroup>
        </template>
      </div>

      <p v-if="draftPlan.timelineManual" class="cd-pace__warn">
        타임라인에서 직접 옮긴 배치가 있어요. 배치하면 이 속도로 처음부터 다시 채워져요.
      </p>
    </div>

    <div class="cd-pace__footer">
      <button type="button" class="cd-pace__cta" :disabled="!draftPlan.projects.length" @click="apply">이 속도로 배치하기</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import CdYellowHeader from '../components/CdYellowHeader.vue'
import { useCareerDesign } from '../composables/useCareerDesign'
import { toDateKey } from '../composables/usePlanTimeline'
import { PACES, DEFAULT_PACE_HOURS, ALLIN_DAILY, allinWeeklyHours, paceOfHours, buildTimeline, scheduleEndWeek, monthLabelOfWeek, monthsLabel } from '../composables/usePlanPace'
import { getToday } from '@/shared/utils/dev-date'
import type { ProjectCategory } from '../types/career-design'

const router = useRouter()
const { draftPlan, draftTimeline } = useCareerDesign()

const CAT_COLOR: Record<ProjectCategory, string> = {
  qualification: '#1DB95A',
  knowledge: '#F47820',
  skill: '#A855F7',
  portfolio: '#4480F5',
  experience: '#F0507E',
}

// 고른 카드. 예전 임시 계획(시간만 있음)은 시간으로 카드를 찾는다
const selectedKey = ref(draftPlan.paceKey ?? paceOfHours(draftPlan.weeklyHours ?? DEFAULT_PACE_HOURS)?.key ?? 'steady')
const daily = ref(draftPlan.dailyHours ?? ALLIN_DAILY.default)
const hoursOf = (key: string) => (key === 'allin' ? allinWeeklyHours(daily.value) : PACES.find((p) => p.key === key)?.hours ?? DEFAULT_PACE_HOURS)
const orderOpen = ref(false)

// 시작은 오늘 기준으로 보여 준다(목표 설정에서도 시작일은 오늘로 고정된다)
const startKey = computed(() => draftPlan.startDate || toDateKey(getToday()))

// 카드마다 그 속도로 배치했을 때의 완성 시기 — 순서를 바꾸면 함께 바뀐다
const options = computed(() => PACES.map((p) => {
  const hours = hoursOf(p.key)
  const weeks = scheduleEndWeek(draftPlan.projects, hours)
  return { ...p, hours, endLabel: weeks ? monthLabelOfWeek(startKey.value, weeks) : '-', monthsLabel: monthsLabel(weeks) }
}))

// ── 순서 드래그 ──
// 끄는 줄은 손가락을 따라 translateY 로 움직이고, 가운데가 이웃 줄의 가운데를 넘는 순간 배열에서 자리를 바꾼다.
// ⚠️ 위치는 offsetTop(레이아웃 위치)으로 계산한다. getBoundingClientRect 는 이웃 줄이 비켜 주는 전환(FLIP) 도중의
//    변형된 위치를 돌려줘서, 처음 한 칸만 바뀌고 더 안 내려가는 문제가 있었다(2026-10-23 시험).
const dragId = ref<string | null>(null)
const dragDy = ref(0)
let grabOffset = 0       // 손가락과 줄 위쪽 사이 거리
let pointerY = 0
let scrollTimer: number | null = null

const listEl = () => document.querySelector<HTMLElement>('.cd-pace__order')
const rowEl = (id: string) => document.querySelector<HTMLElement>(`.cd-pace__order-item[data-id="${id}"]`)
// 줄의 원래(변형 전) 위쪽 — 화면 좌표
const naturalTop = (el: HTMLElement) => (listEl()?.getBoundingClientRect().top ?? 0) + el.offsetTop

function settle() {
  const id = dragId.value
  const el = id ? rowEl(id) : null
  if (!el) return
  dragDy.value = pointerY - grabOffset - naturalTop(el)
}

function reorderTo() {
  const id = dragId.value
  if (!id) return
  const list = draftPlan.projects
  const from = list.findIndex((p) => p.id === id)
  const el = rowEl(id)
  if (from < 0 || !el) return
  const center = pointerY - grabOffset + el.offsetHeight / 2
  // 끄는 줄을 뺀 나머지 중 원래 가운데가 끄는 줄 가운데보다 위에 있는 줄 수 = 들어갈 자리
  let to = 0
  for (const p of list) {
    if (p.id === id) continue
    const o = rowEl(p.id)
    if (o && naturalTop(o) + o.offsetHeight / 2 < center) to++
  }
  if (to !== from) {
    const [moved] = list.splice(from, 1)
    list.splice(to, 0, moved!)
    nextTick(settle)
  }
}

function onMove(e: PointerEvent) {
  pointerY = e.clientY
  settle()
  reorderTo()
}

// 화면 위·아래 가장자리로 끌면 자동 스크롤
function autoScroll() {
  const EDGE = 70
  if (pointerY < EDGE) window.scrollBy(0, -8)
  else if (pointerY > window.innerHeight - EDGE) window.scrollBy(0, 8)
  else return
  settle()
  reorderTo()
}

function endDrag() {
  dragId.value = null
  dragDy.value = 0
  window.removeEventListener('pointermove', onMove)
  window.removeEventListener('pointerup', endDrag)
  window.removeEventListener('pointercancel', endDrag)
  if (scrollTimer !== null) { clearInterval(scrollTimer); scrollTimer = null }
}

function startDrag(e: PointerEvent, id: string) {
  if (e.button !== 0) return
  e.preventDefault()
  const el = rowEl(id)
  if (!el) return
  grabOffset = e.clientY - naturalTop(el)
  pointerY = e.clientY
  dragDy.value = 0
  dragId.value = id
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', endDrag)
  window.addEventListener('pointercancel', endDrag)
  scrollTimer = window.setInterval(autoScroll, 16)
}

onBeforeUnmount(endDrag)

// 키보드: 손잡이에서 ↑/↓
function keyMove(i: number, dir: -1 | 1) {
  const list = draftPlan.projects
  const j = i + dir
  if (j < 0 || j >= list.length) return
  const id = list[i]!.id
  ;[list[i], list[j]] = [list[j]!, list[i]!]
  nextTick(() => rowEl(id)?.querySelector<HTMLButtonElement>('.cd-pace__order-grip')?.focus())
}

function apply() {
  if (!draftPlan.startDate) draftPlan.startDate = startKey.value
  const hours = hoursOf(selectedKey.value)
  draftPlan.paceKey = selectedKey.value
  draftPlan.dailyHours = selectedKey.value === 'allin' ? daily.value : undefined
  draftPlan.weeklyHours = hours
  draftTimeline.value = buildTimeline(draftPlan.projects, hours)
  draftPlan.timelineManual = false
  router.push('/career-design/complete')
}
</script>

<style lang="scss">
.cd-pace {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;

  &__body { flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 14px; }

  &__cards { display: flex; flex-direction: column; gap: 10px; }
  &__card {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    background: #fff;
    border: 2px solid transparent;
    border-radius: 16px;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s;

    &--on { border-color: #FFC700; background: #FFFCEF; }
    &:focus-visible { outline: 2px solid #4480F5; outline-offset: 2px; }
  }
  &__card-row { display: flex; align-items: center; gap: 12px; }
  &__daily {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: #fff;
    border-radius: 12px;
    cursor: default;
  }
  &__daily-label { font-size: 13px; font-weight: 700; color: #555; }
  &__daily-btn {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 1.5px solid #e2e2e2;
    background: #fff;
    font-size: 18px;
    font-weight: 700;
    color: #333;
    cursor: pointer;

    &:disabled { opacity: 0.3; cursor: default; }
  }
  &__daily-value { min-width: 52px; text-align: center; font-size: 16px; font-weight: 800; color: #222; font-variant-numeric: tabular-nums; }
  &__daily-note { margin-left: auto; font-size: 11px; color: #999; }
  &__emoji { font-size: 26px; flex-shrink: 0; }
  &__main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  &__title { font-size: 16px; font-weight: 700; color: #222; }
  &__life { font-size: 12px; color: #888; }
  &__result { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
  &__end { font-size: 14px; font-weight: 700; color: #222; white-space: nowrap; }
  &__meta { font-size: 11px; color: #999; white-space: nowrap; }

  &__order-box { background: #fff; border-radius: 16px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
  &__order-toggle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    border: none;
    background: none;
    padding: 0;
    font-size: 14px;
    font-weight: 700;
    color: #333;
    cursor: pointer;
  }
  &__order-link { font-size: 12px; font-weight: 600; color: #888; }
  &__order { position: relative; list-style: none; display: flex; flex-direction: column; gap: 4px; }  // 줄의 offsetTop 기준이 목록이 되게
  &__order-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 4px 4px 8px;
    background: #fafafa;
    border-radius: 8px;
    font-size: 13px;

    &--drag {
      z-index: 2;
      background: #fff;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.16);
      transition: none !important;   // 손가락을 바로 따라오게(이동 전환 제외)
    }
  }
  &__order-no { width: 18px; text-align: right; font-size: 11px; font-weight: 700; color: #aaa; flex-shrink: 0; }
  &__order-sw { width: 6px; height: 20px; border-radius: 3px; flex-shrink: 0; }
  &__order-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #333; }
  &__order-hint { font-size: 12px; color: #999; margin: -2px 0 0; }
  &__order-grip {
    flex-shrink: 0;
    width: 36px;
    height: 32px;
    border: none;
    border-radius: 8px;
    background: none;
    color: #aaa;
    font-size: 16px;
    cursor: grab;
    touch-action: none;   // 손잡이를 누른 채 움직이면 페이지가 아니라 줄이 움직인다
    user-select: none;
    -webkit-user-select: none;

    &:active { cursor: grabbing; background: #f0f0f0; }
    &:focus-visible { outline: 2px solid #4480F5; outline-offset: 1px; }
  }

  &__warn { font-size: 12px; color: #B54708; background: #FFF4E5; border-radius: 10px; padding: 10px 12px; line-height: 1.5; }

  &__footer { padding: 16px 20px 32px; }
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

    &:disabled { background: #e8e8e8; color: #aaa; cursor: default; }
    &:active { opacity: 0.85; }
  }
}

// 드래그 중 다른 줄이 비켜 주는 전환
.cd-pace-order-move { transition: transform 0.15s ease; }
@media (prefers-reduced-motion: reduce) { .cd-pace-order-move { transition: none; } }
</style>

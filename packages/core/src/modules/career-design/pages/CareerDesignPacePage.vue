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
        <ol v-if="orderOpen" class="cd-pace__order">
          <li v-for="(p, i) in draftPlan.projects" :key="p.id" class="cd-pace__order-item">
            <span class="cd-pace__order-no">{{ i + 1 }}</span>
            <span class="cd-pace__order-sw" :style="{ background: CAT_COLOR[p.category] }" />
            <span class="cd-pace__order-name">{{ p.name }}</span>
            <button type="button" class="cd-pace__order-mv" :disabled="i === 0" aria-label="위로" @click="move(i, -1)">↑</button>
            <button type="button" class="cd-pace__order-mv" :disabled="i === draftPlan.projects.length - 1" aria-label="아래로" @click="move(i, 1)">↓</button>
          </li>
        </ol>
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
import { computed, ref } from 'vue'
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

function move(i: number, dir: -1 | 1) {
  const list = draftPlan.projects
  const j = i + dir
  if (j < 0 || j >= list.length) return
  ;[list[i], list[j]] = [list[j]!, list[i]!]
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
  &__order { list-style: none; display: flex; flex-direction: column; gap: 4px; }
  &__order-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: #fafafa; border-radius: 8px; font-size: 13px; }
  &__order-no { width: 18px; text-align: right; font-size: 11px; font-weight: 700; color: #aaa; flex-shrink: 0; }
  &__order-sw { width: 6px; height: 20px; border-radius: 3px; flex-shrink: 0; }
  &__order-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #333; }
  &__order-mv {
    width: 26px;
    height: 26px;
    border: none;
    border-radius: 6px;
    background: #fff;
    color: #444;
    cursor: pointer;

    &:disabled { opacity: 0.3; cursor: default; }
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
</style>

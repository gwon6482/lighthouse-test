<template>
  <!-- 주간결산(2026-10-30 시안) — 단계마다 페이지(/career-achievement/review/1~5). ⚠️ 평가·템포는 아직 저장하지 않는다 -->
  <div class="wv">
    <header class="wv-bar">
      <div class="wv-bar__row">
        <button type="button" class="wv-bar__close" aria-label="닫기" @click="close"><AppIcon name="ui-close" /></button>
        <span class="wv-bar__title">주간결산</span>
        <span class="wv-bar__step">{{ step }} / 5</span>
      </div>
      <div class="wv-bar__dots" aria-hidden="true"><i v-for="n in 5" :key="n" :class="{ on: n <= step }" /></div>
    </header>

    <div v-if="loading" class="ah__loading">불러오는 중...</div>
    <div v-else-if="!plan || !range" class="ah__empty"><p class="ah__empty-text">결산할 한 주가 없어요.</p></div>

    <main v-else class="wv-body">
      <!-- 1. 이번 주 성과 -->
      <section v-if="step === 1" class="wv-page">
        <p class="wv-eyebrow">{{ weekNo }}주차 · {{ rangeLabel }}</p>
        <h1 class="wv-title">{{ headline }}</h1>
        <div class="wv-hero">
          <strong class="wv-hero__pct">{{ percent }}<small>%</small></strong>
          <span class="wv-hero__sub">계획한 {{ planned }}개 중 {{ done }}개 완료</span>
        </div>
        <ul class="wv-days">
          <li v-for="d in days" :key="d.key" class="wv-day" :class="`wv-day--${d.state}`">
            <span class="wv-day__dow">{{ d.dow }}</span>
            <span class="wv-day__mark">
              <AppIcon v-if="d.state === 'all'" name="ui-check" />
              <template v-else-if="d.state === 'part'">{{ d.done }}/{{ d.planned }}</template>
              <template v-else-if="d.state === 'rest' || d.state === 'before'">–</template>
              <AppIcon v-else name="ui-close" />
            </span>
            <span class="wv-day__date">{{ d.date }}</span>
          </li>
        </ul>
        <div class="wv-stats">
          <div><strong>{{ fullDays }}<small>/{{ workDays }}일</small></strong><span>다 해낸 날</span></div>
          <div><strong>{{ streak }}일</strong><span>연속 달성</span></div>
          <div><strong>{{ minutes >= 60 ? `${Math.floor(minutes / 60)}시간` : `${minutes}분` }}</strong><span>쌓은 시간</span></div>
          <div><strong>{{ photos }}</strong><span>남긴 사진</span></div>
        </div>
      </section>

      <!-- 2. 전체 계획에서의 성장 -->
      <section v-else-if="step === 2" class="wv-page">
        <p class="wv-eyebrow">{{ plan.targetJob }}까지의 여정</p>
        <h1 class="wv-title">이번 주에 <em>{{ progress.percent - beforePercent }}%p</em> 더 나아갔어요</h1>
        <div class="wv-grow">
          <div class="wv-grow__row"><span>지난주까지 {{ beforePercent }}%</span><strong>지금 {{ progress.percent }}%</strong></div>
          <span class="wv-grow__bar">
            <i class="wv-grow__before" :style="{ width: `${beforePercent}%` }" />
            <i class="wv-grow__gain" :style="{ width: `${Math.max(0, progress.percent - beforePercent)}%` }" />
          </span>
          <p class="wv-grow__meta">{{ totalWeeks }}주 중 {{ weekNo }}주차 · 남은 {{ Math.max(0, totalWeeks - (weekNo ?? 0)) }}주</p>
        </div>
        <h2 class="wv-sub">이번 주에 끝낸 항목 {{ weekGain.count }}개</h2>
        <ul v-if="weekGain.items.length" class="wv-gain">
          <li v-for="(g, i) in weekGain.items.slice(0, 6)" :key="i">
            <i class="ah-day__dot" :style="{ background: g.color }" />
            <span class="wv-gain__text">{{ g.text }}</span>
            <small>{{ g.project }}</small>
          </li>
        </ul>
        <p v-else class="wv-empty">이번 주에 끝낸 커리큘럼 항목이 없어요. 다음 주에 하나씩 해 봐요.</p>
      </section>

      <!-- 3. 스스로 평가 -->
      <section v-else-if="step === 3" class="wv-page">
        <h1 class="wv-title">이번 주는 어땠나요?</h1>
        <div class="wv-sat" role="radiogroup" aria-label="만족도">
          <button
            v-for="s in SATISFACTION" :key="s.v" type="button" class="wv-sat__btn"
            :class="{ on: reviewDraft.satisfaction === s.v }" role="radio" :aria-checked="reviewDraft.satisfaction === s.v"
            @click="reviewDraft.satisfaction = s.v"
          >
            <span class="wv-sat__stars"><AppIcon v-for="n in s.v" :key="n" name="ui-star" /></span>
            <span>{{ s.label }}</span>
          </button>
        </div>
        <label class="wv-field">
          <span>한 줄 메모</span>
          <input v-model="reviewDraft.note" maxlength="60" placeholder="예: 국가시험 기출을 처음으로 시간 안에 풀었다">
        </label>
        <label class="wv-field">
          <span>다음 주 다짐</span>
          <input v-model="reviewDraft.pledge" maxlength="60" placeholder="예: 수요일엔 미루지 않기">
        </label>
      </section>

      <!-- 4. 템포 -->
      <section v-else-if="step === 4" class="wv-page">
        <h1 class="wv-title">이번 주 속도는 어땠나요?</h1>
        <p class="wv-desc">지금 속도는 <strong>{{ currentPace.title }}</strong>(주 약 {{ currentPace.hours }}시간)예요.</p>
        <div class="wv-feel">
          <button v-for="f in FEELS" :key="f.k" type="button" class="wv-feel__btn" :class="{ on: reviewDraft.feel === f.k }" @click="pickFeel(f.k)">{{ f.label }}</button>
        </div>
        <template v-if="reviewDraft.feel">
          <h2 class="wv-sub">다음 주부터 속도</h2>
          <ul class="wv-paces">
            <li v-for="p in PACES" :key="p.key">
              <button type="button" class="wv-pace" :class="{ on: chosenKey === p.key }" @click="reviewDraft.paceKey = p.key">
                <AppIcon :name="p.icon" class="wv-pace__icon" />
                <span class="wv-pace__body"><strong>{{ p.title }}</strong><small>{{ p.life }}</small></span>
                <em v-if="p.key === currentPace.key" class="wv-pace__tag">지금</em>
                <em v-else-if="p.key === recommendedPace.key" class="wv-pace__tag wv-pace__tag--rec">추천</em>
              </button>
            </li>
          </ul>
          <!-- 바뀌는 내용을 먼저 알려 준다(사용자: 전체 계획이 수정되니 알려 줘야 한다) -->
          <div class="wv-impact" :class="{ 'wv-impact--same': chosenKey === currentPace.key }">
            <template v-if="chosenKey === currentPace.key">
              <strong>지금 속도를 유지해요</strong>
              <p>계획은 그대로예요. 지금 속도로 가면 {{ ymd(baseline.endDate) }}쯤 끝나요.</p>
            </template>
            <template v-else>
              <strong>전체 계획이 다시 짜여요</strong>
              <p>남은 프로젝트 {{ impact.remaining }}개를 {{ nextWeek }}주차부터 '{{ chosen.title }}' 속도로 다시 배치해요.</p>
              <p class="wv-impact__date">완료 예정 {{ ymd(baseline.endDate) }} → <b>{{ ymd(impact.endDate) }}</b> <em>{{ diffLabel }}</em></p>
              <p class="wv-impact__note">결산을 마칠 때 적용돼요. (시안 — 아직 실제로 바꾸지 않아요)</p>
            </template>
          </div>
        </template>
      </section>

      <!-- 5. 다음 주 일정 -->
      <section v-else class="wv-page">
        <h1 class="wv-title">다음 주 일정을 확인하고 시작해요</h1>
        <p v-if="reviewDraft.pledge" class="wv-pledge"><AppIcon name="ui-target" /> {{ reviewDraft.pledge }}</p>
        <ul class="wv-next">
          <li v-for="d in nextDays" :key="d.key" class="wv-next__day">
            <span class="wv-next__label">{{ d.label }}</span>
            <span v-if="!d.lines.length" class="wv-next__rest">쉬는 날</span>
            <span v-for="(l, i) in d.lines" :key="i" class="wv-next__item"><i class="ah-day__dot" :style="{ background: l.color }" />{{ l.name }}</span>
          </li>
        </ul>
        <button type="button" class="wv-link" @click="router.push({ name: 'Career Achievement Weekly Schedule' })">일정 조정하기 <AppIcon name="ui-chevron-right" /></button>
      </section>
    </main>

    <footer v-if="plan && range" class="wv-foot">
      <button v-if="step > 1" type="button" class="wv-foot__prev" @click="go(step - 1)">이전</button>
      <button v-if="step < 5" type="button" class="wv-foot__next" :disabled="!canNext" @click="go(step + 1)">다음</button>
      <button v-else type="button" class="wv-foot__next" @click="finish">다음 주 시작하기</button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import { useWeekReview, reviewDraft } from '../composables/useWeekReview'
import { PACES } from '@/modules/career-design/composables/usePlanPace'
import { parsePlanDate, daysBetween } from '../lib/planBoard'
import { reviewState } from '../composables/useReviewState'

const route = useRoute()
const router = useRouter()
const step = computed(() => Math.min(5, Math.max(1, Number(route.params.step) || 1)))
const {
  loading, plan, load, streak, progress,
  range, weekNo, rangeLabel, totalWeeks,
  days, planned, done, percent, fullDays, workDays, minutes, photos, headline,
  weekGain, beforePercent,
  currentPace, recommendedPace, endIfPace, nextWeek, nextDays,
} = useWeekReview()

const SATISFACTION = [
  { v: 1 as const, label: '아쉬워요' }, { v: 2 as const, label: '조금 아쉬워요' }, { v: 3 as const, label: '보통이에요' },
  { v: 4 as const, label: '만족해요' }, { v: 5 as const, label: '아주 만족해요' },
]
const FEELS = [
  { k: 'tight' as const, label: '빠듯했어요' }, { k: 'fit' as const, label: '적당했어요' }, { k: 'loose' as const, label: '여유 있었어요' },
]
function pickFeel(k: 'tight' | 'fit' | 'loose') {
  reviewDraft.feel = k
  reviewDraft.paceKey = '' // 느낌을 바꾸면 추천으로 다시
}
const chosenKey = computed(() => reviewDraft.paceKey || recommendedPace.value.key)
const chosen = computed(() => PACES.find((p) => p.key === chosenKey.value)!)
const impact = computed(() => endIfPace(chosen.value) as { endDate: string; weeks: number; remaining: number })
const ymd = (s?: string) => { const d = parsePlanDate(s); return d ? `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}` : '-' }
// 비교 기준 = 지금 속도로 남은 프로젝트를 다시 놓았을 때(같은 계산끼리 비교해야 늦어짐/빨라짐이 맞다)
const baseline = computed(() => endIfPace(currentPace.value) as { endDate: string; weeks: number; remaining: number })
const diffLabel = computed(() => {
  const a = parsePlanDate(baseline.value.endDate); const b = parsePlanDate(impact.value.endDate)
  if (!a || !b) return ''
  const w = Math.round(daysBetween(a, b) / 7)
  return w === 0 ? '비슷해요' : w > 0 ? `${w}주 늦어져요` : `${-w}주 빨라져요`
})

const canNext = computed(() => (step.value === 3 ? reviewDraft.satisfaction > 0 : step.value === 4 ? !!reviewDraft.feel : true))
const go = (n: number) => router.replace({ name: 'Career Achievement Review', params: { step: String(n) } })
const close = () => router.push({ name: 'Career Achievement' })
function finish() {
  // 결산 마침 표시(팝업·버튼이 이번 주엔 다시 안 나온다). 평가 저장·속도 적용은 4단계(API) 작업에서
  if (plan.value && range.value) reviewState(plan.value.planId, range.value.weekStart).markDone()
  router.push({ name: 'Career Achievement' })
}

onMounted(load)
</script>

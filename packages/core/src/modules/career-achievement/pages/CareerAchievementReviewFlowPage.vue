<template>
  <!-- 주간결산(2026-10-30) — 단계마다 페이지(/career-achievement/review/1~5). 마지막에 기록 저장 + 속도를 바꿨으면 남은 계획 재배치 -->
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
        <!-- 시험 뒤 첫 결산(2026-11-22 시험일 역산 정할 것 9) — 합격 여부는 묻지 않는다. 하나만 고르니 동그라미 -->
        <div v-for="p in examsPassed" :key="p.id" class="wv-exam-after">
          <strong>{{ COPY.afterTitle(mdPlain(examDateOf(p)), p.name) }}</strong>
          <div class="wv-exam-after__opts" role="radiogroup" :aria-label="COPY.afterTitle(mdPlain(examDateOf(p)), p.name)" @keydown="afterKey($event, p.id)">
            <button
              v-for="o in COPY.afterOptions" :key="o.key" type="button" role="radio"
              class="wv-exam-after__opt" :class="{ on: examAfterDraftOf(p.id).kind === o.key }" :aria-checked="examAfterDraftOf(p.id).kind === o.key"
              :tabindex="examAfterDraftOf(p.id).kind === o.key || (!examAfterDraftOf(p.id).kind && o.key === COPY.afterOptions[0]!.key) ? 0 : -1"
              @click="examAfterDraftOf(p.id).kind = o.key"
            ><i /><b>{{ o.label }}</b><small>{{ o.sub }}</small></button>
          </div>
          <label v-if="examAfterDraftOf(p.id).kind === 'next'" class="wv-exam-after__date">
            <span>{{ COPY.afterDateLabel }}</span>
            <input type="date" :min="dayAfterWeek" :value="examAfterDraftOf(p.id).date" @change="examAfterDraftOf(p.id).date = ($event.target as HTMLInputElement).value" />
          </label>
        </div>
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
        <!-- 쌓은 시간을 나눠서(2026-11-26 집중모드 넓히기 — 둘 이상일 때만) -->
        <p v-if="minutesSplit" class="wv-split">{{ minutesSplit }}</p>
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
        <!-- 과정(2026-11-16) — 진행 중인 과정마다 점검 + 일정. 바꾼 일정은 마칠 때 적용 -->
        <PeriodReviewCard
          v-for="c in periodCards" :key="c.project.id"
          :card="c" :preview="periodPreview(c.project.id)" :week-label="weekLabel"
        />
        <!-- 루틴(2026-11-21 루틴 리뉴얼) — 'N번 중 M번' · 기록 추이 · 2주 연속 절반 미만이면 맞춰 보기 -->
        <RoutineReviewCard v-for="c in routineCards" :key="c.routine.id" :card="c" />
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
        <p class="wv-desc">지금 속도는 <strong>{{ currentPace.title }}</strong>(주 약 {{ currentPace.hours }}시간){{ ieyo(currentPace.title) }}.</p>
        <div class="wv-feel">
          <button v-for="f in FEELS" :key="f.k" type="button" class="wv-feel__btn" :class="{ on: reviewDraft.feel === f.k }" @click="pickFeel(f.k)">{{ f.label }}</button>
        </div>
        <template v-if="reviewDraft.feel">
          <h2 class="wv-sub">다음 주부터 속도</h2>
          <ul class="wv-paces">
            <li v-for="p in paceOptions" :key="p.key">
              <button type="button" class="wv-pace" :class="{ on: chosenKey === p.key }" @click="reviewDraft.paceKey = p.key">
                <AppIcon :name="p.icon" class="wv-pace__icon" />
                <span class="wv-pace__body"><strong>{{ p.title }}</strong><small>{{ p.life }}</small></span>
                <em v-if="p.key === currentPace.key" class="wv-pace__tag">지금</em>
                <em v-else-if="p.key === recommendedPace.key" class="wv-pace__tag wv-pace__tag--rec">추천</em>
              </button>
            </li>
          </ul>
          <!-- 바뀌는 내용을 먼저 알려 준다(사용자: 전체 계획이 수정되니 알려 줘야 한다) -->
          <div class="wv-impact" :class="{ 'wv-impact--same': samePlan }">
            <template v-if="samePlan">
              <strong>지금 속도를 유지해요</strong>
              <p>계획은 그대로예요. 지금 속도로 가면 {{ ymd(baseline.endDate) }}쯤 끝나요.</p>
            </template>
            <template v-else>
              <strong>전체 계획이 다시 짜여요</strong>
              <p v-if="chosenKey !== currentPace.key">아직 시작 안 한 프로젝트 {{ impact.remaining }}개를 {{ nextWeek }}주차부터 '{{ chosen.title }}' 속도로 다시 배치해요. {{ keptLine }}</p>
              <p v-else>3단계에서 바꾼 과정 일정에 맞춰 아직 시작 안 한 프로젝트를 {{ nextWeek }}주차부터 다시 배치해요. 속도는 그대로예요.</p>
              <!-- 시험일을 넘기게 되면 — 고른 카드 바로 아래·완료 예정 줄 위, 주황(진로상담 11-22 정할 것 7) -->
              <template v-if="examLate">
                <p class="wv-impact__exam">{{ COPY.reviewLate(chosen.title, examLate.late.name, mdPlain(examLate.late.date), -examLate.late.spare) }}</p>
                <p v-if="examLate.now" class="wv-impact__exam">{{ COPY.reviewFit(currentPace.title, examLate.now.spare) }}</p>
              </template>
              <!-- 날짜로 정한 걸음(2026-11-25) — 앞 걸음이 그 뒤로 새로 밀리면 한 줄(시험일 줄과 같은 자리·색, 막지 않음) -->
              <p v-for="line in flipLines" :key="line" class="wv-impact__exam">{{ line }}</p>
              <p class="wv-impact__date">완료 예정 {{ ymd(baseline.endDate) }} → <b>{{ ymd(impact.endDate) }}</b> <em>{{ diffLabel }}</em></p>
              <p class="wv-impact__note">마지막 단계에서 [다음 주 시작하기]를 누르면 적용돼요.</p>
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
      <button v-else type="button" class="wv-foot__next" :disabled="saving" @click="finish">{{ saving ? '저장 중...' : '다음 주 시작하기' }}</button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { datedRange, eunNeun, euro, flipGroups, gwaWa, iga } from '@/modules/career-design/lib/projectDates'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import { useWeekReview, reviewDraft, examAfterDraftOf } from '../composables/useWeekReview'
import { examDateOf, mdPlain } from '@/modules/career-design/lib/examDate'
import { COPY } from '@/modules/career-design/lib/examDateRules'
import PeriodReviewCard from '../components/PeriodReviewCard.vue'
import RoutineReviewCard from '../components/RoutineReviewCard.vue'
import { weekDateRange } from '@/modules/career-design/composables/usePlanTimeline'
import { parsePlanDate, daysBetween } from '../lib/planBoard'

const route = useRoute()
const router = useRouter()
const step = computed(() => Math.min(5, Math.max(1, Number(route.params.step) || 1)))
const {
  loading, plan, load, streak, progress,
  range, weekNo, rangeLabel, totalWeeks,
  days, planned, done, percent, fullDays, workDays, minutes, minutesSplit, photos, headline,
  weekGain, beforePercent,
  paceOptions, currentPace, recommendedPace, endIfPace, nextWeek, nextDays, finishReview, currentEnd,
  periodCards, periodChanges, periodPreview,
  routineCards,
  examsPassed, examLateIfPace,
} = useWeekReview()
const examLate = computed(() => examLateIfPace(chosen.value))
function afterKey(e: KeyboardEvent, id: string) {
  const d = ({ ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 } as Record<string, number>)[e.key]
  if (!d) return
  e.preventDefault()
  const opts = COPY.afterOptions
  const i = Math.max(0, opts.findIndex((o) => o.key === examAfterDraftOf(id).kind))
  const next = opts[(i + d + opts.length) % opts.length]!
  examAfterDraftOf(id).kind = next.key
  const group = e.currentTarget as HTMLElement
  nextTick(() => group.querySelectorAll<HTMLElement>('[role="radio"]')[opts.indexOf(next)]?.focus())
}
// 다음 시험 날짜는 결산한 주 다음 날부터(그날을 고르면 다음 주에 또 묻게 된다 — 코드 검토 11-22)
const dayAfterWeek = computed(() => {
  const d = parsePlanDate(range.value?.weekEnd)
  if (!d) return undefined
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})
// 계획 주차 → 그 주 마지막 날 'M/D'(과정 카드의 끝 예정)
function weekLabel(week: number): string {
  const pl = plan.value
  const r = pl ? weekDateRange(pl.startDate, week, pl.reviewDay) : null
  const d = r ? parsePlanDate(r.end) : null
  return d ? `${d.getMonth() + 1}/${d.getDate()}` : ''
}
// 진행 중인 과정 이름 — 속도를 바꿔도 그대로라고 알려 준다
const periodNames = computed(() => periodCards.value.map((c) => c.project.name).join(', '))
// '진행 중인 프로젝트와 과정(…)과 날짜를 정한 공모전 도전은 그대로예요' — 날짜 걸음(2026-11-25)은 아직 시작 전이어도 그 자리
const keptLine = computed(() => {
  const parts = ['진행 중인 프로젝트']
  if (periodNames.value) parts.push(`과정(${periodNames.value})`)
  const dated = impact.value.datedKept.map((p) => p.name)
  if (dated.length) parts.push(`날짜를 정한 ${dated.join(', ')}`)
  const head = parts.slice(0, -1).map((w) => (w.endsWith(')') ? `${w}${gwaWa(w.replace(/\(.*\)$/, '')).slice(-1)}` : gwaWa(w))).join(' ')
  const last = parts[parts.length - 1]!
  const lastJ = last.endsWith(')') ? `${last}${eunNeun(last.replace(/\(.*\)$/, '')).slice(-1)}` : eunNeun(last)
  return `${head ? `${head} ` : ''}${lastJ} 그대로예요.`
})
const flipLines = computed(() => flipGroups(impact.value.flips).map((g) =>
  `‘${chosen.value.title}’${euro(chosen.value.title).slice(chosen.value.title.length)} 바꾸면 ${iga(g.more ? `${g.first.name} 외 ${g.more}개` : g.first.name)} ${g.dated.name}(${datedRange(g.dated, '~')}) 뒤로 밀려요.`))

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
// 올인은 계획에 저장된 하루 시간 그대로(검토 11-17 L2 — paceOptions)
const chosen = computed(() => paceOptions.value.find((p) => p.key === chosenKey.value)!)
const impact = computed(() => endIfPace(chosen.value))
// 속도도 그대로이고 과정 일정도 그대로면 계획이 바뀌지 않는다
const samePlan = computed(() => chosenKey.value === currentPace.value.key && !periodChanges.value.length)
// '올인(…)이에요' · '꾸준히(…)예요' — 괄호 앞 낱말의 받침으로 고른다
const ieyo = (w: string) => { const c = w.charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0 ? '이에요' : '예요' }
const ymd = (s?: string) => { const d = parsePlanDate(s); return d ? `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}` : '-' }
// 비교 기준 = 지금 속도로 남은 프로젝트를 다시 놓았을 때(같은 계산끼리 비교해야 늦어짐/빨라짐이 맞다)
const baseline = computed(() => ({ endDate: currentEnd.value }))
const diffLabel = computed(() => {
  const a = parsePlanDate(baseline.value.endDate); const b = parsePlanDate(impact.value.endDate)
  if (!a || !b) return ''
  const w = Math.round(daysBetween(a, b) / 7)
  return w === 0 ? '끝나는 때는 비슷해요' : w > 0 ? `${w}주 늦어져요` : `${-w}주 빨라져요`
})

const canNext = computed(() => (step.value === 3 ? reviewDraft.satisfaction > 0 : step.value === 4 ? !!reviewDraft.feel : true))
const go = (n: number) => router.replace({ name: 'Career Achievement Review', params: { step: String(n) } })
const close = () => router.push({ name: 'Career Achievement' })
const saving = ref(false)
async function finish() {
  if (saving.value) return
  const changed = chosen.value.key !== currentPace.value.key
  // 속도·과정 일정을 바꾸면 계획 전체가 다시 짜인다 — 한 번 더 알려 주고 확인(사용자: 알려 줘야 한다)
  const what = [changed ? `속도를 '${chosen.value.title}'(으)로` : '', periodChanges.value.length ? `과정 일정(${periodChanges.value.map((x) => x.before.name).join(', ')})을` : ''].filter(Boolean).join(', ')
  if (what && !confirm(`${what} 바꾸면 남은 계획이 다시 배치되고\n완료 예정이 ${ymd(baseline.value.endDate)} → ${ymd(impact.value.endDate)}로 바뀌어요.\n적용할까요?`)) return
  saving.value = true
  try {
    await finishReview(chosen.value)
    router.push({ name: 'Career Achievement' })
  } catch {
    alert('결산을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

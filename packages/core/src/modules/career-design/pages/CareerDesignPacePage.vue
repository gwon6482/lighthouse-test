<template>
  <div class="cd-pace">
    <CdYellowHeader
      title="얼마나 시간을 낼 수 있어요?"
      subtitle="생활에 맞는 속도를 고르면 타임라인을 채워 드려요"
      :back-to="prevPath('pace')" :cancel-edit="editing"
    />
    <CdStepIndicator step="pace" />

    <div class="cd-pace__body">
      <!-- 시험 날짜(2026-11-22 시험일 역산 — 정할 것 1) — '합격하면 완료' 걸음이 있을 때만. 비워 둬도 된다. 날짜를 미리 채우지 않는다 -->
      <section v-if="examTargets.length" class="cd-pace__dates" aria-label="시험 날짜">
        <h2 class="cd-pace__dates-title">{{ COPY.boxTitle }}</h2>
        <div v-for="p in examTargets" :key="p.id" class="cd-pace__date-row">
          <span class="cd-pace__date-name"><i class="cd-pace__date-sw" />{{ p.name }}</span>
          <label class="cd-pace__date-val" :class="{ 'cd-pace__date-val--empty': !examDateOf(p) }">
            {{ examDateOf(p) ? dotDate(examDateOf(p)) : COPY.boxEmpty }}
            <input
              :id="`exam-date-${p.id}`" type="date" class="cd-pace__date-input"
              :value="examDateOf(p)" :min="startKey" :aria-label="`${p.name} 시험 날짜`"
              @change="setExamDate(p.id, ($event.target as HTMLInputElement).value)"
            />
          </label>
          <button v-if="examDateOf(p) && isExam(p)" type="button" class="cd-pace__date-done" @click="openDone(p.id)">{{ doneLabelOf(p) }}</button>
        </div>
        <p v-for="w in examWarns" :key="w" class="cd-pace__date-warn">{{ w }}</p>
        <p class="cd-pace__date-hint">{{ COPY.boxHint }}</p>
        <p class="cd-pace__date-hint">{{ COPY.boxApply }}</p>
      </section>

      <!-- 시험에 맞는지(정할 것 2) — 낼 수 있는 시간과 예시 분량을 나란히. 단서는 아래 -->
      <div v-if="headSlot" class="cd-pace__facts cd-pace__facts--exam" :class="`cd-pace__facts--${headSlot.verdict}`">
        <p class="cd-pace__stat">{{ headLine }}</p>
        <p class="cd-pace__fact">{{ headSlot.need ? COPY.headNote : COPY.headShortNote }}</p>
        <button v-if="headSlot.verdict === 'short'" type="button" class="cd-pace__choose" @click="openShort(headSlot.id)">{{ COPY.headChoose }}</button>
      </div>

      <!-- 큰 시험·과정이 든 계획(2026-11-17, 시안 화면 4) — 비슷한 사람들이 실제로 걸린 기간을 일정을 정하는 곳에서 함께 보여 준다.
           시험 날짜를 넣은 계획에서는 합격자 수치를 날짜 묶음 바로 아래에 두지 않고 카드 아래로 옮긴다(데이터 평가 11-22) -->
      <div v-if="hasExam || periodWeeksTotal" class="cd-pace__facts">
        <p v-if="examHead && !statBelow" class="cd-pace__stat">{{ examHead }}</p>
        <p v-if="hasExam" class="cd-pace__fact">날짜는 계획을 마치는 때예요. 합격하는 날이 아니에요.</p>
        <p v-if="firstPass" class="cd-pace__fact">{{ firstPass }}</p>
        <p v-if="periodWeeksTotal" class="cd-pace__fact">과정 {{ formatWeeks(periodWeeksTotal) }}{{ josaEun(formatWeeks(periodWeeksTotal)) }} 속도와 상관없이 그대로예요.</p>
        <p v-if="ageRuleOn" class="cd-pace__fact">공무원 공채는 시험을 보는 해에 18세가 되면 응시할 수 있어요(교정·보호직은 20세). 그 해 시험에 맞춰 시험 공부 날짜를 잡았어요.</p>
      </div>

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
          @click="pick(p.key)"
          @keydown.enter.prevent="pick(p.key)"
          @keydown.space.prevent="pick(p.key)"
        >
          <div class="cd-pace__card-row">
            <span class="cd-pace__emoji" aria-hidden="true"><AppIcon :name="p.icon" /></span>
            <span class="cd-pace__main">
              <span class="cd-pace__title">{{ p.title }}</span>
              <span class="cd-pace__life">{{ p.life }}</span>
              <!-- 내 진로상황으로 미리 고른 카드에만(오너 결정 2, 11-17) — 직접 고르면 없앤다 -->
              <span v-if="presetBySituation && selectedKey === p.key" class="cd-pace__preset">내 진로상황에 맞춰 골라 뒀어요</span>
            </span>
            <span class="cd-pace__result">
              <span class="cd-pace__end">{{ p.endLabel }} 완성</span>
              <span class="cd-pace__meta">{{ p.monthsLabel }} · 주 {{ p.hours }}시간</span>
            </span>
          </div>
          <!-- 시험 전에 마치는 카드와 빠듯한 카드에만 한 줄 — 늦는 카드에는 달지 않는다(오너 11-22) -->
          <span v-if="p.worst && p.worst.verdict !== 'short' && selectedKey !== p.key" class="cd-pace__fit" :class="`cd-pace__fit--${p.worst.verdict}`">{{ verdictText(p.worst) }}</span>

          <!-- 올인: 하루 시간을 직접 — 고른 카드일 때만 펼친다 -->
          <div v-if="p.key === 'allin' && selectedKey === 'allin'" class="cd-pace__daily" @click.stop>
            <span class="cd-pace__daily-label">하루</span>
            <button type="button" class="cd-pace__daily-btn" :disabled="daily <= ALLIN_DAILY.min" aria-label="하루 1시간 줄이기" @click="daily--">−</button>
            <span class="cd-pace__daily-value">{{ daily }}시간</span>
            <button type="button" class="cd-pace__daily-btn" :disabled="daily >= ALLIN_DAILY.max" aria-label="하루 1시간 늘리기" @click="daily++">+</button>
            <span class="cd-pace__daily-note">주 6일 기준</span>
          </div>

          <!-- 큰 시험 — 고른 카드에만. 고른 시간이 곧 시험 공부 시간이다. 먼 날짜는 막지 않고 사실 한 줄(근거 밖)을 붙인다 -->
          <div v-if="selectedKey === p.key && (p.exam || p.worst)" class="cd-pace__exam">
            <p v-if="p.worst" class="cd-pace__exam-fit" :class="`cd-pace__exam-fit--${p.worst.verdict}`">{{ COPY.cardEnd(p.worst.name, p.worstYm) }} {{ verdictText(p.worst) }}<template v-if="p.worst.verdict !== 'short'">.</template></p>
            <template v-if="p.exam"><p v-for="(line, li) in p.exam.lines" :key="li">{{ line }}</p></template>
          </div>
        </div>
      </div>

      <!-- 합격자 수치 — 시험 날짜를 넣은 계획에서는 카드 아래(데이터 평가 11-22) -->
      <div v-if="examHead && statBelow" class="cd-pace__facts">
        <p class="cd-pace__stat">{{ examHead }}</p>
      </div>

      <!-- ② 순서 확인 — 붙여 두고 필요할 때만 연다(너무 길어지면 화면을 나눈다: 2026-10-22 사용자) -->
      <div class="cd-pace__order-box">
        <button type="button" class="cd-pace__order-toggle" :aria-expanded="orderOpen" @click="orderOpen = !orderOpen">
          <span>이 순서로 진행해요</span>
          <span class="cd-pace__order-link">{{ orderOpen ? '접기' : `순서 보기 (${draftPlan.projects.length}개)` }} <AppIcon name="ui-chevron-down" class="chevron-toggle" :class="{ 'chevron-toggle--open': orderOpen }" /></span>
        </button>
        <template v-if="orderOpen">
          <p class="cd-pace__order-hint">오른쪽 <AppIcon name="ui-drag" /> 손잡이를 잡고 끌어서 순서를 바꿔요</p>
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
              ><AppIcon name="ui-drag" /></button>
            </li>
          </TransitionGroup>
        </template>
      </div>

      <p v-if="draftPlan.timelineManual" class="cd-pace__warn">
        타임라인에서 직접 옮긴 배치가 있어요. 배치하면 이 속도로 처음부터 다시 채워져요.
      </p>
    </div>

    <!-- 모자랄 때 고르기(정할 것 3 · 오너 11-22 4) · 이미 공부해 둔 것(정할 것 4) — 하나만 고르니 동그라미 -->
    <div v-if="sheet" class="cd-pace__dim" @click.self="sheet = null">
      <div class="cd-pace__sheet" role="dialog" aria-modal="true" :aria-label="sheetTitle">
        <h2 class="cd-pace__sheet-title">{{ sheetTitle }}</h2>
        <div class="cd-pace__opts" role="radiogroup">
          <template v-if="sheet.kind === 'short'">
            <button
              v-for="o in shortOptions" :key="o.key" type="button" role="radio" :aria-checked="sheetPick === o.key"
              class="cd-pace__opt" :class="{ 'cd-pace__opt--on': sheetPick === o.key }" @click="sheetPick = o.key"
            ><i /><b>{{ o.label }}</b><small v-if="o.sub">{{ o.sub }}</small></button>
          </template>
          <template v-else>
            <button
              v-for="c in doneChoices" :key="c.key" type="button" role="radio" :aria-checked="sheetPick === c.key"
              class="cd-pace__opt" :class="{ 'cd-pace__opt--on': sheetPick === c.key }" @click="sheetPick = c.key"
            ><i /><b>{{ c.label }}</b><small>{{ COPY.doneLeft(hoursLabel(c.hours), c.rest) }}</small></button>
          </template>
        </div>
        <div v-if="sheet.kind === 'done' && donePreview" class="cd-pace__result-box" :class="`cd-pace__result-box--${donePreview.verdict}`">
          <b>{{ COPY.doneResult(selectedTitle, verdictText(donePreview)) }}</b>
        </div>
        <p v-if="sheet.kind === 'done'" class="cd-pace__sheet-note">{{ COPY.doneNote }}</p>
        <button type="button" class="cd-pace__sheet-cta" :disabled="!sheetPick" @click="confirmSheet">{{ sheet.kind === 'done' ? COPY.doneApply : COPY.sheetNext }}</button>
      </div>
    </div>

    <div class="cd-pace__footer">
      <button type="button" class="cd-pace__cta" :disabled="!draftPlan.projects.length" @click="apply">이 속도로 배치하기</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import CdYellowHeader from '../components/CdYellowHeader.vue'
import CdStepIndicator from '../components/CdStepIndicator.vue'
import { useDesignSteps } from '../composables/useDesignSteps'
import { useCareerDesign } from '../composables/useCareerDesign'
import { projectWeeks, toDateKey, type ScheduleOptions } from '../composables/usePlanTimeline'
import { budgetHours, stripLoad, withRoutineLoad } from '../lib/routine'
import { PACES, DEFAULT_PACE_HOURS, ALLIN_DAILY, allinWeeklyHours, examAgeDelayed, examAgeOptions, paceFromSituation, paceOfHours, buildTimeline, pacedProjects, monthLabelOfWeek, monthsLabel } from '../composables/usePlanPace'
import { examPaceSummary, firstPassLine, isExam } from '../lib/examPace'
import { doneChoicesOf, examDateOf, examDateWarnings, hoursLabel, mdLabel, skipDonePhases, takesExamDate, weekEndYm, withoutApplyItem, type ExamSlot } from '../lib/examDate'
import { COPY } from '../lib/examDateRules'
import { schedulePreview } from '../composables/usePlanPace'
import { useCareerProfile } from '../composables/useCareerProfile'
import { useAuthStore } from '@/shared/stores/auth'
import { formatWeeks } from '@/modules/encyclopedia/lib/preparation'
import { getToday } from '@/shared/utils/dev-date'
import type { Project, ProjectCategory } from '../types/career-design'
import AppIcon from '@/shared/components/AppIcon.vue'

const router = useRouter()
const { prevPath, nextPath, editing } = useDesignSteps() // 이전·다음은 새 계획/수정에 따라 다르다(useDesignSteps)
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

// 고른 카드 — 사용자가 고르면 내 진로상황 기본값으로 덮지 않는다
const touched = ref(false)
// 내 진로상황으로 미리 고른 카드인가 — 표시를 달고, 사용자가 직접 고르면 뗀다
const presetBySituation = ref(false)
function pick(key: string) { selectedKey.value = key; touched.value = true; presetBySituation.value = false }

// 큰 시험이 든 계획인가(검토 11-17 C2 — 수치가 없어도 '합격하는 날이 아니에요'를 단다)
const hasExam = computed(() => draftPlan.projects.some(isExam))
// 1차 합격 효력(오너 결정 3, 11-17) — 자료에 칸이 있는 시험이 든 계획에서 전업보다 느린 속도일 때 한 줄
const firstPass = computed(() => firstPassLine(draftPlan.projects, hoursOf(selectedKey.value)))

// 기본 속도는 내 진로상황에서(2026-11-17) — 큰 시험이 든 계획에만, 저장된 속도가 없을 때만(검토 C5). 내 진로상황을 모르면 '집중해서'
const { profile: careerProfile, load: loadCareerProfile } = useCareerProfile()
onMounted(async () => {
  if (draftPlan.paceKey || draftPlan.weeklyHours || !hasExam.value) return
  const prof = careerProfile.value ?? await loadCareerProfile().catch(() => null)
  const fromSituation = paceFromSituation(prof?.school)
  if (touched.value) return
  selectedKey.value = fromSituation ?? 'focus'
  presetBySituation.value = !!fromSituation       // 모를 때 고른 '집중해서'는 내 진로상황에 맞춘 것이 아니다
})

// 고등학생 응시 나이(2026-11-17) — 9급은 시험이 있는 해에 18세(교정·보호 20세) 이상. 시험 걸음이 그 해보다 먼저 끝나지 않게 시작을 미룬다(examAgeOptions)
const auth = useAuthStore()
const schedOpts = computed<ScheduleOptions>(() => examAgeOptions(startKey.value, auth.user?.age, draftPlan.reviewDay))
// 고른 속도에서 나이 규칙 때문에 시험 시작이 실제로 밀렸을 때만 사실 상자에 한 줄(총괄 11-17 — 밀리지 않았으면 줄 없음)
const ageRuleOn = computed(() => examAgeDelayed(draftPlan.projects, hoursOf(selectedKey.value), schedOpts.value))

// 카드마다 그 속도로 배치했을 때의 완성 시기 — 순서를 바꾸면 함께 바뀐다. 큰 시험은 그 속도로 기간을 다시 잡는다(schedulePreview 안에서)
// 시험일이 있으면 그 걸음을 시험 주에 맞춰 놓고(lib/examDate.ts), 가장 빠듯한 시험 하나로 카드의 판정 줄을 정한다
const examCtx = computed(() => ({ startDate: startKey.value, reviewDay: draftPlan.reviewDay, late: new Set(draftPlan.examLate ?? []) }))
const options = computed(() => PACES.map((p) => {
  const hours = hoursOf(p.key)
  // 루틴 시간도 속도 예산에(2026-11-21 루틴 리뉴얼 정할 것 5) — 고칠 때 이미 루틴이 있으면 센다(새 계획은 루틴 단계가 뒤라 0)
  const L = withRoutineLoad(draftPlan.projects, draftPlan.routines)
  const pv = schedulePreview(L.projects, budgetHours(hours, L.freeMin), schedOpts.value, examCtx.value)
  const weeks = pv.endWeek
  const exam = examPaceSummary(draftPlan.projects, hours)
  const worst = worstOf(pv.exams)
  return {
    ...p, hours, endLabel: weeks ? monthLabelOfWeek(startKey.value, weeks, draftPlan.reviewDay) : '-', monthsLabel: monthsLabel(weeks), exam,
    worst, worstYm: worst ? weekEndYm(startKey.value, worst.end, draftPlan.reviewDay) : '',
  }
}))

// ── 시험 날짜(2026-11-22 시험일 역산) ──
const examTargets = computed(() => draftPlan.projects.filter(takesExamDate))
const worstOf = (xs: ExamSlot[]) => xs.reduce<ExamSlot | null>((w, x) => (!w || x.spare < w.spare ? x : w), null)
const dotDate = (d: string) => { const [y, m, dd] = d.split('-'); return `${y}. ${Number(m)}. ${Number(dd)}.` }
const selectedOption = computed(() => options.value.find((o) => o.key === selectedKey.value))
const selectedTitle = computed(() => selectedOption.value?.title ?? '')
const headSlot = computed(() => selectedOption.value?.worst ?? null)
const headLine = computed(() => {
  const x = headSlot.value
  if (!x) return ''
  return x.need ? COPY.headAvail(mdLabel(x.date), hoursLabel(x.available), hoursLabel(x.need)) : COPY.headWeeks(x.name, mdLabel(x.date), x.usableWeeks)
})
const verdictText = (x: Pick<ExamSlot, 'verdict' | 'spare'>) => (x.verdict === 'ahead' ? COPY.verdictAhead(x.spare) : x.verdict === 'tight' ? COPY.verdictTight : COPY.verdictShort)
// 시험 날짜를 넣은 계획에서는 합격자 수치를 카드 아래로
const statBelow = computed(() => examTargets.value.some((p) => !!examDateOf(p)))
const examWarns = computed(() => examDateWarnings(draftPlan.projects).map((w) =>
  w.kind === 'pair' ? COPY.pairWarn(w.text.after!, w.text.before!) : w.kind === 'grade' ? COPY.gradeWarn : COPY.courseWarn(w.text.course!)))

const projectById = (id: string) => draftPlan.projects.find((p) => p.id === id)
function setExamDate(id: string, v: string) {
  const p = projectById(id)
  if (!p) return
  const detail = { ...(p.methodDetail ?? {}) }
  if (v) detail.deadline = v
  else delete detail.deadline
  p.methodDetail = detail
  // 큰 시험이면 판정보다 먼저 '어디까지 했나요'를 묻는다(오너 11-22 1). 짧은 시험은 묻지 않는다
  if (v && isExam(p) && doneChoicesOf(p).length) openDone(id)
}

// 시트 — short: 모자랄 때 고르기 / done: 이미 공부해 둔 것
const sheet = ref<{ kind: 'short' | 'done'; id: string } | null>(null)
const sheetPick = ref('')
const sheetProject = computed(() => (sheet.value ? projectById(sheet.value.id) : undefined))
const doneChoices = computed(() => (sheetProject.value ? doneChoicesOf(sheetProject.value) : []))
const currentDoneKey = (p: Project) => {
  const cs = doneChoicesOf(p)
  return cs.find((c) => c.hours === p.studyHours)?.key ?? 'none'
}
const doneLabelOf = (p: Project) => doneChoicesOf(p).find((c) => c.key === currentDoneKey(p))?.label ?? ''
function openDone(id: string) {
  const p = projectById(id)
  if (!p) return
  sheet.value = { kind: 'done', id }
  sheetPick.value = currentDoneKey(p)
}
function openShort(id: string) {
  sheet.value = { kind: 'short', id }
  sheetPick.value = ''
}
const sheetTitle = computed(() => {
  const s = sheet.value; const p = sheetProject.value
  if (!s || !p) return ''
  if (s.kind === 'done') return COPY.doneTitle(p.name)
  const x = selectedOption.value?.worst
  return COPY.sheetTitle(mdLabel(examDateOf(p)), x?.id === p.id ? x.usableWeeks : 0)
})
// 맞는 속도(시험 전에 마치거나 빠듯) 가운데 가장 느린 것 — 있으면 맨 위에 '○○로 바꾸기'
const fasterPace = computed(() => {
  const id = sheet.value?.id
  return options.value.find((o) => o.key !== selectedKey.value && !!o.worst && o.worst.id === id && o.worst.verdict !== 'short'
    && (o.hours > hoursOf(selectedKey.value)))
})
const shortOptions = computed(() => {
  const p = sheetProject.value
  const out: { key: string; label: string; sub: string }[] = []
  if (fasterPace.value) out.push({ key: `pace:${fasterPace.value.key}`, label: COPY.sheetFaster(fasterPace.value.title), sub: '' })
  for (const o of COPY.sheetOptions) {
    if (o.key === 'studied' && !(p && isExam(p) && doneChoicesOf(p).length)) continue
    const again = o.key === 'studied' && p && currentDoneKey(p) !== 'none'
    out.push({ key: o.key, label: again ? o.again : o.label, sub: o.sub })
  }
  return out
})
// 고른 단계로 했을 때 — 고른 속도에서 시험까지 되는지
const donePreview = computed<ExamSlot | null>(() => {
  const p = sheetProject.value
  const c = doneChoices.value.find((x) => x.key === sheetPick.value)
  if (!p || !c || sheet.value?.kind !== 'done') return null
  const list = draftPlan.projects.map((q) => (q.id === p.id ? skipDonePhases(q, c.done) : q))
  const L = withRoutineLoad(list, draftPlan.routines)
  const h = hoursOf(selectedKey.value)
  return schedulePreview(L.projects, budgetHours(h, L.freeMin), schedOpts.value, examCtx.value).exams.find((x) => x.id === p.id) ?? null
})
function confirmSheet() {
  const s = sheet.value; const choice = sheetPick.value
  if (!s || !choice) return
  if (s.kind === 'done') {
    const c = doneChoices.value.find((x) => x.key === choice)
    const i = draftPlan.projects.findIndex((q) => q.id === s.id)
    if (c && i >= 0) draftPlan.projects.splice(i, 1, skipDonePhases(draftPlan.projects[i]!, c.done))
    sheet.value = null
    return
  }
  sheet.value = null
  if (choice.startsWith('pace:')) pick(choice.slice(5))
  else if (choice === 'studied') openDone(s.id)
  else if (choice === 'other') {
    // 다른 날짜 — 지금 날짜를 비우고 그 칸을 연다(모르면 비워 둔다)
    setExamDate(s.id, '')
    nextTick(() => { const el = document.getElementById(`exam-date-${s.id}`) as HTMLInputElement | null; try { el?.showPicker?.() } catch { el?.focus() } })
  }
}

// 큰 시험의 합격자 수치(첫 시험) · 속도와 상관없는 과정 기간
const examHead = computed(() => draftPlan.projects.find((p) => p.examStat)?.examStat?.headline ?? '')
const periodWeeksTotal = computed(() => draftPlan.projects
  .filter((p) => (p.period || p.course) && !p.during)
  .reduce((n, p) => n + projectWeeks(p), 0))
// '과정 약 4년' + '은' / '과정 11주' + '는'
const josaEun = (s: string) => { const c = s.charCodeAt(s.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 === 0 ? '는' : '은' }

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
  // 큰 시험은 이 속도로 기간·요일·1회 시간을 다시 잡아 계획에 넣는다(타임라인 슬롯도 이 복사본을 든다)
  // 시험일이 있는 걸음은 마지막 주 할 일 '응시'를 빼고 시험 날 표시로 옮긴다(정할 것 5)
  const paced = pacedProjects(draftPlan.projects, hours).map((p) => (examDateOf(p) ? withoutApplyItem(p) : p))
  draftPlan.projects.splice(0, draftPlan.projects.length, ...paced)
  const L = withRoutineLoad(draftPlan.projects, draftPlan.routines)
  draftTimeline.value = stripLoad(buildTimeline(L.projects, budgetHours(hours, L.freeMin), schedOpts.value, examCtx.value), draftPlan.projects)
  draftPlan.timelineManual = false
  router.push(nextPath('pace'))
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
  // 큰 시험·과정 한 줄(2026-11-17)
  &__facts { display: flex; flex-direction: column; gap: 4px; padding: 12px 14px; border-radius: 12px; background: #FFFBEA; }
  &__stat { font-size: 14px; font-weight: 700; color: #3A3200; word-break: keep-all; }
  &__fact { font-size: 12.5px; color: #7A6A3A; word-break: keep-all; }
  // 시험 날짜(2026-11-22)
  &__dates { background: #fff; border-radius: 16px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
  &__dates-title { margin: 0; font-size: 14px; font-weight: 700; color: #222; }
  &__date-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-top: 8px; border-top: 1px solid #f2f2f2; }
  &__dates-title + &__date-row { border-top: 0; padding-top: 0; }
  &__date-name { flex: 1 1 150px; min-width: 0; display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #333; word-break: keep-all; }
  &__date-sw { width: 5px; height: 18px; border-radius: 3px; background: #1DB95A; flex-shrink: 0; }
  &__date-val { position: relative; flex-shrink: 0; padding: 7px 10px; border: 1.5px solid #eee; border-radius: 10px; font-size: 13px; font-weight: 700; color: #222; white-space: nowrap; cursor: pointer;
    &--empty { color: #999; font-weight: 600; } }
  &__date-input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; border: 0; padding: 0; }
  &__date-done { flex-basis: 100%; text-align: left; padding: 0 0 0 11px; border: 0; background: none; font-size: 12px; color: #666; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
  &__date-warn { font-size: 12px; color: #B54708; word-break: keep-all; }
  &__date-hint { font-size: 11.5px; color: #999; word-break: keep-all; }
  &__facts--exam { background: #FFF4E5; }
  &__facts--ahead { background: #E4F8EC; .cd-pace__stat { color: #13843F; } .cd-pace__fact { color: #4C7A5C; } }
  &__choose { align-self: flex-start; margin-top: 2px; padding: 0; border: 0; background: none; font-size: 13px; font-weight: 700; color: #222; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
  &__fit { align-self: flex-start; padding: 2px 8px; border-radius: 999px; font-size: 11.5px; font-weight: 700; word-break: keep-all;
    &--ahead { background: #E4F8EC; color: #13843F; }
    &--tight { background: #FFF4E5; color: #B54708; } }
  &__exam-fit { font-weight: 700; color: #222;
    &--short, &--tight { color: #B54708; } }
  &__dim { position: fixed; inset: 0; z-index: 50; background: rgba(0, 0, 0, 0.32); display: flex; align-items: flex-end; justify-content: center; }
  &__sheet { width: 100%; max-width: 480px; max-height: 88vh; overflow-y: auto; background: #fff; border-radius: 20px 20px 0 0; padding: 20px 16px max(20px, env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 10px; }
  &__sheet-title { margin: 0 0 2px; font-size: 18px; font-weight: 800; color: #222; line-height: 1.35; word-break: keep-all; }
  &__opts { display: flex; flex-direction: column; gap: 8px; }
  &__opt { display: grid; grid-template-columns: 18px 1fr; gap: 2px 10px; align-items: start; padding: 12px 14px; border: 1.5px solid #eee; border-radius: 14px; background: #fff; text-align: left; font: inherit; color: #222; cursor: pointer;
    i { width: 16px; height: 16px; border-radius: 50%; border: 1.5px solid #bbb; margin-top: 2px; box-sizing: border-box; }
    b { font-size: 14px; font-weight: 700; word-break: keep-all; }
    small { grid-column: 2; font-size: 12px; color: #888; line-height: 1.45; word-break: keep-all; }
    &--on { border-color: #1A1A1A; background: #FFF9D6; i { border: 5px solid #1A1A1A; } }
    &:focus-visible { outline: 2px solid #4480F5; outline-offset: 2px; } }
  &__result-box { padding: 10px 12px; border-radius: 12px; font-size: 13px; line-height: 1.5; word-break: keep-all;
    &--ahead { background: #E4F8EC; color: #13843F; }
    &--tight, &--short { background: #FFF4E5; color: #B54708; } }
  &__sheet-note { font-size: 12px; color: #999; word-break: keep-all; }
  &__sheet-cta { margin-top: 4px; padding: 15px; border: 0; border-radius: 14px; background: #1A1A1A; color: #fff; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer;
    &:disabled { opacity: 0.35; cursor: default; } }
  &__exam {
    display: flex; flex-direction: column; gap: 4px;
    padding: 10px 12px; border-radius: 10px; background: #F7F7F2;
    font-size: 13px; line-height: 1.5; color: #444; word-break: keep-all;
  }
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
  &__preset { align-self: flex-start; margin-top: 4px; padding: 2px 8px; border-radius: 999px; background: #FFF1B8; color: #7A5C00; font-size: 11px; font-weight: 600; }
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

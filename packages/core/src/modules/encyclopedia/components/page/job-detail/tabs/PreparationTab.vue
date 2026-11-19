<template>
  <div :class="['prep-tab', { 'g-locked': locked }]" @click="onLockedClick">
    <!-- 맨 위(카드 밖) — 이 직업은 무엇으로 들어가는가. 2026-11-15 사용자: 친근한 말투로, 카드 밖 맨 위에 -->
    <p v-if="prep && steps.length" class="prep-lead">{{ prep.plan.summary }}</p>

    <section class="prep-section">
      <div v-if="isLoading" class="prep-empty">준비과정을 불러오는 중이에요…</div>
      <div v-else-if="error" class="prep-empty prep-empty--error">
        {{ error }}
        <button type="button" class="prep-retry" @click="load">다시 시도</button>
      </div>
      <div v-else-if="!prep || !steps.length" class="prep-empty">
        아직 준비과정이 등록되지 않았습니다.
      </div>

      <template v-else>
        <!-- 꼭 거쳐야 하는 것 · 함께 쓰는 계획 안내 · 법령 대조 -->
        <div v-if="prep.shared || prep.plan.gate || prep.plan.checked || prep.plan.caution || prep.plan.reality || prep.plan.eligibility || degreeRoutes" class="prep-intro">
          <p v-if="prep.shared" class="prep-intro__shared">
            준비하는 길이 비슷한 <strong>{{ prep.plan.displayName }}</strong>의 계획을 함께 보여드려요.
          </p>
          <!-- 먼저 알아 둘 것(2026-11-16) — 경력을 쌓은 뒤에 가는 직업·대부분 일찍 시작하는 길. 계획을 읽기 전에 알아야 해서 맨 앞에 둔다 -->
          <div v-if="prep.plan.reality" class="prep-gate prep-gate--reality">
            <span class="prep-gate__label">{{ prep.plan.reality.kind === 'career' ? '경력을 쌓은 뒤에 가는 직업이에요' : '대부분 일찍 시작하는 길이에요' }}</span>
            <p class="prep-gate__text">{{ prep.plan.reality.text }}</p>
            <div v-if="prep.plan.reality.via.length" class="prep-via">
              <span class="prep-via__label">먼저 거치는 직업</span>
              <RouterLink
                v-for="v in prep.plan.reality.via"
                :key="v.jobCode"
                class="prep-via__link"
                :to="`/career-encyclopedia/job/${v.jobCode}`"
              >{{ v.name }}<AppIcon name="ui-chevron-right" :size="12" /></RouterLink>
            </div>
          </div>
          <div v-if="prep.plan.gate" class="prep-gate">
            <span class="prep-gate__label">꼭 거쳐야 하는 것</span>
            <p class="prep-gate__text">{{ prep.plan.gate }}</p>
          </div>
          <!-- 지원 자격(2026-11-16) — 나이·신체·결격. 1년을 준비한 뒤에 자격이 안 된다는 것을 알게 되면 안 된다 -->
          <div v-if="prep.plan.eligibility" class="prep-gate prep-gate--elig">
            <span class="prep-gate__label">지원 자격을 먼저 확인해요</span>
            <ul class="prep-elig">
              <li v-for="(line, li) in prep.plan.eligibility.lines" :key="li"><span class="list-dot" />{{ line }}</li>
            </ul>
            <PreparationNotes :checked="prep.plan.eligibility.checked" />
          </div>
          <!-- 학위를 따는 다른 길(2026-11-19 오너 결정 C) — 학점은행·편입 같은 길로 이 면허·자격이 되는지. 모두에게 같게 보인다.
               안 되는 길도 보여 헛걸음을 막는다. 돼요·안 돼요·조건 있어요는 글자로 적는다(색에만 뜻을 싣지 않는다). 걸음·기간과 상관없다 -->
          <div v-if="degreeRoutes" class="prep-gate prep-gate--elig">
            <span class="prep-gate__label">학위를 따는 다른 길</span>
            <ul class="prep-elig">
              <li v-for="(line, li) in degreeRoutes.lines" :key="li">
                <span class="list-dot" />
                <span class="prep-route">
                  <span class="prep-route__head">
                    <strong>{{ routeNames(line.routes) }}</strong>
                    <span :class="['prep-tag', line.ok === 'yes' ? 'prep-tag--track' : 'prep-tag--plain']">{{ ROUTE_OK_LABEL[line.ok] }}</span>
                  </span>
                  {{ line.text }}
                </span>
              </li>
              <li v-if="degreeRoutes.common"><span class="list-dot" />{{ degreeRoutes.common }}</li>
            </ul>
            <ul v-if="routeFacts.length" class="prep-route-facts" aria-label="기간과 비용">
              <li v-for="r in routeFacts" :key="r.id">
                <strong>{{ r.name }}</strong><template v-if="r.gives"> · {{ r.gives }}</template>
                <span v-if="r.time" class="prep-route-facts__line">{{ r.time }}</span>
                <span v-if="r.cost" class="prep-route-facts__line">{{ r.cost }}</span>
              </li>
            </ul>
            <PreparationNotes :checked="degreeRoutes.checked" />
            <p class="prep-route-foot">라이트하우스가 정리한 내용이에요 · 검토 전</p>
          </div>
          <PreparationNotes :checked="prep.plan.checked" :caution="prep.plan.caution" />
        </div>

        <!-- 갈래 — 준비하는 길이 실제로 갈리는 직업만. 안내 글 없이 고르는 단추만 둔다(2026-11-15 사용자: 분류만 있어도 무슨 뜻인지 안다) -->
        <div v-if="prep.tracks.length > 1" class="prep-tracks">
          <div class="prep-tracks__chips" role="group" aria-label="준비하는 갈래">
            <button
              v-for="t in prep.tracks"
              :key="t.id"
              type="button"
              :class="['prep-chip', { 'is-on': t.id === track }]"
              :aria-pressed="t.id === track"
              @click="track = t.id"
            >{{ t.name }}</button>
          </div>
          <p v-if="trackInfo?.desc" class="prep-tracks__desc">{{ trackInfo.desc }}</p>
        </div>

        <!-- 분량 — 두 칸(2026-11-17, 정할 것 2·3 시안 화면 1): 스스로 준비(낼 수 있는 시간에 따라) · 과정(다니는 기간 — 속도와 상관없음).
             합친 기간은 적지 않는다(끝나는 때는 진로설계의 속도 고르기에서 날짜로 본다). 계산은 앱이 한다(sumParts — 서버 totals 와 같은 규칙) -->
        <div v-if="path" class="prep-total">
          <div class="prep-cells">
            <div :class="['prep-cell', { 'prep-cell--wide': cellsWide }]">
              <span class="prep-cell__label">스스로 준비</span>
              <template v-if="parts.examHours">
                <span class="prep-cell__value prep-cell__value--two">
                  <span>시험을 하루 8시간 공부하면 <strong>{{ formatWeeks(parts.selfWeeks) }}</strong></span>
                  <span>하루 3시간이면 <strong>{{ formatWeeks(parts.selfWeeksPart) }}</strong></span>
                </span>
              </template>
              <strong v-else class="prep-cell__value">{{ formatWeeks(parts.selfWeeks) }}</strong>
              <span class="prep-cell__sub">프로젝트 {{ parts.selfCount }}개</span>
            </div>
            <div v-if="parts.periodWeeks" :class="['prep-cell', 'prep-cell--period', { 'prep-cell--wide': cellsWide }]">
              <span class="prep-cell__label">과정</span>
              <strong class="prep-cell__value">{{ formatWeeks(parts.periodWeeks) }}</strong>
              <span class="prep-cell__sub">{{ periodSub }}</span>
            </div>
          </div>
          <p v-if="majorSkip" class="prep-total__line">
            관련 학과 전공자는 스스로 준비 {{ formatWeeks(partsMajor.selfWeeks) }}<template v-if="partsMajor.periodWeeks"> · 과정 {{ formatWeeks(partsMajor.periodWeeks) }}</template>
          </p>
          <p v-if="path.totals.optional" class="prep-total__line">
            지원하는 곳에 따라 고르는 것 {{ path.totals.optional }}개는 따로예요
          </p>
          <ul class="prep-legend" aria-label="영역별 개수">
            <li v-for="c in categoryCounts" :key="c.category" class="prep-legend__item">
              <i class="prep-legend__dot" :style="{ background: c.color }" />{{ c.label }} {{ c.count }}
            </li>
          </ul>
        </div>

        <!-- 순서대로 -->
        <div v-if="locked && steps.length > 1" class="g-head">
          <span class="prep-steps-label">준비 순서 {{ steps.length }}걸음</span>
          <span class="g-pill"><AppIcon name="ui-privacy" :size="12" />가입 후</span>
        </div>
        <ol :class="['prep-steps', { 'g-clip': locked }]">
          <li
            v-for="(s, si) in steps"
            :key="s.key"
            :class="['prep-step', {
              'prep-step--optional': s.item.optional,
              'prep-step--open': isOpen(s),
              'g-veil': locked && si > 0,
            }]"
          >
            <button type="button" class="prep-step__head" :aria-expanded="isOpen(s)" @click="toggle(s)">
              <span
                class="prep-step__no"
                :style="{ color: colorOf(s.project.category), background: tintOf(s.project.category) }"
              >{{ s.no }}</span>
              <span class="prep-step__main">
                <span class="prep-step__top">
                  <span class="prep-step__tags">
                    <span
                      class="prep-tag"
                      :style="{ color: colorOf(s.project.category), background: tintOf(s.project.category) }"
                    >{{ labelOf(s.project.category) }}</span>
                    <span v-if="s.item.optional" class="prep-tag prep-tag--plain">선택</span>
                    <span v-if="!s.item.major" class="prep-tag prep-tag--plain">전공자는 생략</span>
                    <!-- 프로젝트 종류 '과정'(2026-11-16) — 정해진 곳에 다니는 기간. 진도(기본)는 꼬리표 없음 -->
                    <PeriodTag v-if="s.project.period" />
                    <span v-else-if="s.project.course" class="prep-tag prep-tag--plain">정해진 과정</span>
                    <span v-if="s.item.during" class="prep-tag prep-tag--plain">과정 중에</span>
                    <span v-if="s.project.mayHave" class="prep-tag prep-tag--plain">이미 있으면 생략</span>
                    <!-- 갈래 표시는 고를 갈래가 여럿일 때만 — 하나뿐이면(판사 화면의 '판사') 군더더기다 -->
                    <span v-if="s.item.fromTrack && trackInfo && prep.tracks.length > 1" class="prep-tag prep-tag--track">{{ trackInfo.name }}</span>
                  </span>
                  <span class="prep-step__weeks">
                    {{ formatWeeks(s.project.weeks) }}<template v-if="s.project.studyHours">~</template>
                    <AppIcon name="ui-chevron-down" :class="['chevron-toggle', { 'chevron-toggle--open': isOpen(s) }]" />
                  </span>
                </span>
                <span class="prep-step__name">{{ s.project.name }}</span>
                <span class="prep-step__goal">{{ s.project.goal }}</span>
                <span v-if="s.item.note" class="prep-step__note">{{ s.item.note }}</span>
                <!-- 큰 시험(2026-11-17, 시안 화면 3) — 분량은 '첫 시험까지(빠른 경우)'로 잡은 가정, 기간은 하루 공부 시간에 따라 두 줄 -->
                <span v-if="s.project.studyHours" class="prep-exam">
                  <span class="prep-exam__amount">첫 시험까지(빠른 경우)로 잡은 분량 · {{ formatStudyHours(s.project.studyHours) }}</span>
                  <!-- 분량이 무엇인지 바로 아래에(검토 11-17 C3b) — '약' 없이 -->
                  <span class="prep-exam__note">전업(하루 8시간·주 6일) {{ fullTimeOf(s.project.studyHours) }}{{ josaRo(fullTimeOf(s.project.studyHours)) }} 잡은 양이에요(잰 값이 아니에요)</span>
                  <span v-if="s.item.alongside && alongsideName(s.item.alongside)" class="prep-exam__mate">{{ alongsideName(s.item.alongside) }}과 나란히 공부해요</span>
                  <span class="prep-exam__row"><span>전업 · 하루 8시간</span><strong>{{ formatWeeks(s.project.studyHours / FULL_TIME_HOURS) }}</strong></span>
                  <span class="prep-exam__row"><span>일·학업과 함께 · 하루 3시간</span><strong>{{ formatWeeks(s.project.studyHours / PART_TIME_HOURS) }}</strong></span>
                  <!-- 합격자 수치 — 7급(나란히 대상)은 평균 요약만(오너 결정 8 '평균·출처만'), 출처는 펼친 본문에 -->
                  <template v-if="statOf(s)">
                    <span class="prep-exam__stat">{{ isMateTarget(s) ? meanHeadline(statOf(s)!) : statOf(s)!.headline }}</span>
                    <span v-if="statOf(s)!.detail && !isMateTarget(s)" class="prep-exam__detail">{{ statOf(s)!.detail }}</span>
                  </template>
                </span>
                <span class="prep-step__meta">
                  <template v-if="methodLabel(s.project.method)">
                    <AppIcon :name="methodIcon(s.project.method)" :size="13" />
                    {{ methodLabel(s.project.method) }} ·
                  </template>
                  주 {{ s.project.daysPerWeek }}일<template v-if="!s.project.studyHours"> · {{ formatMinutes(s.project.minutesPerSession) }}</template>
                </span>
              </span>
            </button>

            <div v-if="isOpen(s)" class="prep-step__body">
              <p v-if="!s.item.major && s.item.skip" class="prep-step__skip">
                <strong>관련 학과 전공자는 건너뛰어요</strong>{{ s.item.skip }}
              </p>
              <p v-if="s.item.during" class="prep-step__skip">
                <strong>학교·수련 과정을 다니면서 해요</strong>기간은 앞의 과정 걸음에 들어 있어 따로 더하지 않았어요
              </p>
              <p v-if="s.project.mayHave" class="prep-step__skip">
                <strong>이미 있으면 건너뛰어요</strong>면허·성적을 이미 가지고 있다면 이 걸음은 넘어가도 돼요
              </p>
              <ol class="prep-phases">
                <li v-for="(ph, pi) in s.project.phases" :key="pi" class="prep-phase">
                  <p class="prep-phase__title">
                    {{ ph.title }}
                    <span class="prep-phase__weeks">{{ formatWeeks(ph.weeks) }}</span>
                  </p>
                  <ul class="prep-phase__items">
                    <li v-for="(x, xi) in ph.items" :key="xi"><span class="list-dot" />{{ x }}</li>
                  </ul>
                </li>
              </ol>
              <div v-if="s.project.options?.length" class="prep-options">
                <p class="prep-options__label">목표는 이렇게 나뉘어요</p>
                <ul class="prep-options__list">
                  <li v-for="(o, oi) in s.project.options" :key="oi">{{ o }}</li>
                </ul>
              </div>
              <p class="prep-step__facts">
                <span>{{ s.project.level }}</span>
                <span v-if="kindOf(s.project)">{{ kindOf(s.project) }}</span>
                <span v-if="s.project.basis === 'law'">법령이 정한 요건</span>
                <span v-if="s.project.note">{{ s.project.note }}</span>
              </p>
              <PreparationNotes :checked="s.project.checked" :caution="s.project.caution" />
              <!-- 합격자 수치의 출처(검토 11-17 C7) — 기사 제목은 그리지 않는다 -->
              <p v-for="(line, li) in sourceLinesOf(s)" :key="`src${li}`" class="prep-exam__source">{{ line }}</p>
            </div>
          </li>
        </ol>

        <!-- 맨 밑 — '예시' 표시와 안내. 2026-11-15 사용자 결정으로 머리말에서 프로젝트 아래로 옮겼다(표시 자체는 남긴다) -->
        <div class="prep-about">
          <h3 class="prep-section__title">
            준비과정
            <span class="prep-section__badge">예시</span>
          </h3>
          <p class="prep-section__desc">
            라이트하우스가 직업 정보와 법령·공식 자격 기준을 바탕으로 정리한 <strong>예시</strong> 계획이에요.
            현직자 검토 전이라 실제 경로는 사람마다 다를 수 있어요.
          </p>
          <p class="prep-section__desc">
            스스로 준비 기간은 하나씩 차례로 할 때를 더한 값이에요. 여러 개를 함께 하면 더 짧아져요.
            <template v-if="parts.duringCount">과정을 다니면서 하는 걸음은 과정 기간에 들어 있어 따로 더하지 않았어요.</template>
            <template v-if="parts.examHours">큰 시험은 하루 공부 시간에 따라 기간이 달라져요.</template>
            시험·채용 조건은 공고로 다시 확인해 주세요.
          </p>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 진로백과 준비과정 탭 — 이 직업의 예시 진로설계를 순서대로 보여 준다.
 *
 * 자료: 진로계획 라이브러리(GET /api/job/:jobCode/preparation, 2026-11-15~). 직업 537개 전부에 계획이 있다.
 *   라이트하우스가 직업 정보·법령·공식 자격 기준으로 정리한 **예시**이고 현직자 검토 전이다.
 *
 * ⚠️ '예시' 표시를 떼지 말 것(자리는 2026-11-15 사용자 결정으로 맨 밑). 2026-09-28 이전에는 "현직자들의 준비과정"이라는
 *    제목에 실명 기관이 붙어 있어 사용자가 실제 사례로 믿을 수 있었다. 실제 직업인의 과정(랜딩 /career-path 제출)을
 *    붙이게 되면 예시와 실제 사례를 섞지 말고 구역을 나눠 표시를 따로 단다.
 * 맨 위 문구(plan.summary)와 '꼭 거쳐야 하는 것'(plan.gate)은 자료에서 해요체로 온다 — 화면에서 말투를 바꾸지 않는다.
 * ⚠️ 서버가 주는 순서(paths[].items)를 그대로 그린다 — 여기서 다시 정렬하지 않는다.
 */
import { computed, onMounted, ref, watch } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import PreparationNotes from './PreparationNotes.vue'
import PeriodTag from '@/modules/career-design/components/PeriodTag.vue'
import { fetchJobPreparation } from '../../../../encyclopedia.api'
import { FULL_TIME_HOURS, PART_TIME_HOURS, formatFullTime, formatMinutes, formatStudyHours, formatWeeks, hasMajorSkip, josaRo, pathOf, statSourceLine, stepsOf, sumParts, type PrepStep } from '../../../../lib/preparation'
import { meanHeadline } from '@/modules/career-design/lib/examPace'
import type { JobPreparation, PrepDegreeRoute, PrepProject, PrepRouteOk } from '../../../../types/encyclopedia'
import type { ProjectCategory } from '@/modules/career-design/types/career-design'
import { methodDef, methodIcon, type ProjectMethod } from '@/modules/career-design/composables/projectMethods'
import { CATEGORY_META } from '@/modules/career-achievement/lib/planBoard'

const props = defineProps<{ jobCode: string; locked?: boolean }>()
const emit = defineEmits<{ (e: 'unlock'): void }>()

// 비회원(2026-11-11): 흐린 곳을 누르면 페이지가 맨 아래 안내 카드로 내린다(또렷한 링크·버튼은 제 할 일을 하게 둔다)
function onLockedClick(e: MouseEvent) {
  if (props.locked && !(e.target as HTMLElement).closest('button, a')) emit('unlock')
}

const prep = ref<JobPreparation | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const track = ref<string | null>(null)
const opened = ref<Set<string>>(new Set())

let loadSeq = 0
async function load() {
  const seq = ++loadSeq
  isLoading.value = true
  error.value = null
  try {
    const { data } = await fetchJobPreparation(props.jobCode)
    if (seq !== loadSeq) return          // 그사이 다른 직업으로 넘어갔다
    prep.value = data.data
    track.value = data.data?.defaultTrack ?? null
    opened.value = new Set()
  } catch {
    if (seq !== loadSeq) return
    prep.value = null
    error.value = '준비과정을 불러오지 못했어요.'
  } finally {
    if (seq === loadSeq) isLoading.value = false
  }
}
onMounted(load)
watch(() => props.jobCode, load)

const path = computed(() => (prep.value ? pathOf(prep.value, track.value) : null))
const steps = computed<PrepStep[]>(() => (prep.value ? stepsOf(prep.value, path.value) : []))
const trackInfo = computed(() => prep.value?.tracks.find((t) => t.id === path.value?.track) ?? null)
const majorSkip = computed(() => hasMajorSkip(path.value))

// 두 칸(2026-11-17) — 옛 서버(새 칸 없음)에서도 같은 값이 나오게 앱이 센다
const rows = computed(() => steps.value.map((s) => ({ item: s.item, project: s.project })))
const parts = computed(() => sumParts(rows.value))
const partsMajor = computed(() => sumParts(rows.value, (r) => r.item.major))
// 칸 하나뿐이거나 큰 시험(두 줄)이 있으면 칸마다 한 줄 전체 — 폰에서 두 줄 문장이 좁게 접히지 않게
const cellsWide = computed(() => !!parts.value.examHours || !parts.value.periodWeeks)
// 과정 칸의 아랫줄 — 과정이 하나면 그 이름, 여럿이면 개수. 과정 안에서 하는 걸음이 있으면 함께
const periodSub = computed(() => {
  const list = steps.value.filter((s) => !s.item.optional && (s.project.course || (s.project.period && !s.item.during)))
  const head = list.length === 1 ? list[0]!.project.name : `과정 ${parts.value.periodCount}개`
  return parts.value.duringCount ? `${head} · 다니면서 하는 것 ${parts.value.duringCount}개` : head
})
// 큰 시험 — 합격자 수치(잰 걸음에만 온다)와 나란히 대상 이름
// 학위를 따는 다른 길(2026-11-19) — 옛 서버는 칸이 없다
const ROUTE_OK_LABEL: Record<PrepRouteOk, string> = { yes: '돼요', no: '안 돼요', if: '조건 있어요' }
const degreeRoutes = computed(() => prep.value?.plan.degreeRoutes ?? null)
const routeOf = (id: string): PrepDegreeRoute | null => prep.value?.degreeRouteItems?.[id] ?? null
const routeNames = (ids: string[]) => ids.map((id) => routeOf(id)?.name ?? id).join(' · ')
// 기간과 비용 — 되는 길·조건 있는 길만(안 되는 길의 비용은 보여 줄 까닭이 없다). 한 길은 한 번만
const routeFacts = computed(() => {
  const seen = new Set<string>()
  const out: PrepDegreeRoute[] = []
  for (const line of degreeRoutes.value?.lines ?? []) {
    if (line.ok === 'no') continue
    for (const id of line.routes) {
      const r = routeOf(id)
      if (!r || seen.has(id) || !(r.time || r.cost)) continue
      seen.add(id)
      out.push(r)
    }
  }
  return out
})

const statOf = (s: PrepStep) => (s.item.passStat ? prep.value?.passStats?.[s.item.passStat] ?? null : null)
const alongsideName = (ref: string) => prep.value?.projects[ref]?.name ?? ''
// 다른 걸음이 이 걸음과 나란히 하는가(7급 전문과목 — PSAT 이 붙는 대상)
const isMateTarget = (s: PrepStep) => steps.value.some((x) => x.item.alongside === s.item.ref)
// 전업 기준 분량 — '약' 없이(1년 · 1년 6개월 · 9개월)
const fullTimeOf = (h: number) => formatFullTime(h / FULL_TIME_HOURS)
// 출처 줄 — 그 수치와 함께 적은 다른 조사(alsoSources). 7급은 평균만 쓰므로 그 조사의 출처만
const sourceLinesOf = (s: PrepStep) => {
  const st = statOf(s)
  if (!st) return []
  return [statSourceLine(st.source), ...(isMateTarget(s) ? [] : (st.alsoSources ?? []).map(statSourceLine))].filter(Boolean)
}

// 영역별 개수 — 이 직업이 무엇 중심인지(자격·경험·포트폴리오…) 한 줄로 보이게
const CATEGORY_ORDER: ProjectCategory[] = ['qualification', 'knowledge', 'skill', 'portfolio', 'experience']
const categoryCounts = computed(() =>
  CATEGORY_ORDER
    .map((category) => ({
      category,
      label: CATEGORY_META[category].label,
      color: CATEGORY_META[category].color,
      count: steps.value.filter((s) => s.project.category === category).length,
    }))
    .filter((c) => c.count > 0),
)

const colorOf = (c: ProjectCategory) => CATEGORY_META[c]?.color ?? '#888888'
const tintOf = (c: ProjectCategory) => `${colorOf(c)}1A`     // 같은 색을 10%로 깐다
const labelOf = (c: ProjectCategory) => CATEGORY_META[c]?.label ?? ''
// '약 4년' + '이에요' / '약 13개월' + '이에요' / '8주' + '예요' — 받침에 맞춘다
const josaIeyo = (s: string) => { const c = s.charCodeAt(s.length - 1); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 === 0 ? '예요' : '이에요' }
// 진행 방식 — '기타'는 알려 주는 것이 없어 적지 않는다
const methodLabel = (m: ProjectMethod) => (m === 'etc' ? '' : methodDef(m)?.label ?? '')

// 어떤 자격·시험인지(국가기술자격·어학 성적·공무원 필기 …)는 자격·채용 절차 프로젝트에서만 적는다 — 나머지 유형은 영역 표시로 충분하다
const kindOf = (p: PrepProject) => (p.type === 'cert' || p.type === 'hiring' ? p.subtypeName : null)

// 펼침 — 갈래를 바꿔도 공통 항목은 열린 채로 둔다(열쇠가 프로젝트 id + 순서)
const isOpen = (s: PrepStep) => opened.value.has(s.key)
function toggle(s: PrepStep) {
  const next = new Set(opened.value)
  if (next.has(s.key)) next.delete(s.key)
  else next.add(s.key)
  opened.value = next
}
</script>

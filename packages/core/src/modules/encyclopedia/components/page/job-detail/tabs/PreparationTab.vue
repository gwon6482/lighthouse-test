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
        <div v-if="prep.shared || prep.plan.gate || prep.plan.checked || prep.plan.caution" class="prep-intro">
          <p v-if="prep.shared" class="prep-intro__shared">
            준비하는 길이 비슷한 <strong>{{ prep.plan.displayName }}</strong>의 계획을 함께 보여드려요.
          </p>
          <div v-if="prep.plan.gate" class="prep-gate">
            <span class="prep-gate__label">꼭 거쳐야 하는 것</span>
            <p class="prep-gate__text">{{ prep.plan.gate }}</p>
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

        <!-- 분량 -->
        <div v-if="path" class="prep-total">
          <!-- 두 덩어리로 묶어 둔다 — 기간이 길어지면('약 2년 2개월') '분량'만 다음 줄로 떨어지지 않게 -->
          <p class="prep-total__main">
            <span class="prep-total__part">프로젝트 <strong>{{ path.totals.nonMajor.count }}개</strong></span>
            <span class="prep-total__sep" aria-hidden="true" />
            <span class="prep-total__part">모두 <strong>{{ formatWeeks(path.totals.nonMajor.weeks) }}</strong> 분량</span>
          </p>
          <p v-if="majorSkip" class="prep-total__line">
            관련 학과 전공자는 {{ path.totals.major.count }}개 · {{ formatWeeks(path.totals.major.weeks) }}
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
                    <span v-if="s.item.fromTrack && trackInfo" class="prep-tag prep-tag--track">{{ trackInfo.name }}</span>
                  </span>
                  <span class="prep-step__weeks">
                    {{ formatWeeks(s.project.weeks) }}
                    <AppIcon name="ui-chevron-down" :class="['chevron-toggle', { 'chevron-toggle--open': isOpen(s) }]" />
                  </span>
                </span>
                <span class="prep-step__name">{{ s.project.name }}</span>
                <span class="prep-step__goal">{{ s.project.goal }}</span>
                <span v-if="s.item.note" class="prep-step__note">{{ s.item.note }}</span>
                <span class="prep-step__meta">
                  <template v-if="methodLabel(s.project.method)">
                    <AppIcon :name="methodIcon(s.project.method)" :size="13" />
                    {{ methodLabel(s.project.method) }} ·
                  </template>
                  주 {{ s.project.daysPerWeek }}일 · {{ formatMinutes(s.project.minutesPerSession) }}
                </span>
              </span>
            </button>

            <div v-if="isOpen(s)" class="prep-step__body">
              <p v-if="!s.item.major && s.item.skip" class="prep-step__skip">
                <strong>관련 학과 전공자는 건너뛰어요</strong>{{ s.item.skip }}
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
            기간은 하나씩 차례로 할 때를 더한 값이에요. 여러 개를 함께 하면 더 짧아져요.
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
import { fetchJobPreparation } from '../../../../encyclopedia.api'
import { formatMinutes, formatWeeks, hasMajorSkip, pathOf, stepsOf, type PrepStep } from '../../../../lib/preparation'
import type { JobPreparation, PrepProject } from '../../../../types/encyclopedia'
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

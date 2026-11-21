<template>
  <div class="cd-tpl">
    <CdYellowHeader
      title="진로계획 세우기"
      :subtitle="prep ? `${prep.displayName} 예시 계획에서 시작해요` : '라이트하우스가 미리 설계한 진로계획에서 시작해요'"
      back-to="/career-design/situation"
    />

    <div class="cd-tpl__body">

      <!-- 먼저 거치는 직업의 예시를 보는 중(2026-11-21 B-9) — 목표 진로는 그대로라는 띠. 돌아가면 목표 직업 자신의 계획 -->
      <div v-if="viaCode && basePrep" class="cd-tpl__goal">
        <strong class="cd-tpl__goal-title">목표 진로 · {{ targetTitle || basePrep.title }}</strong>
        <span class="cd-tpl__goal-text">먼저 {{ viaName }}{{ josaIGa(viaName) }} 되는 계획이에요.</span>
        <button type="button" class="cd-tpl__goal-back" @click="leaveVia">{{ basePrep.displayName }} 계획으로 돌아가기</button>
      </div>

      <p v-if="loading || viaLoading" class="cd-tpl__intro">예시 진로계획을 불러오는 중이에요…</p>
      <p v-else-if="viaCode && !prep" class="cd-tpl__intro">{{ viaName }} 예시 계획을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.</p>

      <template v-else-if="prep">
        <!-- 먼저 알아 둘 것(2026-11-21 B-9·11·13) — 바로 될 수 없는 직업. 진로백과 준비과정 탭과 같은 말.
             먼저 거치는 직업이 있으면(경력직 계획 6개) 그 직업의 예시 계획으로 가는 버튼 — 목표 진로는 바꾸지 않는다.
             판사(함께 덮는 직업의 한 줄)는 버튼 없이 본문만 -->
        <div v-if="!viaCode && careerReality" class="cd-tpl__reality">
          <span class="cd-tpl__reality-label">먼저 알아 둘 것</span>
          <strong v-if="realityHead(careerReality)" class="cd-tpl__reality-head">{{ realityHead(careerReality) }}</strong>
          <p class="cd-tpl__reality-text">{{ careerReality.text }}</p>
          <template v-if="gateway">
            <p class="cd-tpl__reality-sub">먼저 거치는 직업의 예시 계획으로 시작해요</p>
            <div class="cd-tpl__via">
              <button v-for="v in careerReality.via" :key="v.jobCode" type="button" class="cd-tpl__via-btn" @click="goVia(v.jobCode)">
                <span class="cd-tpl__via-name">{{ v.name }}</span>
                <span class="cd-tpl__via-go">예시 계획 보기 <AppIcon name="ui-chevron-right" /></span>
              </button>
            </div>
          </template>
        </div>

        <!-- 자료는 진로백과 준비과정 탭과 같다(진로계획 라이브러리) — 예시이고 현직자 검토 전이라는 것을 여기서도 알린다 -->
        <p class="cd-tpl__intro">
          진로백과의 {{ prep.displayName }} 준비과정 예시를 내 계획의 출발점으로 써요.
          <template v-if="prep.shared">준비하는 길이 비슷한 {{ prep.plan.displayName }}의 계획이에요.</template>
          직업 정보와 법령·공식 자격 기준으로 정리했고 현직자 검토 전이에요. 프로젝트는 시작한 뒤에 자유롭게 고칠 수 있어요.
        </p>

        <!-- 진입 관문 직업(전공·시험·면허 필수)이면 무엇을 중심에 둘지 먼저 보여준다(2026-10-27) -->
        <!-- '경력직' 안내 한 줄은 위 '먼저 알아 둘 것'과 뜻이 같아 뺀다(2026-11-21). 다른 배지 안내는 남긴다 -->
        <JobGateGuide :job-code="prep.jobCode" variant="plan" :hide="!viaCode && careerReality ? ['senior'] : []" class="cd-tpl__gate" />

        <!-- 목표 직업 자신의 계획은 지우지 않고 아래로 접어 둔다(2026-11-21 B-10, F-6 '계획은 남긴다') -->
        <p v-if="gateway" class="cd-tpl__divider">{{ basePrep!.displayName }}{{ josaIGa(basePrep!.displayName) }} 된 뒤의 계획</p>

        <!-- 내 진로상황(2026-11-16) — 맨 위 플랜이 무엇에 맞췄는지. 고치면 묻는 화면으로 돌아간다 -->
        <div v-if="situationOn" class="cd-tpl__situ">
          <span class="cd-tpl__situ-label">내 진로상황</span>
          <span class="cd-tpl__situ-text">{{ situationLine }}</span>
          <button type="button" class="cd-tpl__situ-edit" @click="router.push('/career-design/situation')">고치기</button>
        </div>
        <button v-else type="button" class="cd-tpl__situ-link" @click="router.push('/career-design/situation')">내 진로상황에 맞춰 보기 <AppIcon name="ui-chevron-right" /></button>

        <!-- 갈래 — 준비하는 길이 갈리는 직업만. 진로백과 준비과정 탭과 같은 말을 쓴다 -->
        <div v-if="prep.tracks.length > 1" class="cd-tpl__tracks">
          <div class="cd-tpl__tracks-chips" role="group" aria-label="준비하는 갈래">
            <button
              v-for="tr in prep.tracks"
              :key="tr.id"
              type="button"
              :class="['cd-tpl__chip', { 'is-on': tr.id === track }]"
              :aria-pressed="tr.id === track"
              @click="track = tr.id"
            >{{ tr.name }}</button>
          </div>
          <p v-if="trackInfo?.desc" class="cd-tpl__tracks-desc">{{ trackInfo.desc }}</p>
        </div>
      </template>

      <template v-for="(t, ti) in shownTemplates" :key="t.id">
      <!-- 내 상황 플랜 아래의 처음부터 전부(비전공·전공 플랜) -->
      <p v-if="situationOn && ti === 1" class="cd-tpl__divider">처음부터 전부 보기</p>
      <article
        class="cd-tpl__card"
        :class="{ 'cd-tpl__card--open': isOpen(t) }"
      >
        <button type="button" class="cd-tpl__card-head" :aria-expanded="isOpen(t)" @click="toggle(t)">
          <span class="cd-tpl__badge-row">
            <span class="cd-tpl__badge" :class="`cd-tpl__badge--${t.stage}`">{{ t.stageLabel }}</span>
            <span class="cd-tpl__who">{{ t.who }}</span>
          </span>
          <span class="cd-tpl__name">{{ t.name }}</span>
          <!-- 기간은 진로백과 준비과정 탭과 같은 두 칸(2026-11-17, 정할 것 2·3 시안 화면 2) — 스스로 준비 · 과정. 큰 시험이 있으면 스스로 준비를 두 끝(하루 8시간 ~ 3시간)으로 -->
          <span class="cd-tpl__meta">{{ durationLine(t) }} · 프로젝트 {{ t.projects.length }}개</span>
          <span class="cd-tpl__cats">
            <span
              v-for="c in CATS"
              :key="c.value"
              class="cd-tpl__cat"
              :style="{ background: COLORS[c.value].bg, color: COLORS[c.value].text }"
            >{{ c.label }} {{ countOf(t, c.value) }}</span>
          </span>
          <span class="cd-tpl__toggle">{{ isOpen(t) ? '접기' : '구성 보기' }} <AppIcon name="ui-chevron-down" class="chevron-toggle" :class="{ 'chevron-toggle--open': isOpen(t) }" /></span>
        </button>

        <div v-if="isOpen(t)" class="cd-tpl__detail">
          <p v-if="t.note" class="cd-tpl__note">ⓘ {{ t.note }}</p>
          <!-- 내 상황이라 뺀 것·줄인 것 — 이유와 함께(2026-11-16) -->
          <div v-if="t.changes?.length" class="cd-tpl__changed">
            <p class="cd-tpl__changed-title">내 상황이라 바뀐 것</p>
            <p v-for="(c, ci) in groupChanges(t)" :key="ci" class="cd-tpl__changed-row">
              <i>{{ c.kind === 'cut' ? '뺌' : '줄임' }}</i>
              <span>{{ c.label }}<small>{{ c.reason }}</small></span>
            </p>
          </div>
          <!-- 과정이 든 플랜 — 다니면서 하는 프로젝트를 어떻게 놓는지(기간은 위 줄의 '과정' 칸과 겹쳐 지웠다, 2026-11-17 시안 화면 2) -->
          <p v-if="t.projects.some((p) => p.during)" class="cd-tpl__course">
            다니면서 하는 프로젝트는 과정이 끝나는 때에 맞춰 겹쳐 놓아요.
          </p>
          <!-- 해 나갈 순서대로 -->
          <ol class="cd-tpl__projects">
            <li v-for="(p, i) in t.projects" :key="p.id" class="cd-tpl__project">
              <span class="cd-tpl__project-no">{{ i + 1 }}</span>
              <span class="cd-tpl__project-main">
                <span class="cd-tpl__project-top">
                  <span class="cd-tpl__project-cat" :style="{ background: COLORS[p.category].bg, color: COLORS[p.category].text }">{{ LABEL[p.category] }}</span>
                  <!-- 프로젝트 종류 '과정'(2026-11-16) — 진도(기본)는 꼬리표 없음 -->
                  <PeriodTag v-if="p.period" />
                  <span v-else-if="p.course" class="cd-tpl__project-tag">정해진 과정</span>
                  <span v-if="p.during" class="cd-tpl__project-tag">과정 중에</span>
                  <span class="cd-tpl__project-meta">{{ formatWeeks(p.curriculum?.length ?? 0) }} · 주 {{ p.days.length }}회 {{ p.duration }}분</span>
                </span>
                <span class="cd-tpl__project-name">{{ p.name }}</span>
                <!-- '기타'는 알려 주는 것이 없어 적지 않는다(준비과정 탭과 같게) -->
                <span v-if="p.method !== 'etc' && methodLine(p.method, p.methodDetail)" class="cd-tpl__project-method"><AppIcon :name="methodIcon(p.method)" /> {{ methodLine(p.method, p.methodDetail) }}</span>
              </span>
              <!-- 운전면허·어학 성적처럼 이미 가지고 있을 수 있는 것 — 누르면 플랜과 기간에서 빠진다 -->
              <button v-if="t.skipRefs[p.id]" type="button" class="cd-tpl__have" @click="setHave(t.skipRefs[p.id]!, true)">이미 있어요</button>
            </li>
          </ol>

          <!-- 이미 있어서 뺀 것 — 잘못 눌렀으면 다시 넣는다 -->
          <div v-if="t.skipped.length" class="cd-tpl__dropped">
            <p class="cd-tpl__dropped-toggle cd-tpl__dropped-toggle--static">이미 있어서 뺀 것 {{ t.skipped.length }}개</p>
            <ul class="cd-tpl__dropped-list">
              <li v-for="s in t.skipped" :key="`${s.key}|${s.label}`" class="cd-tpl__dropped-item cd-tpl__dropped-item--row">
                <span class="cd-tpl__dropped-name">{{ s.name }}</span>
                <button type="button" class="cd-tpl__have cd-tpl__have--undo" @click="setHave(s, false)">다시 넣기</button>
              </li>
            </ul>
          </div>

          <!-- 앞 단계에서 뺀 것 — 왜 짧아졌는지 -->
          <div v-if="t.dropped.length" class="cd-tpl__dropped">
            <button type="button" class="cd-tpl__dropped-toggle" @click="toggleDropped(t.id)">
              <AppIcon name="ui-chevron-right" class="chevron-toggle chevron-toggle--side" :class="{ 'chevron-toggle--open': droppedOpen[t.id] }" /> 전공자라서 뺀 것 {{ t.dropped.length }}개
            </button>
            <ul v-if="droppedOpen[t.id]" class="cd-tpl__dropped-list">
              <li v-for="d in t.dropped" :key="d.name" class="cd-tpl__dropped-item">
                <span class="cd-tpl__dropped-name">{{ d.name }}</span>
                <span class="cd-tpl__dropped-reason">{{ d.reason }}</span>
              </li>
            </ul>
          </div>

          <!-- 지원하는 곳에 따라 고르는 것 — 플랜에는 넣지 않았다. 다음 화면(프로젝트 구성)의 도우미 추천에서 담는다 -->
          <div v-if="t.optional.length" class="cd-tpl__dropped">
            <button type="button" class="cd-tpl__dropped-toggle" @click="toggleOptional(t.id)">
              <AppIcon name="ui-chevron-right" class="chevron-toggle chevron-toggle--side" :class="{ 'chevron-toggle--open': optionalOpen[t.id] }" /> 지원하는 곳에 따라 더하는 것 {{ t.optional.length }}개
            </button>
            <ul v-if="optionalOpen[t.id]" class="cd-tpl__dropped-list">
              <li v-for="d in t.optional" :key="d.name" class="cd-tpl__dropped-item">
                <span class="cd-tpl__optional-name">{{ d.name }}</span>
                <span v-if="d.reason" class="cd-tpl__dropped-reason">{{ d.reason }}</span>
              </li>
              <li class="cd-tpl__dropped-hint">시작한 뒤 프로젝트 구성 화면의 '도우미 추천'에서 담을 수 있어요.</li>
            </ul>
          </div>

          <button type="button" class="cd-tpl__start" @click="startFrom(t)">이 템플릿으로 시작하기</button>
        </div>
      </article>
      </template>

      <!-- 내 상황 플랜만 보일 때 — 처음부터 전부(지금의 비전공·전공 플랜)를 펼친다 -->
      <button v-if="situationOn && !showAll && templates.length" type="button" class="cd-tpl__more" @click="showAll = true">
        <span class="cd-tpl__more-text">
          <strong>처음부터 전부 보기</strong>
          <span>{{ templates[0]!.stageLabel === '기본' ? '' : '비전공 기준 · ' }}{{ durationLine(templates[0]!) }} · 프로젝트 {{ templates[0]!.projects.length }}개</span>
        </span>
        <AppIcon name="ui-chevron-down" class="cd-tpl__more-arrow" />
      </button>

      <!-- 직접 설계하기 — 템플릿을 쓰지 않는 길. 직업·템플릿 유무와 상관없이 항상 맨 아래에 둔다 -->
      <button type="button" class="cd-tpl__manual" @click="startManual">
        <span class="cd-tpl__manual-icon"><AppIcon name="ui-edit" /></span>
        <span class="cd-tpl__manual-text">
          <strong>직접 설계하기</strong>
          <span>템플릿 없이 빈 계획에서 프로젝트를 하나씩 만들어요</span>
        </span>
        <span class="cd-tpl__manual-arrow"><AppIcon name="ui-chevron-right" /></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CdYellowHeader from '../components/CdYellowHeader.vue'
import PeriodTag from '../components/PeriodTag.vue'
import { useCareerDesign } from '../composables/useCareerDesign'
import { loadLibraryPlan } from '../composables/useHelperExamples'
import { buildPlanTemplates, buildSituationTemplate, type HaveTarget, type PlanTemplate } from '../composables/usePlanTemplates'
import { sameHave, withoutHave } from '../lib/situation'
import { hasAnything, schoolSummary, useCareerProfile } from '../composables/useCareerProfile'
import { toDateKey } from '../composables/usePlanTimeline'
import { formatWeeks, hasGateway, josaIGa, realityHead } from '@/modules/encyclopedia/lib/preparation'
import { getToday } from '@/shared/utils/dev-date'
import { startManualPlan } from '../composables/startManualPlan'
import { fetchTargetCareer } from '@/modules/encyclopedia/encyclopedia.api'
import type { CareerProfile, ProjectCategory } from '../types/career-design'
import type { JobPreparation } from '@/modules/encyclopedia/types/encyclopedia'
import { methodLine, methodIcon } from '../composables/projectMethods'
import JobGateGuide from '@/shared/components/JobGateGuide.vue'
import AppIcon from '@/shared/components/AppIcon.vue'

const router = useRouter()
const route = useRoute()
const { draftPlan, resetDraftPlan } = useCareerDesign()
const { profile: careerProfile, load: loadCareerProfile, save: saveCareerProfile } = useCareerProfile()

const CATS: { value: ProjectCategory; label: string }[] = [
  { value: 'qualification', label: '자격요건' },
  { value: 'knowledge', label: '분야지식' },
  { value: 'skill', label: '직무기술' },
  { value: 'portfolio', label: '포트폴리오' },
  { value: 'experience', label: '실무경험' },
]
// 진로계획 구성 화면과 같은 카테고리 색
const COLORS: Record<ProjectCategory, { bg: string; text: string }> = {
  qualification: { bg: '#E8F9EF', text: '#1DB95A' },
  knowledge: { bg: '#FFF2E8', text: '#F47820' },
  skill: { bg: '#F5EEFF', text: '#A855F7' },
  portfolio: { bg: '#EBF2FF', text: '#4480F5' },
  experience: { bg: '#FFEDF2', text: '#F0507E' },
}

// 목표 진로(진로백과에서 정한 것)의 예시 진로설계를 불러온다. 비로그인·미설정·직접 적은 목표면 템플릿 없이 '직접 설계하기'만 남는다
// (그런 목표는 진로계획 첫 화면이 이 화면을 건너뛰고 바로 직접 설계로 보낸다 — CareerDesignPage goToTemplates)
const targetTitle = ref('')
const basePrep = ref<JobPreparation | null>(null)   // 목표 진로(진로백과에서 정한 직업)의 예시
const loading = ref(true)
const track = ref<string | null>(null)

// 먼저 거치는 직업(2026-11-21, 결정 B-9) — 교장이 목표면 초등교사 같은 먼저 거치는 직업의 예시에서 시작할 수 있다.
// 목표 진로는 그대로 두고 이 화면의 예시만 바꾼다. 주소(?via=코드)에 두어 새로고침해도 남는다. 목록에 없는 코드는 무시한다
const careerReality = computed(() => (basePrep.value?.plan.reality?.kind === 'career' ? basePrep.value.plan.reality : null))
const gateway = computed(() => !viaCode.value && hasGateway(careerReality.value))
const viaCode = computed(() => {
  const q = route.query.via
  return typeof q === 'string' && careerReality.value?.via.some((v) => v.jobCode === q) ? q : null
})
const viaName = computed(() => careerReality.value?.via.find((v) => v.jobCode === viaCode.value)?.name ?? '')
const viaPrep = ref<JobPreparation | null>(null)
const viaLoading = ref(false)
const prep = computed(() => (viaCode.value ? viaPrep.value : basePrep.value))
let baseTrack: string | null = null
// push — 휴대폰 뒤로 가기를 누르면 목표 직업(via 없는 주소)으로 돌아온다(2026-11-21 오너). via 에서 다른 via 로 가는 길은 없다
function goVia(code: string) {
  baseTrack = track.value
  void router.push({ query: { ...route.query, via: code } })
}
// '○○ 계획으로 돌아가기' — 바로 앞 기록이 목표 직업 화면이면 그리로 한 칸 돌아간다(같은 화면이 기록에 두 번 쌓이지 않게).
// 새로고침·바로 열기처럼 앞 기록이 없으면 via 만 지운다
function leaveVia() {
  const rest = { ...route.query }
  delete rest.via
  const target = router.resolve({ query: rest }).fullPath
  if ((window.history.state as { back?: string } | null)?.back === target) router.back()
  else void router.replace({ query: rest })
}
watch(viaCode, async (code, prev) => {
  openId.value = null
  window.scrollTo(0, 0)
  if (!code) {
    viaPrep.value = null
    track.value = baseTrack ?? basePrep.value?.defaultTrack ?? null
    mineCollapsed.value = gateway.value   // 목표 직업 자신의 계획은 접힌 채로
    return
  }
  if (!prev) baseTrack = track.value
  viaLoading.value = true
  try {
    const p = await loadLibraryPlan(code)
    if (viaCode.value !== code) return   // 그 사이 다른 직업을 눌렀다
    viaPrep.value = p
    track.value = p?.defaultTrack ?? null
    mineCollapsed.value = false
  } finally {
    if (viaCode.value === code) viaLoading.value = false
  }
})

onMounted(async () => {
  try {
    const [{ data }, saved] = await Promise.all([fetchTargetCareer(), loadCareerProfile()])
    has.value = saved?.has ? [...saved.has] : []
    const target = data.targetCareer
    targetTitle.value = target?.title ?? target?.ref ?? ''
    if (target?.refType === 'jobCode') {
      basePrep.value = await loadLibraryPlan(target.ref)
      track.value = basePrep.value?.defaultTrack ?? null
      baseTrack = track.value
      // 경력직이면 목표 직업 자신의 계획(내 상황 플랜 포함)은 접어 둔다(결정 B-10)
      if (gateway.value) mineCollapsed.value = true
      // 주소에 ?via= 가 있으면(새로고침) 그 직업의 예시를 바로 불러온다 — watch 는 basePrep 이 생기며 이미 돌았다
    }
  } catch { /* 비로그인 등 */ } finally {
    loading.value = false
  }
})

// 이미 해 둔 것(내 진로상황) — 플랜과 기간에서 뺀다. 갈래를 바꿔도 남는다(가진 것은 그대로니까).
// 여기서 '이미 있어요'를 누르면 내 진로상황에도 저장한다(적어 둔 내 진로상황이 있을 때. 건너뛴 사람은 이 화면에서만)
const has = ref<CareerProfile['has']>([])
// 옛 열쇠로 저장된 것도 새 걸음으로 본다. '다시 넣기'는 그 걸음을 빼고, 필기·1차·연수면 짝인 자격도 함께 뺀다(lib/situation.ts withoutHave)
function setHave(target: HaveTarget, on: boolean) {
  const exists = has.value.some((h) => sameHave(h, target))
  const next = on ? (exists ? has.value : [...has.value, { ref: target.key, name: target.label }]) : withoutHave(has.value, target)
  has.value = next
  if (careerProfile.value) void saveCareerProfile({ ...careerProfile.value, has: next })
}
const templates = computed(() => (prep.value ? buildPlanTemplates(prep.value, track.value, has.value) : []))

// 내 진로상황 플랜(2026-11-16) — 적어 둔 내 진로상황이 있으면 맨 위에 하나, 나머지(처음부터 전부)는 펼쳐야 보인다.
// 내 진로상황 단계에서 '건너뛰기'로 왔으면(?situation=skip) 지금처럼 비전공·전공 플랜만
const situationOn = computed(() => route.query.situation !== 'skip' && hasAnything(careerProfile.value))
const mine = computed(() => (situationOn.value && prep.value && careerProfile.value
  ? buildSituationTemplate(prep.value, track.value, { ...careerProfile.value, has: has.value })
  : null))
const showAll = ref(false)
const shownTemplates = computed(() => (mine.value ? [mine.value, ...(showAll.value ? templates.value : [])] : templates.value))
const situationLine = computed(() => {
  const p = careerProfile.value
  if (!p) return ''
  return [schoolSummary(p), has.value.length ? `해 둔 것 ${has.value.length}개` : '', !p.school && p.records.length ? `경력·성과 ${p.records.length}개` : '']
    .filter(Boolean).join(' · ') || '적어 둔 내용'
})
// 같은 이유로 뺀 것은 한 줄로 — "수능 개념 다지기 외 3개 · 관련 학과에 다니고 있어요"
function groupChanges(t: PlanTemplate): { kind: 'cut' | 'shorten'; label: string; reason: string }[] {
  const out: { kind: 'cut' | 'shorten'; label: string; reason: string; names: string[] }[] = []
  for (const c of t.changes ?? []) {
    if (c.kind === 'shorten') { out.push({ kind: 'shorten', label: `${c.name} → 남은 ${formatWeeks(c.toWeeks ?? 0)}`, reason: c.reason, names: [] }); continue }
    const g = out.find((x) => x.kind === 'cut' && x.reason === c.reason)
    if (g) g.names.push(c.name)
    else out.push({ kind: 'cut', label: '', reason: c.reason, names: [c.name] })
  }
  return out.map((g) => ({ kind: g.kind, reason: g.reason, label: g.kind === 'shorten' ? g.label : g.names.length > 2 ? `${g.names[0]} 외 ${g.names.length - 1}개` : g.names.join(' · ') }))
}
// '약 4년' + '이' / '8주' + '가' — 받침에 맞춘다
// 기간 줄(2026-11-17) — '스스로 준비 약 14개월 · 과정 약 4년'. 큰 시험이 있으면 스스로 준비를 두 끝으로('약 14개월 ~ 2년 10개월'):
// 속도는 다음 화면에서 고르기 때문이다(시안 3판 '내가 정한 것')
function durationLine(t: PlanTemplate): string {
  const self = t.examHours && t.selfWeeksPart !== t.selfWeeks
    ? `${formatWeeks(t.selfWeeks)} ~ ${formatWeeks(t.selfWeeksPart).replace(/^약 /, '')}(시험 하루 8~3시간)`
    : formatWeeks(t.selfWeeks)
  return t.periodWeeks ? `스스로 준비 ${self} · 과정 ${formatWeeks(t.periodWeeks)}` : `스스로 준비 ${self}`
}
const trackInfo = computed(() => prep.value?.tracks.find((t) => t.id === track.value) ?? null)
const openId = ref<string | null>(null)
watch(track, () => { openId.value = null })   // 갈래를 바꾸면 플랜이 통째로 바뀐다 — 펼친 것을 접는다
// 내 상황 플랜은 펼친 채로 보여 준다(무엇을 왜 뺐는지가 카드 안에 있다). 접거나 다른 카드를 열면 그때부터 접힌다
const mineCollapsed = ref(false)
const isOpen = (t: PlanTemplate) => (t.stage === 'mine' ? !mineCollapsed.value && (openId.value === null || openId.value === t.id) : openId.value === t.id)
function toggle(t: PlanTemplate) {
  const open = isOpen(t)
  if (t.stage === 'mine') mineCollapsed.value = open
  else if (!open) mineCollapsed.value = true
  openId.value = open ? null : t.id
}


const countOf = (t: PlanTemplate, c: ProjectCategory) => t.projects.filter((p) => p.category === c).length
const LABEL = Object.fromEntries(CATS.map((c) => [c.value, c.label])) as Record<ProjectCategory, string>
const droppedOpen = reactive<Record<string, boolean>>({})
const toggleDropped = (id: string) => { droppedOpen[id] = !droppedOpen[id] }
const optionalOpen = reactive<Record<string, boolean>>({})
const toggleOptional = (id: string) => { optionalOpen[id] = !optionalOpen[id] }

// 직접 설계하기 — 템플릿 없이 빈 계획으로(진로계획 첫 화면과 같은 함수)
// 먼저 거치는 직업의 예시를 보는 중이면 그 직업으로(템플릿으로 시작할 때와 같게 — 계획은 그 직업이 되는 계획이다)
function startManual() {
  if (viaCode.value) startManualPlan(router, viaPrep.value?.title ?? viaName.value, viaPrep.value?.jobCode)
  else startManualPlan(router, targetTitle.value, prep.value?.jobCode)
}

// 템플릿으로 임시 계획을 채우고 프로젝트 구성으로 — 고친 뒤 타임라인·루틴을 거쳐 맨 끝 목표 설정에서 이름·기간을 정한다
function startFrom(t: PlanTemplate) {
  resetDraftPlan()
  draftPlan.name = t.name
  draftPlan.targetJob = t.jobTitle
  draftPlan.targetJobCode = t.jobCode       // 도우미 추천이 같은 직업·같은 갈래의 예시를 보여 준다
  draftPlan.templateTrack = t.track
  draftPlan.startDate = toDateKey(getToday())
  // 종료일은 비워 둔다 — 맨 끝 목표 설정에서 타임라인 기준으로 추천한다(2026-10-20)
  // 새 id 를 붙이면 나란히 짝(alongside = 짝의 id)도 새 id 로 다시 잇는다 — 안 그러면 7급 PSAT·전문이 따로 놓이고 따로 센다(11-17 끝-끝에서 발견)
  const ids = new Map(t.projects.map((p) => [p.id, `${p.id}-${Math.random().toString(36).slice(2, 7)}`]))
  draftPlan.projects = t.projects.map(({ alongside, ...p }) => {
    const mate = alongside ? ids.get(alongside) : undefined
    return {
      ...p,
      id: ids.get(p.id)!,
      ...(mate ? { alongside: mate } : {}),
      days: [...p.days],
      curriculum: p.curriculum?.map((w) => ({ ...w, items: [...w.items] })) ?? [],
    }
  })
  router.push('/career-design/plan/projects')
}
</script>

<style lang="scss">
.cd-tpl {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;

  &__body { flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 12px; }

  &__intro { font-size: 12px; color: #888; line-height: 1.5; padding: 0 4px; }

  // 먼저 알아 둘 것(2026-11-21) — 진로백과 준비과정 탭의 같은 상자와 같은 색
  &__reality { display: flex; flex-direction: column; gap: 7px; padding: 14px; border-radius: 14px; background: #FFF4E5; }
  &__reality-label { font-size: 11.5px; font-weight: 700; color: #B45F06; }
  &__reality-head { font-size: 16px; font-weight: 800; line-height: 1.35; letter-spacing: -0.02em; color: #5B3A12; word-break: keep-all; }
  &__reality-text { font-size: 12.5px; line-height: 1.55; color: #5B3A12; word-break: keep-all; }
  &__reality-sub { margin-top: 2px; font-size: 12px; font-weight: 700; color: #B45F06; }
  &__via { display: flex; flex-direction: column; gap: 6px; }
  &__via-btn {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    width: 100%; padding: 12px; border: 0; border-radius: 10px; background: #fff;
    font-family: inherit; text-align: left; cursor: pointer;

    &:active { background: #FFFAF2; }
    &:focus-visible { outline: 2px solid #FFC700; outline-offset: 2px; }
  }
  &__via-name { font-size: 14px; font-weight: 700; color: #333; }
  &__via-go { flex: none; display: inline-flex; align-items: center; gap: 2px; font-size: 12px; color: #888; }
  // 먼저 거치는 직업의 예시를 보는 중 — 목표 진로는 그대로라는 띠
  &__goal { display: flex; flex-direction: column; align-items: flex-start; gap: 3px; padding: 12px 14px; border-radius: 12px; background: #FFF4E5; color: #5B3A12; }
  &__goal-title { font-size: 13.5px; font-weight: 800; }
  &__goal-text { font-size: 12.5px; line-height: 1.5; }
  &__goal-back {
    margin-top: 2px; padding: 4px 0; border: 0; background: none;
    font-family: inherit; font-size: 12.5px; font-weight: 700; color: #B45F06; cursor: pointer;
  }

  &__card { background: #fff; border-radius: 16px; overflow: hidden; border: 1.5px solid transparent; }
  &__card--open { border-color: #FFC700; }
  &__card-head {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: 18px 20px;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
  }
  &__badge-row { display: flex; align-items: center; gap: 8px; }
  &__badge {
    font-size: 11px;
    font-weight: 700;
    border-radius: 6px;
    padding: 3px 8px;

    &--nonmajor { color: #B07D00; background: #FFF6D6; }
    &--mine { color: #8A6400; background: #FFF0B3; }
    &--major { color: #1D6FD8; background: #E8F1FE; }
    &--basic { color: #555; background: #F0F0F0; }
  }
  &__who { font-size: 12px; color: #888; }
  &__gate { margin-bottom: 4px; }

  // 내 진로상황 요약 줄(2026-11-16)
  &__situ { display: flex; align-items: center; gap: 8px; padding: 12px 14px; background: #fff; border-radius: 14px; }
  &__situ-label { flex: none; font-size: 11px; font-weight: 700; color: #8A6400; background: #FFF6D6; padding: 3px 8px; border-radius: 6px; }
  &__situ-text { flex: 1; min-width: 0; font-size: 12.5px; color: #555; overflow-wrap: anywhere; }
  &__situ-edit { flex: none; border: 0; background: none; padding: 4px; font-family: inherit; font-size: 12.5px; font-weight: 700; color: #1D6FD8; cursor: pointer; }
  &__situ-link { align-self: flex-start; display: inline-flex; align-items: center; gap: 2px; border: 0; background: none; padding: 2px 4px; font-family: inherit; font-size: 12.5px; font-weight: 700; color: #1D6FD8; cursor: pointer; }
  &__changed { background: #FFF8E6; border-radius: 10px; padding: 10px 12px; display: flex; flex-direction: column; gap: 7px; }
  &__changed-title { font-size: 12px; font-weight: 800; color: #8A5A00; }
  &__changed-row {
    display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 8px; font-size: 12.5px; color: #5C4500; line-height: 1.45;
    i { font-style: normal; font-size: 10.5px; font-weight: 800; padding: 1px 6px; border-radius: 5px; background: #fff; color: #8A5A00; align-self: start; margin-top: 1px; white-space: nowrap; }
    small { display: block; font-size: 11.5px; color: #9A7A2A; }
  }
  &__divider { margin-top: 6px; padding: 0 4px; font-size: 13px; font-weight: 700; color: #888; }
  &__more {
    width: 100%; display: flex; align-items: center; gap: 12px; padding: 16px 18px; background: #fff; border: 0; border-radius: 16px; text-align: left; cursor: pointer; font-family: inherit;
    &:active { background: #FAFAFA; }
  }
  &__more-text { flex: 1; display: flex; flex-direction: column; gap: 3px; strong { font-size: 15px; font-weight: 700; color: #222; } span { font-size: 12px; color: #888; } }
  &__more-arrow { color: #bbb; font-size: 18px; }

  // 갈래 고르기 — 준비하는 길이 갈리는 직업만(진로백과 준비과정 탭과 같은 말·같은 자료)
  &__tracks { display: flex; flex-direction: column; gap: 8px; padding: 16px 18px; background: #fff; border-radius: 16px; }
  &__tracks-chips { display: flex; flex-wrap: wrap; gap: 6px; }
  &__tracks-desc { font-size: 12px; color: #888; }
  &__chip {
    padding: 7px 13px;
    border: 1.5px solid #E6E8EC;
    border-radius: 999px;
    background: #fff;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.3;
    color: #666;
    cursor: pointer;

    &.is-on { border-color: #222; background: #222; color: #fff; }
    &:focus-visible { outline: 2px solid #FFC700; outline-offset: 2px; }
  }
  &__name { font-size: 16px; font-weight: 700; color: #222; line-height: 1.35; }
  &__meta { font-size: 12px; color: #999; }
  &__cats { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 2px; }
  &__cat { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 20px; white-space: nowrap; }
  &__toggle { align-self: flex-end; font-size: 12px; font-weight: 600; color: #888; }

  &__detail { padding: 14px 20px 20px; display: flex; flex-direction: column; gap: 12px; border-top: 1px solid #f2f2f2; }
  &__note {
    font-size: 12px;
    color: #8A5A00;
    background: #FFF8E6;
    border-radius: 10px;
    padding: 10px 12px;
    line-height: 1.55;
  }
  &__projects { list-style: none; display: flex; flex-direction: column; gap: 6px; }
  &__project { display: flex; align-items: flex-start; gap: 10px; padding: 10px 12px; background: #FAFAFA; border-radius: 10px; }
  &__project-no {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #222;
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1px;
  }
  &__project-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
  &__project-top { display: flex; align-items: center; gap: 6px; }
  &__project-cat { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 10px; white-space: nowrap; }
  &__project-name { font-size: 14px; font-weight: 600; color: #333; }
  &__project-meta { font-size: 11px; color: #999; }
  &__project-tag { font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 10px; white-space: nowrap; background: #ECEEF1; color: #666; }
  &__course { font-size: 12px; color: #666; line-height: 1.55; padding: 0 2px; word-break: keep-all; }
  // '이미 있어요' — 가지고 있는 면허·성적을 플랜에서 뺀다
  &__have {
    flex-shrink: 0;
    align-self: center;
    padding: 6px 10px;
    border: 1px solid #DADDE2;
    border-radius: 999px;
    background: #fff;
    font-family: inherit;
    font-size: 11px;
    font-weight: 700;
    color: #555;
    white-space: nowrap;
    cursor: pointer;

    &:active { background: #F2F3F5; }
    &:focus-visible { outline: 2px solid #FFC700; outline-offset: 2px; }
    &--undo { color: #1D6FD8; border-color: #C9DCF7; }
  }
  &__project-method { font-size: 12px; color: #666; }

  &__dropped { display: flex; flex-direction: column; gap: 8px; }
  &__dropped-toggle {
    align-self: flex-start;
    font-size: 12px;
    font-weight: 700;
    color: #777;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }
  &__dropped-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }
  &__dropped-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 12px;
    border: 1px dashed #E2E2E2;
    border-radius: 10px;
  }
  &__dropped-toggle--static { cursor: default; }
  &__dropped-item--row { flex-direction: row; align-items: center; justify-content: space-between; gap: 10px; }
  &__dropped-name { font-size: 13px; color: #aaa; text-decoration: line-through; }
  &__dropped-reason { font-size: 12px; color: #777; }
  &__optional-name { font-size: 13px; color: #444; }
  &__dropped-hint { font-size: 12px; color: #999; line-height: 1.5; }

  &__manual {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 18px 20px;
    background: #fff;
    border: 1.5px dashed #D5D5D5;
    border-radius: 16px;
    text-align: left;
    cursor: pointer;

    &:active { background: #FAFAFA; }
  }
  &__manual-icon { font-size: 22px; flex-shrink: 0; }
  &__manual-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;

    strong { font-size: 15px; font-weight: 700; color: #222; }
    span { font-size: 12px; color: #888; }
  }
  &__manual-arrow { font-size: 20px; color: #bbb; flex-shrink: 0; }

  &__start {
    margin-top: 4px;
    width: 100%;
    padding: 16px;
    background: #FFC700;
    border: none;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;

    &:active { opacity: 0.85; }
  }
}
</style>

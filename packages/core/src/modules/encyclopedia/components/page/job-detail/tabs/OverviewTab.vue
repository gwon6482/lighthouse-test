<template>
  <div class="overview-tab">

    <!-- 상위 직업군 데이터 안내.
         work24-shared = 고용24가 이 직업을 상위 직업으로 통합해 둔 경우(예: 전문의 13종 → '전문의사').
         표시하지 않으면 "소아과와 성형외과 임금이 왜 같지?" 를 오류로 오해한다.

         ⚠️ jobNm 이 이 직업 이름과 같으면 안내할 게 없다. 그런데도 dataSource 는
            work24-shared 인 경우가 있다(간호사·항공기조종사 등 6건). 그때 이 문구를 띄우면
            "아래 정보는 **간호사** 기준이에요" 가 되어 아무 말도 아니게 된다. -->
    <p v-if="showSharedNotice" class="overview-notice">
      아래 정보는 <strong>{{ job.work24?.jobNm }}</strong> 기준이에요.
      비슷한 직업을 묶어 조사한 자료라 세부 직업별로 다를 수 있어요.
    </p>

    <!-- 진입 관문(전공·시험·면허 필수 직업만, 2026-10-27) — 관문 없는 직업은 아무것도 안 그린다 -->
    <JobGateGuide :job-code="job.jobCode" variant="detail" class="overview-gate" />

    <!-- 주요업무 -->
    <section class="overview-section">
      <h3 class="overview-section__title">주요업무</h3>
      <p class="overview-section__text">{{ job.overview }}</p>
    </section>

    <!-- 수행직무 -->
    <section class="overview-section">
      <h3 class="overview-section__title">수행직무</h3>
      <ul class="overview-duties">
        <li v-for="(duty, i) in job.duties" :key="i" class="overview-duties__item">
          <span class="list-dot" />
          {{ duty }}
        </li>
      </ul>
    </section>

    <!-- 되는 길 -->
    <section v-if="job.work24?.way" class="overview-section">
      <h3 class="overview-section__title">되는 길</h3>
      <p class="overview-section__text overview-section__text--pre">{{ job.work24.way }}</p>
      <!-- 라이트하우스가 직접 쓴 글 표시(2026-11-14) — 고용24 자료가 아니라는 것과 근거 수준을 알린다 -->
      <div v-if="job.work24.waySource" class="overview-way-source">
        <p class="overview-way-source__lead">
          <strong>라이트하우스가 정리한 내용이에요.</strong>
          {{ job.work24.waySource.basis === 'law' ? '법령과 자격 기준을 확인해 썼어요.' : '일반적인 경로를 정리했어요.' }}
          시험·채용 조건은 공고로 다시 확인해 주세요.
        </p>
        <p v-if="job.work24.waySource.sources.length" class="overview-way-source__refs">
          확인한 자료: {{ job.work24.waySource.sources.join(' · ') }}
        </p>
      </div>
    </section>

    <!-- 학력 · 전공 -->
    <section v-if="hasEducationInfo" class="overview-section">
      <h3 class="overview-section__title">이 일을 하는 사람들</h3>

      <div v-if="job.work24?.education?.length" class="overview-ratio">
        <span class="overview-ratio__caption">학력</span>
        <div v-for="e in job.work24.education" :key="e.key" class="overview-ratio__row">
          <span class="overview-ratio__label">{{ e.label }}</span>
          <div class="overview-ratio__bar-bg">
            <div class="overview-ratio__bar-fill" :style="{ width: e.ratio + '%' }" />
          </div>
          <span class="overview-ratio__value">{{ e.ratio }}%</span>
        </div>
      </div>

      <div v-if="job.work24?.schoolDepartments?.length" class="overview-ratio">
        <span class="overview-ratio__caption">전공 계열</span>
        <div v-for="s in job.work24.schoolDepartments" :key="s.key" class="overview-ratio__row">
          <span class="overview-ratio__label">{{ s.label }}</span>
          <div class="overview-ratio__bar-bg">
            <div class="overview-ratio__bar-fill overview-ratio__bar-fill--alt" :style="{ width: s.ratio + '%' }" />
          </div>
          <span class="overview-ratio__value">{{ s.ratio }}%</span>
        </div>
      </div>

      <div v-if="job.relatedMajors?.length" class="overview-chips">
        <span class="overview-ratio__caption">관련 학과</span>
        <ul class="overview-chips__list">
          <li v-for="m in job.relatedMajors" :key="m.name" class="overview-chips__item">{{ m.name }}</li>
        </ul>
      </div>

      <div v-if="job.relatedCertifications?.length" class="overview-chips">
        <span class="overview-ratio__caption">관련 자격</span>
        <ul class="overview-chips__list">
          <li v-for="c in job.relatedCertifications" :key="c" class="overview-chips__item overview-chips__item--cert">{{ c }}</li>
        </ul>
      </div>
    </section>

    <!-- 비회원(2026-11-11, 자기이해 결과지 맛보기와 같은 결 — features.guestEntry 빌드만): '이 일을 하는 사람들' 아래도 그리되
         구역 제목과 첫 항목만 또렷하게, 나머지는 흐리게(g-veil) · 길면 잘라 옅어지게(g-clip). 흐린 곳을 누르면 맨 아래 안내 카드로.
         목표 진로 설정은 두지 않는다 — 안내 카드가 '나에게 맞는 직업 찾기'로 비회원 검사(A 경로)로 보낸다(사용자 결정 2026-11-09) -->

    <!-- 개인요소 / 업무요소 -->
    <section v-for="section in detailSections" :key="section.title" :class="['overview-section', 'overview-section--cards', { 'g-locked': locked }]" @click="onLockedClick">
      <div class="overview-section__header">
        <h3 class="overview-section__title">{{ section.title }}</h3>
        <span v-if="locked" class="g-pill"><AppIcon name="ui-privacy" :size="12" />가입 후</span>
        <button
          v-else
          type="button"
          class="compare-toggle"
          :class="{ 'compare-toggle--on': showInter[section.title] }"
          @click="showInter[section.title] = !showInter[section.title]"
        >
          {{ showInter[section.title] ? '직업간 비교 숨기기' : '직업간 비교 보기' }}
        </button>
      </div>

      <div :class="['pf-cards', { 'g-clip': locked }]">
        <article v-for="(cat, ci) in cardsFor(section)" :key="`${cat.catKey}-${cat.dimKey}`" :class="['pf-card', { 'g-veil': locked && ci > 0 }]">
          <div class="pf-card-head">
            <span class="pf-card-title">{{ cat.catKey }}</span>
            <span class="pf-badge">{{ cat.dimKey }}</span>
          </div>

          <!-- 직업 내 (기본 노출, 상위 3개) -->
          <div class="pf-block">
            <p class="pf-block-label">
              <svg class="pf-icon pf-icon--within" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="1" />
              </svg>
              이 직업에서 특히 중요해요
            </p>
            <ul class="pf-chips">
              <li v-for="(item, ii) in cat.within" :key="item.code" :class="{ 'g-veil': locked && ii > 0 }">
                <button
                  type="button"
                  class="pf-chip pf-chip--within"
                  :class="{ 'pf-chip--open': openCode === item.code }"
                  :aria-expanded="openCode === item.code"
                  @click="toggleDef(item.code)"
                >
                  {{ item.name }}
                  <span v-if="definitionOf(item.code)" class="pf-chip__more" aria-hidden="true">?</span>
                </button>
              </li>
            </ul>
            <!-- 항목 설명. 칩을 누르면 펼쳐진다. 설명이 없으면 칩이 눌리지 않는다. -->
            <p v-if="openDefFor(cat.within)" class="pf-def">{{ openDefFor(cat.within) }}</p>
          </div>

          <!-- 직업 간 (토글 시 노출, 상위 3개) -->
          <div v-show="showInter[section.title]" class="pf-block">
            <p class="pf-block-label">
              <svg class="pf-icon pf-icon--between" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.9 7a8 8 0 0 1 1.1 5v1a6 6 0 0 0 .8 3" />
                <path d="M8 11a4 4 0 0 1 8 0v1a10 10 0 0 0 2 6" />
                <path d="M12 11v2a14 14 0 0 0 2.5 8" />
                <path d="M8 15a18 18 0 0 0 1.8 6" />
                <path d="M4.9 19a22 22 0 0 1 -.9 -7v-1a8 8 0 0 1 12 -6.95" />
              </svg>
              다른 직업과 뚜렷이 구별돼요
            </p>
            <ul class="pf-chips">
              <li v-for="item in cat.between" :key="item.code">
                <button
                  type="button"
                  class="pf-chip pf-chip--between"
                  :class="{ 'pf-chip--open': openCode === item.code }"
                  :aria-expanded="openCode === item.code"
                  @click="toggleDef(item.code)"
                >
                  {{ item.name }}
                  <span v-if="definitionOf(item.code)" class="pf-chip__more" aria-hidden="true">?</span>
                </button>
              </li>
            </ul>
            <p v-if="openDefFor(cat.between)" class="pf-def">{{ openDefFor(cat.between) }}</p>
          </div>
        </article>
      </div>
    </section>

    <!-- 직업 현황 -->
    <section v-if="job.jobSatisfaction != null || job.salary" :class="['overview-section', 'overview-section--cards', { 'g-locked': locked }]" @click="onLockedClick">
      <div v-if="locked" class="overview-section__header"><h3 class="overview-section__title">직업 현황</h3><span class="g-pill"><AppIcon name="ui-privacy" :size="12" />가입 후</span></div>
      <h3 v-else class="overview-section__title">직업 현황</h3>
      <div class="overview-stats">

        <!-- 직업 만족도 — 고용24 재직자 만족도(백점 기준 점수)를 그대로 보여 준다. 고용24·추천 목록·결과지도 'n%'로 쓴다.
             직업 간 순위가 아니다(537개가 49.8~83.3, 중앙 67.5에 몰려 있다). 예전 '상위 (100 − 값)%'는 틀렸다:
             74.7은 '상위 25.3%'로 보였지만 실제로는 위에서 10% 자리, 60은 '상위 40%'로 보였지만 바닥 쪽이었다(2026-11-17) -->
        <div v-if="job.jobSatisfaction != null" class="overview-stats__card">
          <span class="overview-stats__label">직업 만족도</span>
          <div class="overview-satisfaction">
            <div class="overview-satisfaction__bar-bg">
              <div
                class="overview-satisfaction__bar-fill"
                :style="{ width: job.jobSatisfaction + '%' }"
              />
            </div>
            <span class="overview-satisfaction__value">{{ job.jobSatisfaction.toFixed(1) }}%</span>
          </div>
        </div>

        <!-- 임금 정보 -->
        <div v-if="job.salary" :class="['overview-stats__card', { 'g-veil': locked }]">
          <span class="overview-stats__label">연봉 (만원)</span>
          <div class="overview-salary">
            <div class="overview-salary__track">
              <div class="overview-salary__bar" />
              <div class="overview-salary__point overview-salary__point--lower">
                <div class="overview-salary__dot" />
                <span class="overview-salary__tip">하위 25%</span>
                <span class="overview-salary__amount">{{ job.salary.lower.toLocaleString() }}</span>
              </div>
              <div class="overview-salary__point overview-salary__point--median">
                <div class="overview-salary__dot overview-salary__dot--median" />
                <span class="overview-salary__tip">중위</span>
                <span class="overview-salary__amount overview-salary__amount--median">{{ job.salary.median.toLocaleString() }}</span>
              </div>
              <div class="overview-salary__point overview-salary__point--upper">
                <div class="overview-salary__dot" />
                <span class="overview-salary__tip">상위 25%</span>
                <span class="overview-salary__amount">{{ job.salary.upper.toLocaleString() }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
      <!-- 연봉 단서(2026-11-18 결정 11) — 같은 재직자 조사(직업당 약 30명)의 자기 응답이고 경력자가 섞여 있다 -->
      <p v-if="job.salary" class="overview-stats__note" data-test="salary-note">일하는 사람들이 답한 값이에요(경력자 포함). 직업끼리 견주는 참고로 봐 주세요.</p>
    </section>

    <!-- 전문가 전망(2026-11-18) — API outlook(data/job-outlook)으로만 그린다. 고용24 옛 전망 글(2016년 무렵)은 더 그리지 않는다.
         공식 판정은 한 단어 + 연도 + 출처 + 링크(한국고용정보원 글은 옮기지 않는다), 자체 조사는 '라이트하우스가 정리한 내용' 표시.
         결정: workspace decisions/2026-11-18-job-outlook.md(정한 것 1·3·7·8) · 규칙: lib/outlook.ts -->
    <section v-if="view" :class="['overview-section', 'overview-outlook', { 'g-locked': locked }]" data-test="outlook" @click="onLockedClick">
      <div v-if="locked" class="overview-section__header">
        <h3 class="overview-section__title">전문가 전망</h3>
        <span class="g-pill"><AppIcon name="ui-privacy" :size="12" />가입 후</span>
      </div>
      <h3 v-else class="overview-section__title">전문가 전망</h3>

      <p v-if="view.noneLine" class="overview-outlook__none" data-test="outlook-none">{{ view.noneLine }}</p>

      <div v-if="view.showOurs" :class="['overview-outlook__ours', { 'g-veil': locked }]" data-test="outlook-ours">
        <p v-for="(l, i) in job.outlook?.ours?.lines ?? []" :key="i" class="overview-outlook__ours-line">{{ l }}</p>
        <p class="overview-outlook__badge">{{ view.oursBadge }}</p>
        <ul v-if="job.outlook?.ours?.facts?.length" class="overview-outlook__facts">
          <li v-for="(f, i) in job.outlook.ours.facts" :key="i">
            <a v-if="f.source?.url && !locked" :href="f.source.url" target="_blank" rel="noopener">{{ factSource(f) }}</a>
            <span v-else>{{ factSource(f) }}</span>
          </li>
        </ul>
      </div>

      <div v-if="view.showOfficial" :class="['overview-outlook__official', { 'overview-outlook__official--small': view.officialSmall }]" data-test="outlook-official">
        <p v-if="groupLineText" class="overview-outlook__group">{{ groupLineText }}</p>
        <div class="overview-outlook__verdict">
          <span :class="['overview-outlook__chip', `overview-outlook__chip--${tone}`]">{{ job.outlook?.official?.verdict }}</span>
          <span v-if="when" class="overview-outlook__when">{{ when }}</span>
        </div>
        <p :class="['overview-outlook__line', { 'g-veil': locked }]">{{ sentence }}</p>
        <p v-if="srcText" :class="['overview-outlook__source', { 'g-veil': locked }]">출처: {{ srcText }}</p>
        <a
          v-if="job.outlook?.official?.source?.url && !locked"
          class="overview-outlook__link"
          :href="job.outlook.official.source.url"
          target="_blank"
          rel="noopener"
        >전체 글은 워크피디아에서 볼 수 있어요 ›</a>
      </div>

      <p v-if="view.hiringLine" class="overview-outlook__hiring">{{ view.hiringLine }}</p>
      <div v-if="view.related.length" class="overview-outlook__related" data-test="outlook-related">
        <span class="overview-outlook__related-label">비슷한 직업의 전망</span>
        <div class="overview-outlook__related-chips">
          <RouterLink
            v-for="r in view.related"
            :key="r.jobCode"
            :to="`/career-encyclopedia/job/${r.jobCode}`"
            class="overview-outlook__related-chip"
          >{{ r.title }}</RouterLink>
        </div>
      </div>
    </section>

    <!-- 일하는 사람들의 생각(2026-11-18) — 고용24 막대는 전망 통계가 아니라 재직자 의견(직업당 평균 30명, '참고자료로만')이다.
         '2025년 조사'는 이 막대에만 붙인다. 비회원은 다섯 칸을 함께 흐린다(예전처럼 한 칸만 또렷하면 의견이 판정 한 단어로 읽힌다) -->
    <section v-if="job.work24?.prospect?.distribution?.length" :class="['overview-section', { 'g-locked': locked }]" data-test="opinion" @click="onLockedClick">
      <div v-if="locked" class="overview-section__header">
        <h3 class="overview-section__title">일하는 사람들의 생각 <span v-if="opinionSub" class="overview-section__sub">{{ opinionSub }}</span></h3>
        <span class="g-pill"><AppIcon name="ui-privacy" :size="12" />가입 후</span>
      </div>
      <h3 v-else class="overview-section__title">
        일하는 사람들의 생각
        <span v-if="opinionSub" class="overview-section__sub">{{ opinionSub }}</span>
      </h3>

      <div class="overview-prospect">
        <div v-for="b in job.work24.prospect.distribution" :key="b.name" :class="['overview-prospect__row', { 'g-veil': locked }]">
          <span class="overview-prospect__label">{{ b.name }}</span>
          <div class="overview-prospect__bar-bg">
            <div
              class="overview-prospect__bar-fill"
              :class="prospectToneOf(b.name)"
              :style="{ width: b.ratio + '%' }"
            />
          </div>
          <span class="overview-prospect__value">{{ b.ratio }}%</span>
        </div>
      </div>
      <p class="overview-prospect__note">한 직업에 평균 30명이 답한 결과예요. 참고로만 봐 주세요.</p>
    </section>

    <!-- 관련 직업 -->
    <section v-if="job.work24?.relatedJobs?.length" :class="['overview-section', { 'g-locked': locked }]" @click="onLockedClick">
      <div v-if="locked" class="overview-section__header"><h3 class="overview-section__title">관련 직업 {{ job.work24.relatedJobs.length }}개</h3><span class="g-pill"><AppIcon name="ui-privacy" :size="12" />가입 후</span></div>
      <h3 v-else class="overview-section__title">관련 직업</h3>
      <ul :class="['overview-chips__list', { 'g-clip g-clip--sm': locked }]">
        <li v-for="(r, ri) in job.work24.relatedJobs" :key="r.jobNm" :class="['overview-chips__item', { 'g-veil': locked && ri > 1 }]">{{ r.jobNm }}</li>
      </ul>
    </section>

    <!-- 비회원 안내 카드 — 흐린 곳을 누르면 여기로 내려온다 -->
    <div v-if="locked" ref="ctaEl" class="overview-lock"><JobGuestCta /></div>

    <!-- 출처(2026-11-18 결정 5) — 고용24 직업정보 Open API 이용 조건(공공누리 제4유형)의 첫 조건이 출처 표시다.
         '제공·공식·제휴'라는 말은 쓰지 않는다(후원·특수관계로 오인 금지) -->
    <p class="overview-source" data-test="source">직업 정보 출처: 한국고용정보원 고용24 직업정보(공공누리 제4유형) · 라이트하우스가 직접 쓴 부분은 따로 표시했어요.</p>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import JobGuestCta from '../JobGuestCta.vue'
import type { Job, JobDetails, CategoryRankings, RankItem, OutlookSource } from '../../../../types/encyclopedia'

import { useCareerAttributes } from '@/shared/composables/useCareerAttributes'
import JobGateGuide from '@/shared/components/JobGateGuide.vue'
import { outlookView, verdictSentence, verdictWhen, verdictTone, sourceText, groupLine } from '../../../../lib/outlook'

const props = defineProps<{ job: Job; locked?: boolean }>()

// ── 전문가 전망(2026-11-18, lib/outlook.ts) ───────────────────────────────
const view = computed(() => outlookView(props.job.outlook))
const sentence = computed(() => verdictSentence(props.job.outlook))
const when = computed(() => verdictWhen(props.job.outlook?.official))
const tone = computed(() => verdictTone(props.job.outlook?.official?.verdict))
const srcText = computed(() => sourceText(props.job.outlook?.official))
// 묶음 판정 안내 — 같은 고용24 원본을 쓰는 직업 수(자기 포함)를 붙인다
const groupLineText = computed(() => groupLine(props.job.outlook, (props.job.sharedWith?.length ?? 0) + 1))
function factSource(f: { text: string; source?: OutlookSource }): string {
  const s = f.source
  if (!s) return f.text
  return [s.publisher, s.title, s.year ? `(${s.year})` : ''].filter(Boolean).join(' ')
}

// 비회원: 흐린 곳을 누르면 맨 아래 안내 카드로 내린다(또렷한 칩·링크는 제 할 일을 하게 둔다)
const ctaEl = ref<HTMLElement | null>(null)
function onLockedClick(e: MouseEvent) {
  if (!props.locked || (e.target as HTMLElement).closest('button, a')) return
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ctaEl.value?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
}

type FactorKey = keyof JobDetails
type DimKey = '중요도' | '수준'
type CompareKey = '직업내' | '직업간'

const TOP_N = 3

const detailSections: Array<{ title: string; keys: FactorKey[] }> = [
  { title: '개인요소', keys: ['성격', '지식', '흥미', '가치관'] },
  { title: '업무요소', keys: ['업무수행능력', '업무활동', '업무환경'] },
]

const showInter = reactive<Record<string, boolean>>({
  개인요소: false,
  업무요소: false,
})

function dimensionsOf(catKey: FactorKey): DimKey[] {
  const cat = props.job.details[catKey] as CategoryRankings
  return (['중요도', '수준'] as DimKey[]).filter(k => cat[k] !== undefined)
}

function getItems(catKey: FactorKey, dimKey: DimKey, compareKey: CompareKey): RankItem[] {
  const items = (props.job.details[catKey] as CategoryRankings)[dimKey]?.[compareKey] ?? []
  return [...items].sort((a, b) => b.score - a.score).slice(0, TOP_N)
}

interface FactorCard {
  catKey: FactorKey
  dimKey: DimKey
  within: RankItem[]
  between: RankItem[]
}

const hasEducationInfo = computed(() =>
  !!(props.job.work24?.education?.length
    || props.job.work24?.schoolDepartments?.length
    || props.job.relatedMajors?.length
    || props.job.relatedCertifications?.length),
)

// 상위 직업군 안내를 띄울지. 대표 직업명이 **이 직업 이름과 다를 때만** 의미가 있다.
// ⚠️ `dataSource === 'work24-shared'` 만으로 판정하면 안 된다 — jobNm 이 자기 이름과
//    같은 직업이 6건 있어서(간호사·항공기조종사·회계사무원 등) "아래 정보는 간호사
//    기준이에요" 라는 빈 문장이 뜬다.
const showSharedNotice = computed(() => {
  const nm = props.job.work24?.jobNm
  return props.job.dataSource === 'work24-shared' && !!nm && nm !== props.job.title
})

// 재직자 조사 연도(막대·임금이 같은 조사). '○○년 조사'는 '일하는 사람들의 생각' 막대에만 붙인다(2026-11-18 결정 2)
const prospectYear = computed(() =>
  props.job.work24?.prospect?.distribution?.find(b => b.year)?.year
    ?? props.job.work24?.salarySurveyYear
    ?? null,
)
// 묶음 직업이면 막대가 묶음 전체의 응답이라고 밝힌다(예: '2025년 조사 · 전문의사 전체')
const opinionSub = computed(() => {
  const parts: string[] = []
  if (prospectYear.value) parts.push(`${prospectYear.value}년 조사`)
  if (showSharedNotice.value && props.job.work24?.jobNm) parts.push(`${props.job.work24.jobNm} 전체`)
  return parts.join(' · ')
})

// 전망 막대 색. 증가 계열/감소 계열만 구분하고 나머지는 기본색.
function prospectToneOf(name: string): string {
  if (name.includes('증가')) return 'overview-prospect__bar-fill--up'
  if (name.includes('감소')) return 'overview-prospect__bar-fill--down'
  return ''
}

// ── 항목 설명문 ───────────────────────────────────────────────────────────
// 칩을 누르면 그 항목의 설명이 아래에 펼쳐진다. 한 번에 하나만 열린다.
//
// ⚠️ 설명문은 직업 상세 응답에 **없다**(code·name 만 온다). 직업과 무관한 마스터
//    데이터(202건)라 `useCareerAttributes` 가 따로 한 번 받아 캐시한다.
// ⚠️ 설명이 없는 항목은 **눌려도 아무 일이 없다** — 그래서 `?` 표시도 안 붙인다.
//    로드 실패 시에도 화면은 그대로 동작해야 하므로 '설명 없음' 같은 문구를 띄우지 않는다.
const { load: loadAttrs, definitionOf } = useCareerAttributes()
const openCode = ref<string | null>(null)

onMounted(loadAttrs)

function toggleDef(code: string) {
  if (!definitionOf(code)) return
  openCode.value = openCode.value === code ? null : code
}

// 이 블록(직업내/직업간) 안에 열린 항목이 있을 때만 설명을 그린다.
// 같은 코드가 두 블록에 동시에 있을 수 있어서 블록별로 판정한다.
function openDefFor(items: { code: string }[]): string | null {
  if (!openCode.value) return null
  return items.some(i => i.code === openCode.value) ? definitionOf(openCode.value) : null
}

function cardsFor(section: { keys: FactorKey[] }): FactorCard[] {
  return section.keys.flatMap(catKey =>
    dimensionsOf(catKey).map(dimKey => ({
      catKey,
      dimKey,
      within: getItems(catKey, dimKey, '직업내'),
      between: getItems(catKey, dimKey, '직업간'),
    })),
  )
}
</script>

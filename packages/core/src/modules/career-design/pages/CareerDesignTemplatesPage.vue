<template>
  <div class="cd-tpl">
    <CdYellowHeader
      title="진로계획 세우기"
      :subtitle="job ? `${job.title}을 위한 라이트하우스 진로계획` : '라이트하우스가 미리 설계한 진로계획에서 시작해요'"
      back-to="/career-design"
    />

    <div class="cd-tpl__body">
      <!-- 직업 고르기: 목표 진로에 맞는 템플릿이 없을 때(🧪 프로토타입 — 템플릿이 있는 직업이 아직 5개뿐) -->
      <section v-if="!matched || picked" class="cd-tpl__jobs-box">
        <p class="cd-tpl__jobs-desc">
          <template v-if="targetTitle && !matched">'{{ targetTitle }}' 템플릿은 아직 준비 중이에요. </template>
          아래 직업의 템플릿을 살펴보세요.
        </p>
        <div class="cd-tpl__jobs">
          <button
            v-for="j in HELPER_EXAMPLE_JOBS"
            :key="j.jobCode"
            type="button"
            class="cd-tpl__job"
            :class="{ 'cd-tpl__job--on': job?.jobCode === j.jobCode }"
            @click="pickJob(j.jobCode)"
          >{{ j.title }}</button>
        </div>
      </section>

      <p v-if="job" class="cd-tpl__intro">
        {{ job.title }} 채용공고 {{ job.posts }}건과 직업정보를 바탕으로 설계했어요. 고른 뒤 목표·기간·프로젝트를 자유롭게 고칠 수 있어요.
      </p>

      <article
        v-for="t in templates"
        :key="t.id"
        class="cd-tpl__card"
        :class="{ 'cd-tpl__card--open': openId === t.id }"
      >
        <button type="button" class="cd-tpl__card-head" @click="openId = openId === t.id ? null : t.id">
          <span class="cd-tpl__badge">{{ t.level }}</span>
          <span class="cd-tpl__name">{{ t.name }}</span>
          <span class="cd-tpl__meta">{{ t.months }}개월 · 프로젝트 {{ t.projects.length }}개</span>
          <span class="cd-tpl__cats">
            <span
              v-for="c in CATS"
              :key="c.value"
              class="cd-tpl__cat"
              :style="{ background: COLORS[c.value].bg, color: COLORS[c.value].text }"
            >{{ c.label }} {{ countOf(t, c.value) }}</span>
          </span>
          <span class="cd-tpl__toggle">{{ openId === t.id ? '접기 ▲' : '구성 보기 ▼' }}</span>
        </button>

        <div v-if="openId === t.id" class="cd-tpl__detail">
          <p class="cd-tpl__summary">{{ t.summary }}</p>
          <div v-for="c in CATS" :key="c.value" class="cd-tpl__group">
            <template v-if="countOf(t, c.value)">
              <p class="cd-tpl__group-title" :style="{ color: COLORS[c.value].text }">{{ c.label }}</p>
              <ul class="cd-tpl__projects">
                <li v-for="p in t.projects.filter((x) => x.category === c.value)" :key="p.id" class="cd-tpl__project">
                  <span class="cd-tpl__project-name">{{ p.name }}</span>
                  <span class="cd-tpl__project-meta">{{ p.curriculum?.length ?? 0 }}주 · {{ p.days.join('') }} · {{ p.duration }}분</span>
                </li>
              </ul>
            </template>
          </div>
          <button type="button" class="cd-tpl__start" @click="startFrom(t)">이 템플릿으로 시작하기</button>
        </div>
      </article>

      <!-- 직접 설계하기 — 템플릿을 쓰지 않는 길. 직업·템플릿 유무와 상관없이 항상 맨 아래에 둔다 -->
      <button type="button" class="cd-tpl__manual" @click="startManual">
        <span class="cd-tpl__manual-icon">✏️</span>
        <span class="cd-tpl__manual-text">
          <strong>직접 설계하기</strong>
          <span>템플릿 없이 빈 계획에서 프로젝트를 하나씩 만들어요</span>
        </span>
        <span class="cd-tpl__manual-arrow">›</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import CdYellowHeader from '../components/CdYellowHeader.vue'
import { useCareerDesign } from '../composables/useCareerDesign'
import { HELPER_EXAMPLE_JOBS, findHelperExamples, findHelperExamplesByCode } from '../composables/useHelperExamples'
import { buildPlanTemplates, addMonthsKey, type PlanTemplate } from '../composables/usePlanTemplates'
import { fetchTargetCareer } from '@/modules/encyclopedia/encyclopedia.api'
import { getToday } from '@/shared/utils/dev-date'
import type { ProjectCategory } from '../types/career-design'

const router = useRouter()
const { draftPlan, resetDraftPlan } = useCareerDesign()

const CATS: { value: ProjectCategory; label: string }[] = [
  { value: 'qualification', label: '자격요건' },
  { value: 'knowledge', label: '분야지식' },
  { value: 'skill', label: '직무기술' },
  { value: 'portfolio', label: '포트폴리오' },
]
// 진로계획 구성 화면과 같은 카테고리 색
const COLORS: Record<ProjectCategory, { bg: string; text: string }> = {
  qualification: { bg: '#E8F9EF', text: '#1DB95A' },
  knowledge: { bg: '#FFF2E8', text: '#F47820' },
  skill: { bg: '#F5EEFF', text: '#A855F7' },
  portfolio: { bg: '#EBF2FF', text: '#4480F5' },
}

// 목표 진로(진로백과에서 정한 것)를 먼저 본다. 비로그인·미설정이면 비어 있다
const targetTitle = ref('')
onMounted(async () => {
  try {
    const { data } = await fetchTargetCareer()
    targetTitle.value = data.targetCareer?.title ?? data.targetCareer?.ref ?? ''
  } catch { /* 비로그인 등 */ }
})

const matched = computed(() => findHelperExamples(targetTitle.value))
const picked = ref<string | null>(null)
const job = computed(() => (picked.value ? findHelperExamplesByCode(picked.value) : matched.value))
const templates = computed(() => (job.value ? buildPlanTemplates(job.value) : []))
const openId = ref<string | null>(null)

function pickJob(code: string) {
  picked.value = code
  openId.value = null
}

const countOf = (t: PlanTemplate, c: ProjectCategory) => t.projects.filter((p) => p.category === c).length

// 직접 설계하기 — 예전 진로설계 화면의 [진로계획 시작하기]와 같다(빈 계획 + 목표 진로를 직업 칸에)
function startManual() {
  resetDraftPlan()
  if (targetTitle.value) draftPlan.targetJob = targetTitle.value
  router.push('/career-design/plan/new')
}

// 템플릿으로 임시 계획을 채우고 '목표 설정'으로 — 이름·기간을 확인·수정한 뒤 직접 설계와 같은 흐름으로 이어진다
function startFrom(t: PlanTemplate) {
  resetDraftPlan()
  draftPlan.name = t.name
  draftPlan.targetJob = t.jobTitle
  draftPlan.endDate = addMonthsKey(getToday(), t.months)
  draftPlan.projects = t.projects.map((p) => ({
    ...p,
    id: `${p.id}-${Math.random().toString(36).slice(2, 7)}`,
    days: [...p.days],
    curriculum: p.curriculum?.map((w) => ({ ...w, items: [...w.items] })) ?? [],
  }))
  router.push('/career-design/plan/new')
}
</script>

<style lang="scss">
.cd-tpl {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;

  &__body { flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 12px; }

  &__jobs-box { background: #fff; border-radius: 16px; padding: 16px 20px; display: flex; flex-direction: column; gap: 10px; }
  &__jobs-desc { font-size: 13px; color: #666; line-height: 1.5; }
  &__jobs { display: flex; flex-wrap: wrap; gap: 6px; }
  &__job {
    font-size: 12px;
    font-weight: 600;
    color: #666;
    background: #F2F2F2;
    border: none;
    border-radius: 20px;
    padding: 6px 12px;
    cursor: pointer;
    white-space: nowrap;

    &--on { color: #fff; background: #222; }
  }

  &__intro { font-size: 12px; color: #888; line-height: 1.5; padding: 0 4px; }

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
  &__badge { font-size: 11px; font-weight: 700; color: #B07D00; background: #FFF6D6; border-radius: 6px; padding: 3px 8px; }
  &__name { font-size: 16px; font-weight: 700; color: #222; line-height: 1.35; }
  &__meta { font-size: 12px; color: #999; }
  &__cats { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 2px; }
  &__cat { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 20px; white-space: nowrap; }
  &__toggle { align-self: flex-end; font-size: 12px; font-weight: 600; color: #888; }

  &__detail { padding: 0 20px 20px; display: flex; flex-direction: column; gap: 12px; border-top: 1px solid #f2f2f2; }
  &__summary { margin-top: 14px; font-size: 13px; color: #555; line-height: 1.55; }
  &__group-title { font-size: 12px; font-weight: 700; margin-bottom: 6px; }
  &__projects { list-style: none; display: flex; flex-direction: column; gap: 6px; }
  &__project { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; background: #FAFAFA; border-radius: 10px; }
  &__project-name { font-size: 14px; font-weight: 600; color: #333; }
  &__project-meta { font-size: 11px; color: #999; }

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

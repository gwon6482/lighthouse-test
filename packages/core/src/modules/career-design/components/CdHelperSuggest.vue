<template>
  <!-- 진로 설계 도우미(베타) — 목표 직업의 채용공고·직업정보 근거로 만든 프로젝트 예시. 예시가 없는 직업이면 아무것도 그리지 않는다 -->
  <!-- 🧪 프로토타입: 목표 직업에 예시가 없어도 영역을 보이고, 예시 직업을 골라 볼 수 있게 한다(PROTOTYPE=false 면 최종 동작 = 숨김) -->
  <section v-if="PROTOTYPE || (job && items.length)" class="cd-helper">
    <div class="cd-helper__head">
      <div class="cd-helper__title-row">
        <span class="cd-helper__title">도우미 추천</span>
        <span class="cd-helper__beta">BETA</span>
      </div>
      <p v-if="job" class="cd-helper__desc">
        {{ job.title }} 채용공고 {{ job.posts }}건을 분석해 만든 {{ categoryLabel }} 예시예요. 담은 뒤 자유롭게 고칠 수 있어요.
      </p>
      <p v-else class="cd-helper__desc">
        <template v-if="draftPlan.targetJob">'{{ draftPlan.targetJob }}' 예시는 아직 준비 중이에요. </template>아래 직업을 골라 예시를 살펴보세요.
      </p>
    </div>

    <!-- 예시 직업 고르기(프로토타입) — 목표 직업과 맞는 예시가 없을 때, 또는 다른 직업 예시를 둘러볼 때 -->
    <div v-if="PROTOTYPE && (!matched || picked)" class="cd-helper__jobs">
      <button
        v-for="j in HELPER_EXAMPLE_JOBS"
        :key="j.jobCode"
        type="button"
        class="cd-helper__job"
        :class="{ 'cd-helper__job--on': job?.jobCode === j.jobCode }"
        @click="picked = j.jobCode"
      >{{ j.title }} <JobGateBadges :job-code="j.jobCode" :max="1" /></button>
    </div>

    <ul class="cd-helper__list">
      <li v-for="ex in items" :key="ex.id">
        <button type="button" class="cd-helper__card" @click="open(ex)">
          <span class="cd-helper__card-main">
            <span class="cd-helper__card-name">{{ ex.name }}</span>
            <span v-if="methodLine(ex.method, ex.methodDetail)" class="cd-helper__card-method">{{ methodLine(ex.method, ex.methodDetail) }}</span>
            <span class="cd-helper__card-meta">{{ ex.level }} · {{ ex.curriculum.length }}주 · 주 {{ ex.daysPerWeek }}회 {{ ex.minutesPerSession }}분</span>
          </span>
          <span
            class="cd-helper__card-add"
            :class="{ 'cd-helper__card-add--done': isAdded(ex) }"
            :style="isAdded(ex) ? {} : { color: colors.chipText, background: colors.chipBg }"
          >{{ isAdded(ex) ? '담음 ✓' : '+ 담기' }}</span>
        </button>
      </li>
    </ul>

    <!-- 미리보기 시트 -->
    <Teleport to="body">
      <Transition name="cd-helper-sheet">
        <div v-if="selected" class="cd-helper-sheet" @click.self="close">
          <div class="cd-helper-sheet__panel">
            <div class="cd-helper-sheet__handle" />
            <div class="cd-helper-sheet__header" :style="{ borderLeftColor: colors.btn }">
              <span class="cd-helper-sheet__cat" :style="{ color: colors.chipText, background: colors.chipBg }">
                {{ categoryLabel }} · {{ selected.level }}
              </span>
              <h2 class="cd-helper-sheet__name">{{ selected.name }}</h2>
              <p class="cd-helper-sheet__goal">{{ selected.goal }}</p>
              <p class="cd-helper-sheet__meta">
                {{ selected.curriculum.length }}주 · 주 {{ selected.daysPerWeek }}회 · 1회 {{ selected.minutesPerSession }}분
              </p>
              <p v-if="selected.method" class="cd-helper-sheet__method">
                {{ methodLine(selected.method, selected.methodDetail) }}
                <span>✅ {{ doneLabel(category, selected.method) }}</span>
              </p>
            </div>

            <div class="cd-helper-sheet__basis">
              <span class="cd-helper-sheet__basis-label">왜 추천하나요?</span>
              <p>{{ selected.basis }}</p>
            </div>

            <div class="cd-helper-sheet__body">
              <div v-for="w in selected.curriculum" :key="w.week" class="cd-helper-sheet__week">
                <div class="cd-helper-sheet__week-head">
                  <span class="cd-helper-sheet__week-badge" :style="{ background: colors.btn }">{{ w.week }}주차</span>
                  <span class="cd-helper-sheet__week-title">{{ w.title }}</span>
                </div>
                <ul class="cd-helper-sheet__items">
                  <li v-for="(it, i) in weekEntriesOf(w)" :key="i">{{ it }}</li>
                </ul>
              </div>
            </div>

            <div class="cd-helper-sheet__footer">
              <button type="button" class="cd-helper-sheet__btn-secondary" @click="close">닫기</button>
              <button
                type="button"
                class="cd-helper-sheet__btn-primary"
                :style="isAdded(selected) ? {} : { background: colors.btn }"
                :disabled="isAdded(selected) || adding"
                @click="add(selected)"
              >
                {{ isAdded(selected) ? '내 계획에 담겨 있어요' : adding ? '담는 중…' : '내 계획에 담기' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCareerDesign } from '../composables/useCareerDesign'
import { weekEntriesOf } from '../composables/useProjectCurriculum'
import { HELPER_EXAMPLE_JOBS, findHelperExamples, findHelperExamplesByCode, helperExampleToProject } from '../composables/useHelperExamples'
import type { HelperExample, ProjectCategory } from '../types/career-design'
import { methodLine, doneLabel } from '../composables/projectMethods'
import JobGateBadges from '@/shared/components/JobGateBadges.vue'

const props = defineProps<{
  category: ProjectCategory
  colors: { chipBg: string; chipText: string; btn: string }
}>()

const { draftPlan, syncAddProject } = useCareerDesign()

const LABELS: Record<ProjectCategory, string> = {
  qualification: '자격요건',
  knowledge: '분야지식',
  skill: '직무기술',
  portfolio: '포트폴리오',
  experience: '실무경험',
}
const categoryLabel = computed(() => LABELS[props.category])

// 🧪 프로토타입 스위치 — true: 예시가 없어도 영역을 보이고 예시 직업을 고를 수 있다. 정식 출시 때 false(또는 제거)
const PROTOTYPE = true

const matched = computed(() => findHelperExamples(draftPlan.targetJob))
const picked = ref<string | null>(null)
const job = computed(() => (picked.value ? findHelperExamplesByCode(picked.value) : matched.value))
const items = computed(() => job.value?.examples[props.category] ?? [])

// 같은 이름의 프로젝트가 이미 계획에 있으면 '담음' — 템플릿 붙여넣기와 같은 기준
const isAdded = (ex: HelperExample) => draftPlan.projects.some((p) => p.name === ex.name)

const selected = ref<HelperExample | null>(null)
const adding = ref(false)
const open = (ex: HelperExample) => { selected.value = ex }
const close = () => { selected.value = null }

async function add(ex: HelperExample) {
  if (isAdded(ex) || adding.value) return
  adding.value = true
  const project = helperExampleToProject(ex, props.category)
  draftPlan.projects.push(project)
  // 진행 중인 계획(planId)이 있으면 서버 반영, 없으면 로컬 드래프트에만 담긴다(붙여넣기와 같은 경로)
  await syncAddProject(project)
  adding.value = false
  setTimeout(close, 500)
}
</script>

<style lang="scss">
.cd-helper {
  background: #fff;
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__title-row { display: flex; align-items: center; gap: 6px; }
  &__title { font-size: 15px; font-weight: 700; color: #222; }
  &__beta {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.04em;
    color: #fff;
    background: #222;
    border-radius: 6px;
    padding: 2px 6px;
  }
  &__desc { margin-top: 4px; font-size: 12px; color: #888; line-height: 1.5; }

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

  &__list { list-style: none; display: flex; flex-direction: column; gap: 8px; }

  &__card {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    background: #FAFAFA;
    border: 1px solid #EFEFEF;
    border-radius: 12px;
    text-align: left;
    cursor: pointer;

    &:active { background: #F2F2F2; }
  }
  &__card-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
  &__card-name { font-size: 14px; font-weight: 600; color: #222; }
  &__card-meta { font-size: 11px; color: #999; }
  &__card-method { font-size: 12px; color: #555; }
  &__card-add {
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 700;
    padding: 6px 10px;
    border-radius: 20px;
    white-space: nowrap;

    &--done { color: #aaa; background: #F0F0F0; }
  }
}

.cd-helper-sheet {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: flex-end;
  justify-content: center;

  &__panel {
    width: 100%;
    max-width: 480px;
    max-height: 86vh;
    background: #fff;
    border-radius: 20px 20px 0 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  &__handle { width: 36px; height: 4px; border-radius: 2px; background: #ddd; margin: 10px auto 4px; flex-shrink: 0; }

  &__header {
    margin: 8px 20px 0;
    padding-left: 12px;
    border-left: 4px solid;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  &__cat { align-self: flex-start; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; }
  &__name { font-size: 18px; font-weight: 700; color: #222; line-height: 1.35; }
  &__goal { font-size: 13px; color: #555; line-height: 1.5; }
  &__meta { font-size: 12px; color: #999; }
  &__method {
    margin-top: 10px;
    padding: 8px 10px;
    border-radius: 8px;
    background: #f6f6f6;
    font-size: 13px;
    font-weight: 600;
    color: #333;

    span { display: block; margin-top: 2px; font-size: 12px; font-weight: 500; color: #666; }
  }

  &__basis {
    margin: 14px 20px 0;
    padding: 12px 14px;
    background: #F7F8FA;
    border-radius: 12px;
    font-size: 12px;
    color: #555;
    line-height: 1.55;
  }
  &__basis-label { display: block; font-size: 11px; font-weight: 700; color: #888; margin-bottom: 4px; }

  &__body { flex: 1; overflow-y: auto; padding: 14px 20px 8px; display: flex; flex-direction: column; gap: 14px; }
  &__week-head { display: flex; align-items: center; gap: 8px; }
  &__week-badge { flex-shrink: 0; font-size: 11px; font-weight: 700; color: #fff; padding: 3px 8px; border-radius: 6px; white-space: nowrap; }
  &__week-title { font-size: 14px; font-weight: 600; color: #333; }
  &__items {
    margin-top: 6px;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    font-size: 13px;
    color: #666;
    list-style: disc;
  }

  &__footer { display: flex; gap: 10px; padding: 12px 20px 28px; border-top: 1px solid #f0f0f0; }
  &__btn-secondary {
    flex: 1;
    padding: 15px;
    background: #fff;
    border: 1.5px solid #ddd;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 700;
    color: #666;
    cursor: pointer;
  }
  &__btn-primary {
    flex: 2;
    padding: 15px;
    border: none;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;

    &:disabled { background: #e8e8e8; color: #aaa; cursor: default; }
  }
}

.cd-helper-sheet-enter-active,
.cd-helper-sheet-leave-active { transition: opacity 0.2s; }
.cd-helper-sheet-enter-active .cd-helper-sheet__panel,
.cd-helper-sheet-leave-active .cd-helper-sheet__panel { transition: transform 0.25s ease; }
.cd-helper-sheet-enter-from,
.cd-helper-sheet-leave-to { opacity: 0; }
.cd-helper-sheet-enter-from .cd-helper-sheet__panel,
.cd-helper-sheet-leave-to .cd-helper-sheet__panel { transform: translateY(100%); }
</style>

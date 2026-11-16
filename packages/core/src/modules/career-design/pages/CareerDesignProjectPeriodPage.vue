<template>
  <!-- 과정 프로젝트의 둘째 화면 '다니는 방식'(2026-11-16, 등록 화면 시안 https://claude.ai/artifact/P9wtbADjxPdderuXobLXe8).
       진도의 '주차별 할 일' 대신 — 단계마다 오늘 할 일 이름·기간·결산 점검. 점검 주는 자동(lib/period.ts).
       새로 만들면 단계 하나(기간 전체) + 시작 준비·마무리 주 넣기, 예시 계획에서 온 과정은 단계 그대로 -->
  <div class="cd-per" :style="{ '--cat-color': currentColor }">
    <CdYellowHeader title="다니는 방식" :subtitle="summary" :color="currentColor" :back-to="WRITE_PATH" />

    <div class="cd-per__body">
      <p class="cd-per__hint">다니는 날 오늘 할 일에 이렇게 보여요</p>
      <div class="cd-per__preview" aria-hidden="true">
        <span class="cd-per__preview-chip"><AppIcon name="kind-period" /></span>
        <span class="cd-per__preview-main">
          <span class="cd-per__preview-name"><PeriodTag /> {{ draftProject.name }}</span>
          <span class="cd-per__preview-sub">{{ phases[0]?.title.trim() || '오늘 할 일' }} · 1/{{ phases[0]?.weeks ?? 1 }}주</span>
        </span>
        <span class="cd-per__preview-btn">완료</span>
      </div>

      <section v-for="(ph, i) in phases" :key="ph.key" class="cd-per__phase" :class="{ 'cd-per__phase--open': open === i }">
        <button type="button" class="cd-per__phase-head" :aria-expanded="open === i" @click="open = open === i ? -1 : i">
          <em>단계 {{ i + 1 }}</em>
          <span class="cd-per__phase-name">{{ ph.title.trim() || '이름을 적어 주세요' }}</span>
          <small>{{ rangeLabel(i) }}<template v-if="open !== i"> · 점검 {{ ph.items.filter((x) => x.trim()).length }}</template></small>
        </button>
        <div v-if="open === i" class="cd-per__phase-body">
          <div class="cd-per__row">
            <label class="cd-per__field">
              <span>오늘 할 일 이름</span>
              <input v-model="ph.title" class="cd-per__input" maxlength="20" placeholder="예: 근무, 수업, 실습">
            </label>
            <div class="cd-per__field">
              <span>기간</span>
              <div class="cd-per__mini">
                <button type="button" aria-label="한 주 줄이기" :disabled="ph.weeks <= 1" @click="ph.weeks -= 1">−</button>
                <b>{{ ph.weeks }}주</b>
                <button type="button" aria-label="한 주 늘리기" @click="ph.weeks += 1">+</button>
              </div>
            </div>
          </div>
          <p class="cd-per__field-label">결산에서 점검할 것 <small>(선택 · {{ PERIOD_CHECK_MAX }}개까지)</small></p>
          <ul v-if="ph.items.length" class="cd-per__checks">
            <li v-for="(c, k) in ph.items" :key="k">
              <span class="cd-per__box" aria-hidden="true" />
              <input v-model="ph.items[k]" class="cd-per__check-input" maxlength="20" :aria-label="`점검 ${k + 1}`" placeholder="예: 맡은 일 기록">
              <button type="button" class="cd-per__x" :aria-label="`점검 ${k + 1} 지우기`" @click="ph.items.splice(k, 1)"><AppIcon name="ui-close" /></button>
            </li>
          </ul>
          <button v-if="ph.items.length < PERIOD_CHECK_MAX" type="button" class="cd-per__add" @click="ph.items.push('')">+ 점검 추가</button>
          <button v-if="phases.length > 1" type="button" class="cd-per__remove" @click="removePhase(i)">이 단계 지우기</button>
        </div>
      </section>

      <!-- 시작 준비·마무리 주는 아직 없을 때만(새로 만든 4주 넘는 과정은 마무리가 기본으로 들어 있다) -->
      <div v-if="!startShown || !endShown" class="cd-per__adds" :class="{ 'cd-per__adds--one': startShown !== endShown }">
        <button v-if="!startShown" type="button" @click="addStart">+ 시작 준비 주 넣기<small>예: {{ defaults.start[0] || '지원·등록' }}</small></button>
        <button v-if="!endShown" type="button" @click="addEnd">+ 마무리 주 넣기<small>예: {{ defaults.end[0] || '증명서 받기' }}</small></button>
      </div>
      <button v-if="phases.length > 1" type="button" class="cd-per__add cd-per__add--phase" @click="addPhase">+ 단계 추가</button>

      <p class="cd-per__when">
        <template v-if="checkWeeks.length"><b>{{ checkWeeks.map((w) => `${w}주차`).join(' · ') }}</b> 결산에서 그 단계의 점검을 물어요. </template>
        다니는 동안에는 매주 결산에 '일정' 줄이 나와요.
      </p>
      <p v-if="error" class="cd-per__error">{{ error }}</p>
    </div>

    <div class="cd-per__footer">
      <button type="button" class="cd-per__cta" :disabled="saving" @click="save">{{ saving ? '저장하는 중이에요…' : '저장' }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import CdYellowHeader from '../components/CdYellowHeader.vue'
import PeriodTag from '../components/PeriodTag.vue'
import { useCareerDesign } from '../composables/useCareerDesign'
import {
  END_TITLE, PERIOD_CHECK_MAX, defaultPeriodPhases, hasEndPhase, hasStartPhase, periodCheckWeeks, periodDefaults,
  phasesFromCurriculum, rebuildPeriodCurriculum, stretchPhaseIndex,
} from '../lib/period'
import { formatMinutes } from '@/modules/encyclopedia/lib/preparation'
import type { ProjectCategory } from '../types/career-design'

const router = useRouter()
const { draftPlan, draftProject, editingProjectId, syncAddProject, syncUpdateProject } = useCareerDesign()
const WRITE_PATH = '/career-design/project/new'

const categoryColorMap: Record<ProjectCategory, string> = {
  qualification: '#1DB95A', knowledge: '#F47820', skill: '#A855F7', portfolio: '#4480F5', experience: '#F0507E',
}
const currentColor = computed(() => categoryColorMap[draftProject.category ?? 'knowledge'])
const defaults = computed(() => periodDefaults(draftProject.method))

interface EditPhase { key: number; title: string; weeks: number; items: string[] }
let seq = 0
const phases = ref<EditPhase[]>([])
const open = ref(0)
const saving = ref(false)
const error = ref('')
let saved = false
let baseline = ''

const total = computed(() => phases.value.reduce((s, ph) => s + Math.max(1, ph.weeks), 0))
const summary = computed(() => {
  const days = draftProject.days?.length ? draftProject.days.join('·') : '요일 미정'
  return `${draftProject.name ?? ''} · ${total.value}주 · ${days} · 하루 ${formatMinutes(draftProject.duration ?? 0)}`
})
const startShown = computed(() => hasStartPhase(phases.value))
const endShown = computed(() => hasEndPhase(phases.value))
const checkWeeks = computed(() => [...periodCheckWeeks(phases.value.map((ph) => ({ weeks: ph.weeks, title: ph.title, items: ph.items.filter((x) => x.trim()) }))).keys()])
function rangeLabel(i: number): string {
  const start = phases.value.slice(0, i).reduce((s, ph) => s + ph.weeks, 0) + 1
  const end = start + phases.value[i]!.weeks - 1
  return start === end ? `${start}주차` : `${start}~${end}주차`
}

onMounted(() => {
  window.scrollTo(0, 0)
  // 첫 화면을 건너뛰고 들어왔거나 진도 프로젝트면 첫 화면으로
  if (!draftProject.name || !draftProject.period) { router.replace(WRITE_PATH); return }
  const want = Math.max(1, draftProject.weeks ?? 1)
  let list = phasesFromCurriculum(draftProject.curriculum ?? [])
  if (list.length) {
    // 첫 화면에서 다니는 기간을 고쳤으면 늘리고 줄이는 단계(마무리 앞)로 맞춘다
    const sum = list.reduce((s, ph) => s + ph.weeks, 0)
    if (sum !== want) { const k = stretchPhaseIndex(list); list[k]!.weeks = Math.max(1, list[k]!.weeks + (want - sum)) }
  } else {
    // 새로 만들거나 진도에서 바꿨다 — 이름·점검은 진행 방식 기본값(정할 것 5). 4주 넘으면 마무리 1주를 기간 안에서 떼어 둔다
    list = defaultPeriodPhases(draftProject.method, want)
  }
  phases.value = list.map((ph) => ({ key: ++seq, title: ph.title, weeks: ph.weeks, items: [...ph.items] }))
  open.value = list.length > 1 ? stretchPhaseIndex(list) : 0
  baseline = JSON.stringify(phases.value)
})

function addStart() {
  phases.value.unshift({ key: ++seq, title: defaults.value.startLabel, weeks: 1, items: [...defaults.value.start] })
  open.value = 0
}
function addEnd() {
  phases.value.push({ key: ++seq, title: END_TITLE, weeks: 1, items: [...defaults.value.end] })
  open.value = phases.value.length - 1
}
function addPhase() {
  phases.value.push({ key: ++seq, title: '', weeks: 1, items: [] })
  open.value = phases.value.length - 1
}
function removePhase(i: number) {
  phases.value.splice(i, 1)
  open.value = Math.max(0, Math.min(i, phases.value.length - 1))
}

// 미저장 이탈 가드 — 다니는 기간을 고치러 첫 화면으로 가는 건 정상 흐름이라 묻지 않는다
onBeforeRouteLeave((to) => {
  if (saved || to.path === WRITE_PATH) return true
  if (JSON.stringify(phases.value) === baseline) return true
  return confirm('작성 중인 다니는 방식이 저장되지 않았어요.\n정말 나가시겠어요?')
})

async function save() {
  if (saving.value) return
  error.value = ''
  const blank = phases.value.findIndex((ph) => !ph.title.trim())
  if (blank >= 0) { error.value = '단계마다 오늘 할 일 이름을 적어 주세요'; open.value = blank; return }
  saving.value = true
  const clean = phases.value.map((ph) => ({ title: ph.title.trim(), weeks: Math.max(1, Math.trunc(ph.weeks)), items: ph.items.map((x) => x.trim()).filter(Boolean).slice(0, PERIOD_CHECK_MAX) }))
  // 쉬는 주(주간결산 '잠시 쉬어요')는 같은 주차에 다시 끼운다
  const curriculum = rebuildPeriodCurriculum(clean, draftProject.curriculum ?? [])
  const projectData = {
    category: draftProject.category ?? 'knowledge',
    name: draftProject.name ?? '',
    goal: draftProject.goal ?? '',
    days: [...(draftProject.days ?? [])],
    duration: draftProject.duration ?? 240,
    priority: draftProject.priority ?? 'normal',
    notification: draftProject.notification ?? false,
    missedNotification: draftProject.missedNotification ?? true,
    notificationTime: draftProject.notificationTime ?? '09:00',
    memo: draftProject.memo ?? '',
    weeks: curriculum.length,
    curriculum: curriculum.map((w) => ({ ...w, items: [...w.items], ...(w.checks ? { checks: [...w.checks] } : {}) })),
    // ⚠️ 필드를 하나씩 옮겨 담는 곳이다(커리큘럼 화면과 같다) — Project 에 필드를 늘리면 여기도
    method: draftProject.method ?? null,
    methodDetail: { ...(draftProject.methodDetail ?? {}) },
    period: true as const,
  }
  try {
    if (editingProjectId.value) {
      const target = draftPlan.projects.find((p) => p.id === editingProjectId.value)
      if (target) {
        Object.assign(target, projectData)
        await syncUpdateProject(target)
      }
      editingProjectId.value = null
    } else {
      const created = { id: `draft-${Date.now()}`, ...projectData }
      draftPlan.projects.push(created)
      await syncAddProject(created)
    }
    draftProject.curriculum = projectData.curriculum
    saved = true
    router.replace('/career-design/plan/projects')
  } catch {
    error.value = '저장하지 못했어요. 다시 눌러 주세요.'
  } finally {
    saving.value = false
  }
}
</script>

<style lang="scss">
.cd-per {
  --cat-color: #F47820;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;

  &__body { flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
  &__hint { font-size: 12px; color: #999; padding: 0 2px; }
  &__preview {
    display: grid; grid-template-columns: 36px minmax(0, 1fr) auto; gap: 10px; align-items: center;
    padding: 12px; border: 1.5px dashed #E6E0D0; border-radius: 14px; background: #fff;
  }
  &__preview-chip { width: 36px; height: 36px; border-radius: 11px; background: #FFF4D6; color: #8A5A00; display: grid; place-items: center; font-size: 18px; }
  &__preview-main { display: grid; gap: 1px; min-width: 0; }
  &__preview-name { display: flex; align-items: center; gap: 5px; font-size: 13.5px; font-weight: 700; color: #222; min-width: 0; }
  &__preview-sub { font-size: 11.5px; color: #999; }
  &__preview-btn { font-size: 12px; font-weight: 800; padding: 6px 12px; border-radius: 999px; border: 1.5px solid #D5D8DE; color: #333; }

  &__phase { background: #fff; border-radius: 16px; border: 1.5px solid #eee; overflow: hidden; }
  &__phase--open { border-color: #E3C98A; }
  &__phase-head {
    width: 100%; display: flex; align-items: center; gap: 8px; padding: 13px 14px; border: 0; background: none;
    font-family: inherit; text-align: left; cursor: pointer;
    em { font-style: normal; font-size: 11px; font-weight: 800; color: #8A5A00; background: #FFF4D6; border-radius: 6px; padding: 1px 7px; white-space: nowrap; }
    small { margin-left: auto; font-size: 11.5px; color: #aaa; white-space: nowrap; }
    &:focus-visible { outline: 2px solid var(--cat-color); outline-offset: -2px; }
  }
  &__phase-name { font-size: 14px; font-weight: 800; color: #222; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  &__phase-body { display: flex; flex-direction: column; gap: 10px; padding: 0 14px 14px; }
  &__row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: end; }
  &__field { display: grid; gap: 5px; font-size: 12px; color: #666; }
  &__input {
    width: 100%; box-sizing: border-box; padding: 11px 12px; border: 1.5px solid #eee; border-radius: 10px;
    font-family: inherit; font-size: 14px; color: #333; outline: none;
    &:focus { border-color: var(--cat-color); }
  }
  &__mini {
    display: flex; align-items: center; gap: 6px;
    button { width: 34px; height: 34px; border-radius: 9px; border: 1.5px solid var(--cat-color); background: #fff; color: var(--cat-color); font-size: 17px; font-weight: 800; cursor: pointer; &:disabled { border-color: #eee; color: #ccc; cursor: default; } }
    b { min-width: 42px; text-align: center; font-size: 14px; color: #222; }
  }
  &__field-label { font-size: 12px; color: #666; small { color: #aaa; } }
  &__checks { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  &__checks li { display: flex; align-items: center; gap: 8px; padding: 4px 6px 4px 10px; border-radius: 10px; background: #FAFAFA; }
  &__box { flex: none; width: 16px; height: 16px; border-radius: 4px; border: 1.5px solid #CFD3D9; background: #fff; box-sizing: border-box; }
  &__check-input { flex: 1; min-width: 0; padding: 8px 4px; border: 0; background: transparent; font-family: inherit; font-size: 13px; font-weight: 600; color: #333; outline: none; }
  &__x { flex: none; width: 30px; height: 30px; border: 0; background: none; color: #aaa; font-size: 13px; cursor: pointer; display: grid; place-items: center; }
  &__add { align-self: flex-start; border: 0; background: none; padding: 2px; font-family: inherit; font-size: 13px; font-weight: 700; color: #1D6FD8; cursor: pointer; }
  &__add--phase { padding: 2px 4px; }
  &__remove { align-self: flex-end; border: 0; background: none; font-family: inherit; font-size: 12px; color: #999; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
  &__adds {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
    &--one { grid-template-columns: 1fr; }
    button {
      padding: 11px 6px; border: 1.5px dashed #D5D5D5; border-radius: 12px; background: #fff;
      font-family: inherit; font-size: 12.5px; font-weight: 700; color: #555; cursor: pointer; text-align: center;
      small { display: block; margin-top: 2px; font-size: 10.5px; font-weight: 600; color: #aaa; }
    }
  }
  &__when { padding: 11px 13px; border-radius: 12px; background: #E9EFFC; font-size: 12.5px; line-height: 1.55; color: #2C4479; b { color: #1C2F5C; } }
  &__error { font-size: 13px; color: #E05050; padding: 0 2px; }
  &__footer { padding: 16px 20px 32px; }
  &__cta {
    width: 100%; padding: 18px; border: none; border-radius: 14px; background: var(--cat-color);
    font-family: inherit; font-size: 16px; font-weight: 700; color: #fff; cursor: pointer;
    &:disabled { opacity: 0.6; cursor: default; }
  }
}
</style>

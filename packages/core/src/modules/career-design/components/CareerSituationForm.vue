<template>
  <!-- 내 진로상황 질문(2026-11-16) — 진로계획 세우기 단계(step)와 마이페이지 고치기(edit)가 같이 쓴다.
       목표 직업의 예시 계획(prep)이 있으면 학과 질문과 '이미 해 둔 것' 목록을 그 계획에서 뽑는다 -->
  <div class="csf">
    <section class="csf-card">
      <p class="csf-q">학교</p>
      <div class="csf-chips" role="group" aria-label="학교">
        <button
          v-for="o in SCHOOL_OPTIONS"
          :key="o.value"
          type="button"
          :class="['csf-chip', { 'is-on': modelValue.school === o.value }]"
          :aria-pressed="modelValue.school === o.value"
          @click="setSchool(o.value)"
        >{{ o.label }}</button>
      </div>
      <template v-if="modelValue.school === 'college'">
        <p class="csf-q csf-q--sm">학년</p>
        <div class="csf-chips" role="group" aria-label="학년">
          <button
            v-for="y in YEAR_OPTIONS"
            :key="y.value"
            type="button"
            :class="['csf-chip', 'csf-chip--num', { 'is-on': modelValue.year === y.value }]"
            :aria-pressed="modelValue.year === y.value"
            @click="patch({ year: y.value })"
          >{{ y.label }}</button>
        </div>
      </template>
      <label v-if="atCollege(modelValue.school)" class="csf-field">
        <span>학과 (선택)</span>
        <input :id="`csf-major-${mode}`" :value="modelValue.major ?? ''" maxlength="60" placeholder="예: 간호학과" @input="patch({ major: ($event.target as HTMLInputElement).value })" />
      </label>
    </section>

    <!-- 목표 직업과 관련된 학과인가 — 그 계획에 학과에 따라 빠지는 걸음이 있을 때만, 대학생 이상일 때만 -->
    <section v-if="showRelated" class="csf-card">
      <p class="csf-q">{{ prep?.plan.relatedMajor }}에 다니고 있거나 졸업했나요?</p>
      <div class="csf-seg" role="group" :aria-label="`${prep?.plan.relatedMajor}에 다니고 있거나 졸업했나요?`">
        <button type="button" :class="{ 'is-on': related }" :aria-pressed="related" @click="setRelated(true)">예</button>
        <button type="button" :class="{ 'is-on': !related }" :aria-pressed="!related" @click="setRelated(false)">아니요</button>
      </div>
    </section>

    <!-- 마이페이지 — 다른 목표 직업에서 '관련 학과예요'라고 답한 것 -->
    <section v-if="mode === 'edit' && otherRelated.length" class="csf-card">
      <p class="csf-q">목표 직업과 관련된 학과</p>
      <ul class="csf-pills">
        <li v-for="j in otherRelated" :key="j.jobCode">
          <span>{{ j.name || j.jobCode }}</span>
          <button type="button" :aria-label="`${j.name} 관련 학과 표시 지우기`" @click="removeRelated(j.jobCode)">×</button>
        </li>
      </ul>
    </section>

    <section v-if="candidates.length" class="csf-card">
      <p class="csf-q">이미 해 둔 것 <small>{{ prep?.displayName }} 계획에서</small></p>
      <ul class="csf-checks">
        <li v-for="c in candidates" :key="`${c.key}|${c.label}`">
          <button type="button" :class="['csf-check', { 'is-on': had(c) }]" :aria-pressed="had(c)" @click="toggleHave(c)">
            <span class="csf-check__box" aria-hidden="true" />{{ c.label }}
          </button>
        </li>
      </ul>
    </section>

    <!-- 마이페이지 — 다른 계획에서 고른 '이미 해 둔 것' -->
    <section v-if="mode === 'edit' && otherHas.length" class="csf-card">
      <p class="csf-q">이미 해 둔 것<small v-if="candidates.length">다른 계획에서 고른 것</small></p>
      <ul class="csf-pills">
        <li v-for="h in otherHas" :key="`${h.ref}|${h.name}`">
          <span>{{ h.name || h.ref }}</span>
          <button type="button" :aria-label="`${h.name} 지우기`" @click="removeHas(h)">×</button>
        </li>
      </ul>
    </section>

    <section class="csf-card">
      <button v-if="mode === 'step'" type="button" class="csf-fold" :aria-expanded="recordsOpen" @click="recordsOpen = !recordsOpen">
        <span class="csf-q">경력·성과 <small>선택{{ modelValue.records.length ? ` · ${modelValue.records.length}개` : '' }}</small></span>
        <AppIcon name="ui-chevron-down" :class="['chevron-toggle', { 'chevron-toggle--open': recordsOpen }]" />
      </button>
      <p v-else class="csf-q">경력·성과 <small>{{ modelValue.records.length }}개</small></p>
      <template v-if="mode === 'edit' || recordsOpen">
        <p class="csf-hint">계획에는 넣지 않고 모아 둬요. 나중에 포트폴리오에 쓸 수 있어요</p>
        <CareerRecordsEditor :model-value="modelValue.records" @update:model-value="patch({ records: $event })" />
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import CareerRecordsEditor from './CareerRecordsEditor.vue'
import { SCHOOL_OPTIONS, YEAR_OPTIONS, atCollege } from '../composables/useCareerProfile'
import { asksRelated, haveCandidates, isHad, sameHave, withoutHave, type HaveTarget } from '../lib/situation'
import type { JobPreparation } from '@/modules/encyclopedia/types/encyclopedia'
import type { CareerProfile, CareerSchool } from '../types/career-design'

const props = defineProps<{
  modelValue: CareerProfile
  prep?: JobPreparation | null      // 목표 직업의 예시 계획 — 학과 질문·'이미 해 둔 것' 목록
  jobCode?: string                  // 목표 직업(관련 학과 답을 이 직업에 저장한다)
  jobTitle?: string
  mode: 'step' | 'edit'
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: CareerProfile): void }>()

const patch = (p: Partial<CareerProfile>) => emit('update:modelValue', { ...props.modelValue, ...p })

// 학교를 바꾸면 그 단계에 없는 칸을 비운다(고등학생에게 학년·학과는 없다)
function setSchool(school: CareerSchool) {
  const next: CareerProfile = { ...props.modelValue, school }
  if (school !== 'college') delete next.year
  else if (!next.year) next.year = 1
  if (!atCollege(school)) delete next.major
  emit('update:modelValue', next)
}

// ── 관련 학과 ──
const showRelated = computed(() => !!props.prep && !!props.jobCode && asksRelated(props.prep) && atCollege(props.modelValue.school))
const related = computed(() => !!props.jobCode && props.modelValue.relatedJobs.some((j) => j.jobCode === props.jobCode))
function setRelated(on: boolean) {
  if (!props.jobCode) return
  const rest = props.modelValue.relatedJobs.filter((j) => j.jobCode !== props.jobCode)
  patch({ relatedJobs: on ? [...rest, { jobCode: props.jobCode, name: props.jobTitle ?? '' }] : rest })
}
const otherRelated = computed(() => props.modelValue.relatedJobs.filter((j) => j.jobCode !== props.jobCode))
const removeRelated = (code: string) => patch({ relatedJobs: props.modelValue.relatedJobs.filter((j) => j.jobCode !== code) })

// ── 이미 해 둔 것 ──
const candidates = computed(() => (props.prep ? haveCandidates(props.prep) : []))
// 옛 열쇠로 저장된 것(필기·실기를 나누기 전)도 새 걸음으로 본다 — lib/situation.ts HAVE_ALIASES
const had = (c: HaveTarget) => isHad(props.modelValue.has, c, c.byNote)
// 끄면 이 걸음만 뺀다(옛 열쇠로 저장된 것은 남은 걸음을 새 열쇠로 풀어 둔다). 짝인 자격은 목록에 따로 있어 건드리지 않는다
function toggleHave(c: HaveTarget) {
  const has = props.modelValue.has
  patch({ has: had(c) ? withoutHave(has, { ...c, pair: undefined }) : [...has, { ref: c.key, name: c.label }] })
}
const otherHas = computed(() => props.modelValue.has.filter((h) => !candidates.value.some((c) => sameHave(h, c))))
const removeHas = (h: CareerProfile['has'][number]) => patch({ has: props.modelValue.has.filter((x) => !(x.ref === h.ref && x.name === h.name)) })

// 진로계획 단계에서는 경력·성과를 접어 둔다(선택 입력). 이미 적은 것이 있으면 펼친다
const recordsOpen = ref(props.mode === 'edit' || props.modelValue.records.length > 0)
</script>

<style lang="scss">
.csf {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.csf-card { background: #fff; border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.csf-q {
  display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px;
  font-size: 14px; font-weight: 700; color: #222; line-height: 1.45; word-break: keep-all;
  small { font-size: 11.5px; font-weight: 600; color: #999; }
  &--sm { font-size: 12.5px; color: #666; }
}
.csf-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.csf-chip {
  padding: 7px 12px; border: 1.5px solid #E6E8EC; border-radius: 999px; background: #fff;
  font-family: inherit; font-size: 13px; font-weight: 600; line-height: 1.3; color: #666; cursor: pointer;
  &--num { min-width: 44px; }
  &.is-on { border-color: #222; background: #222; color: #fff; }
  &:focus-visible { outline: 2px solid #FFC700; outline-offset: 2px; }
}
.csf-field {
  display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #666;
  input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1.5px solid #E6E8EC; border-radius: 10px; font-family: inherit; font-size: 14px; color: #222; background: #fff; }
  input:focus { outline: none; border-color: #FFC700; }
}
.csf-seg {
  display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
  button { padding: 11px; border: 1.5px solid #E6E8EC; border-radius: 12px; background: #fff; font-family: inherit; font-size: 14px; font-weight: 700; color: #666; cursor: pointer; }
  button.is-on { border-color: #FFC700; background: #FFF8DC; color: #8A6400; }
  button:focus-visible { outline: 2px solid #222; outline-offset: 2px; }
}
.csf-checks { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.csf-check {
  width: 100%; display: flex; align-items: center; gap: 10px; padding: 11px 12px; border: 0; border-radius: 10px; background: #FAFAFA;
  font-family: inherit; font-size: 13.5px; font-weight: 600; color: #333; text-align: left; cursor: pointer;
  &__box { flex: none; width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid #CFD3D9; background: #fff; display: grid; place-items: center; }
  &.is-on &__box { background: #FFC700; border-color: #FFC700; }
  &.is-on &__box::after { content: ''; width: 9px; height: 5px; border-left: 2px solid #fff; border-bottom: 2px solid #fff; transform: rotate(-45deg) translate(1px, -1px); }
  &:focus-visible { outline: 2px solid #FFC700; outline-offset: 2px; }
}
.csf-pills {
  list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px;
  li { display: inline-flex; align-items: center; gap: 2px; padding: 5px 4px 5px 11px; border-radius: 999px; background: #FAFAFA; border: 1px solid #ECEEF1; font-size: 12.5px; font-weight: 600; color: #333; }
  button { width: 24px; height: 24px; border: 0; background: none; color: #999; font-size: 15px; line-height: 1; cursor: pointer; border-radius: 50%; }
  button:focus-visible { outline: 2px solid #FFC700; }
}
.csf-fold {
  display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 0; border: 0; background: none; font-family: inherit; cursor: pointer; text-align: left;
  .app-icon { color: #B0B0B0; }
}
.csf-hint { font-size: 12px; color: #999; line-height: 1.5; }
</style>

<template>
  <!-- 이번 주 기록 재기(2026-11-21 루틴 리뉴얼 정할 것 4) — 기준 넘기·실력 올리기 루틴의 주 1회 기록. 완료와 따로, 한 주에 한 번 -->
  <article class="rmc" :aria-label="`이번 주 기록 재기 · ${title}`">
    <div class="rmc__head">
      <span class="rmc__chip"><AppIcon name="ui-repeat" /></span>
      <div class="rmc__head-text">
        <strong class="rmc__title">이번 주 기록 재기</strong>
        <span class="rmc__sub">{{ title }} · {{ measure.label }}</span>
      </div>
    </div>

    <p v-if="record && !editing" class="rmc__saved">
      <span>이번 주 <strong>{{ formatMeasure(record.value, measure, record.total) }}</strong></span>
      <button v-if="measure.unit !== 'media'" type="button" class="rmc__link" @click="startEdit">고치기</button>
    </p>

    <template v-else>
      <!-- 녹음·영상은 했는지만 남긴다(파일은 받지 않는다) -->
      <button v-if="measure.unit === 'media'" type="button" class="rmc__save rmc__save--wide" :disabled="busy" @click="save(null)">
        {{ measure.label }} 남겼어요
      </button>
      <form v-else class="rmc__form" @submit.prevent="submit">
        <template v-if="measure.unit === 'time'">
          <input v-model="min" class="rmc__input" inputmode="numeric" placeholder="0" aria-label="분" maxlength="3" />
          <span class="rmc__sep">분</span>
          <input v-model="sec" class="rmc__input" inputmode="numeric" placeholder="00" aria-label="초" maxlength="2" />
          <span class="rmc__sep">초</span>
        </template>
        <!-- 푼 수 / 전체(코딩 — 테스트마다 문제 수가 달라요) -->
        <template v-else-if="measure.unit === 'ratio'">
          <input v-model="num" class="rmc__input" inputmode="numeric" placeholder="0" aria-label="푼 문제 수" maxlength="3" />
          <span class="rmc__sep">/</span>
          <input v-model="total" class="rmc__input" inputmode="numeric" placeholder="0" aria-label="전체 문제 수" maxlength="3" />
          <span class="rmc__sep">문제</span>
        </template>
        <template v-else>
          <input v-model="num" class="rmc__input rmc__input--wide" inputmode="decimal" :aria-label="measure.label" />
          <span v-if="unitWord" class="rmc__sep">{{ unitWord }}</span>
        </template>
        <button type="submit" class="rmc__save" :disabled="busy || value === null">저장</button>
      </form>
      <p v-if="failed" class="rmc__error" role="alert">저장하지 못했어요. 잠시 뒤 다시 해 주세요.</p>
    </template>

    <p class="rmc__foot">
      <template v-if="prev">지난주 {{ formatMeasure(prev.value, measure, prev.total) }}</template>
      <template v-if="prev && caution"> · </template>
      <template v-if="caution">{{ caution }}</template>
    </p>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { formatMeasure, timeFromParts } from '@/modules/career-design/lib/routine'
import type { RoutineMeasure, RoutineRecord } from '@/modules/career-design/types/career-design'

const props = defineProps<{
  title: string                       // 함께 하는 프로젝트(없으면 루틴 이름)
  measure: RoutineMeasure
  record: RoutineRecord | null        // 이번 주 기록
  prev: RoutineRecord | null          // 지난 기록
  caution?: string | null             // 기준 넘기 — '기준은 응시하는 해 공고에서 확인해요'
  onSave: (value: number | null, total?: number) => Promise<boolean>
}>()

const editing = ref(false)
const busy = ref(false)
const failed = ref(false)
const min = ref('')
const sec = ref('')
const num = ref('')
const total = ref('')
const unitWord = computed(() => props.measure.suffix ?? (props.measure.unit === 'count' ? '회' : ''))

const value = computed<number | null>(() => {
  if (props.measure.unit === 'time') return timeFromParts(min.value, sec.value)
  const n = Number(num.value)
  if (props.measure.unit === 'ratio') {
    const t = Number(total.value)
    return num.value.trim() !== '' && Number.isInteger(n) && Number.isInteger(t) && t > 0 && n >= 0 && n <= t ? n : null
  }
  return num.value.trim() !== '' && Number.isFinite(n) && n >= 0 ? n : null
})
function startEdit() {
  const v = props.record?.value
  if (props.measure.unit === 'time' && typeof v === 'number') { min.value = String(Math.floor(v / 60)); sec.value = String(v % 60).padStart(2, '0') }
  else if (typeof v === 'number') { num.value = String(v); total.value = props.record?.total ? String(props.record.total) : '' }
  editing.value = true
}
async function save(v: number | null) {
  busy.value = true
  failed.value = false
  const ok = await props.onSave(v, props.measure.unit === 'ratio' ? Number(total.value) : undefined)
  busy.value = false
  if (ok) editing.value = false
  else failed.value = true
}
function submit() {
  if (value.value !== null) void save(value.value)
}
</script>

<style scoped lang="scss">
.rmc {
  display: flex; flex-direction: column; gap: 10px;
  padding: 14px; border-radius: 16px; background: #fff; border: 1px solid #DCE6FA;
  &__head { display: flex; align-items: center; gap: 10px; }
  &__chip { flex: none; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; background: #E6F0FF; color: #3B6FD8; font-size: 18px; }
  &__head-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  &__title { font-size: 15px; font-weight: 700; color: #1E3A6E; }
  &__sub { font-size: 12.5px; color: #5A6B8C; overflow-wrap: anywhere; }
  &__form { display: flex; align-items: center; gap: 6px; }
  &__input {
    width: 56px; padding: 10px 8px; border: 1.5px solid #DCE0E6; border-radius: 10px; text-align: center;
    font-family: inherit; font-size: 17px; font-weight: 700; font-variant-numeric: tabular-nums; color: #222;
    &--wide { width: 96px; }
    &:focus { outline: none; border-color: #3B6FD8; }
  }
  &__sep { font-size: 13px; color: #666; margin-right: 4px; }
  &__save {
    margin-left: auto; padding: 10px 18px; border: 0; border-radius: 10px; background: #3B6FD8; color: #fff;
    font-family: inherit; font-size: 14px; font-weight: 700; cursor: pointer;
    &:disabled { background: #C9D6EE; cursor: default; }
    &--wide { margin-left: 0; width: 100%; }
  }
  &__saved { display: flex; align-items: center; justify-content: space-between; font-size: 13.5px; color: #333; strong { margin-left: 4px; font-size: 16px; font-variant-numeric: tabular-nums; } }
  &__link { border: 0; background: none; padding: 4px; font-family: inherit; font-size: 12.5px; font-weight: 700; color: #3B6FD8; cursor: pointer; }
  &__error { font-size: 12px; color: #B42318; }
  &__foot { font-size: 12px; color: #7B8BA8; word-break: keep-all; &:empty { display: none; } }
}
</style>

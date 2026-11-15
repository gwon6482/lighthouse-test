<template>
  <!-- 경력·성과 목록과 더하기·고치기(2026-11-16) — 계획에는 반영하지 않고 모아 둔다(나중에 포트폴리오). 내 진로상황 단계·마이페이지가 같이 쓴다 -->
  <div class="cre">
    <ul v-if="modelValue.length" class="cre__list">
      <li v-for="r in modelValue" :key="r.id" class="cre__item">
        <span class="cre__kind">{{ recordKindLabel(r.kind) }}</span>
        <span class="cre__main">
          <b>{{ r.title }}</b>
          <small v-if="period(r) || r.detail">{{ [period(r), r.detail].filter(Boolean).join(' · ') }}</small>
        </span>
        <button type="button" class="cre__edit" @click="edit(r)">고치기</button>
      </li>
    </ul>

    <div v-if="formOpen" class="cre__form">
      <div class="cre__kinds" role="group" aria-label="종류">
        <button
          v-for="k in RECORD_KINDS"
          :key="k.value"
          type="button"
          :class="['cre__chip', { 'is-on': draft.kind === k.value }]"
          :aria-pressed="draft.kind === k.value"
          @click="draft.kind = k.value"
        >{{ k.label }}</button>
      </div>
      <label class="cre__field">
        <span>이름</span>
        <input :id="`cre-title-${uid}`" v-model="draft.title" maxlength="80" placeholder="예: 토익 785점, 카페 아르바이트" />
      </label>
      <div class="cre__field">
        <span>기간·날짜 (선택)</span>
        <div class="cre__period">
          <input :id="`cre-start-${uid}`" v-model="draft.start" inputmode="decimal" maxlength="7" placeholder="2025.07" aria-label="시작" />
          <i>~</i>
          <input :id="`cre-end-${uid}`" v-model="draft.end" inputmode="decimal" maxlength="7" placeholder="끝(선택)" aria-label="끝" />
        </div>
      </div>
      <label class="cre__field">
        <span>한 줄 설명 (선택)</span>
        <input :id="`cre-detail-${uid}`" v-model="draft.detail" maxlength="200" placeholder="어떤 일을 했는지" />
      </label>
      <p class="cre__hint">다른 사람의 이름·연락처나 건강 정보는 적지 말아 주세요</p>
      <p v-if="error" class="cre__error">{{ error }}</p>
      <div class="cre__actions">
        <button v-if="editingId" type="button" class="cre__del" @click="removeEditing">지우기</button>
        <button type="button" class="cre__cancel" @click="closeForm">취소</button>
        <button type="button" class="cre__save" @click="commit">{{ editingId ? '고치기' : '추가' }}</button>
      </div>
    </div>
    <button v-else-if="modelValue.length < MAX" type="button" class="cre__add" @click="openNew">+ 추가하기</button>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { RECORD_KINDS, recordKindLabel } from '../composables/useCareerProfile'
import type { CareerRecord, CareerRecordKind } from '../types/career-design'

const props = defineProps<{ modelValue: CareerRecord[] }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: CareerRecord[]): void }>()

const MAX = 50   // 서버 한도(services/careerProfile.js)
const uid = Math.random().toString(36).slice(2, 8)
const formOpen = ref(false)
const editingId = ref<string | null>(null)
const error = ref('')
const draft = reactive<{ kind: CareerRecordKind; title: string; start: string; end: string; detail: string }>({ kind: 'work', title: '', start: '', end: '', detail: '' })

// '2025' · '2025.7' · '2025-07' · '202507' → '2025.07'. 비우면 ''. 알아볼 수 없으면 null
function normDate(v: string): string | null {
  const s = v.trim()
  if (!s) return ''
  const m = s.match(/^(\d{4})(?:[.\-/ ]?(\d{1,2}))?$/)
  if (!m) return null
  if (!m[2]) return m[1]!
  const mm = Number(m[2])
  return mm >= 1 && mm <= 12 ? `${m[1]}.${String(mm).padStart(2, '0')}` : null
}
const period = (r: CareerRecord) => (r.start && r.end ? `${r.start} ~ ${r.end}` : r.start || r.end || '')

function fill(r?: CareerRecord) {
  draft.kind = r?.kind ?? 'work'
  draft.title = r?.title ?? ''
  draft.start = r?.start ?? ''
  draft.end = r?.end ?? ''
  draft.detail = r?.detail ?? ''
  error.value = ''
}
function openNew() { editingId.value = null; fill(); formOpen.value = true }
function edit(r: CareerRecord) { editingId.value = r.id; fill(r); formOpen.value = true }
function closeForm() { formOpen.value = false; editingId.value = null; error.value = '' }

function commit() {
  const title = draft.title.trim()
  if (!title) { error.value = '이름을 적어 주세요'; return }
  const start = normDate(draft.start)
  const end = normDate(draft.end)
  if (start === null || end === null) { error.value = '기간은 2025.07처럼 적어 주세요'; return }
  const rec: CareerRecord = { id: editingId.value ?? `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, kind: draft.kind, title, start, end, detail: draft.detail.trim() }
  const next = editingId.value ? props.modelValue.map((r) => (r.id === editingId.value ? rec : r)) : [...props.modelValue, rec]
  emit('update:modelValue', next)
  closeForm()
}
function removeEditing() {
  if (!editingId.value) return
  emit('update:modelValue', props.modelValue.filter((r) => r.id !== editingId.value))
  closeForm()
}
</script>

<style lang="scss">
.cre {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
  &__item { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 10px; background: #FAFAFA; }
  &__kind { font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 999px; background: #ECEEF1; color: #555; white-space: nowrap; }
  &__main { min-width: 0; display: flex; flex-direction: column; gap: 1px; b { font-size: 13px; font-weight: 600; color: #333; overflow-wrap: anywhere; } small { font-size: 11.5px; color: #999; } }
  &__edit { border: 0; background: none; font-family: inherit; font-size: 12px; font-weight: 700; color: #1D6FD8; cursor: pointer; padding: 4px; }
  &__add { align-self: flex-start; border: 0; background: none; padding: 4px 0; font-family: inherit; font-size: 13px; font-weight: 700; color: #1D6FD8; cursor: pointer; }

  &__form { display: flex; flex-direction: column; gap: 10px; padding: 12px; border: 1.5px solid #E6E8EC; border-radius: 12px; }
  &__kinds { display: flex; flex-wrap: wrap; gap: 6px; }
  &__chip {
    padding: 6px 11px; border: 1.5px solid #E6E8EC; border-radius: 999px; background: #fff;
    font-family: inherit; font-size: 12px; font-weight: 600; color: #666; cursor: pointer;
    &.is-on { border-color: #222; background: #222; color: #fff; }
    &:focus-visible { outline: 2px solid #FFC700; outline-offset: 2px; }
  }
  &__field {
    display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #666;
    input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1.5px solid #E6E8EC; border-radius: 10px; font-family: inherit; font-size: 14px; color: #222; background: #fff; }
    input:focus { outline: none; border-color: #FFC700; }
  }
  &__period { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 6px; i { font-style: normal; color: #aaa; } }
  &__hint { font-size: 11.5px; color: #999; }
  &__error { font-size: 12px; color: #E05050; }
  &__actions { display: flex; justify-content: flex-end; gap: 8px; }
  &__del, &__cancel, &__save { border: 0; border-radius: 10px; padding: 9px 14px; font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
  &__del { margin-right: auto; background: none; color: #E05050; padding-left: 0; }
  &__cancel { background: #F2F3F5; color: #555; }
  &__save { background: #FFC700; color: #fff; }
}
</style>

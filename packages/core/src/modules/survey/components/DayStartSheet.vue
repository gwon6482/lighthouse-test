<template>
  <!-- 하루 시작 시간 고르기(2026-11-26 #102) — 마이 > 설정. 하나만 고르니 동그라미. 바꾸면 다음 하루부터 적용(서버가 시점을 정한다) -->
  <Teleport to="body">
    <div v-if="modelValue" class="dss" @click.self="close" @keydown.esc="close">
      <div class="dss__sheet" role="dialog" aria-modal="true" aria-labelledby="dss-title" aria-describedby="dss-desc">
        <p id="dss-title" class="dss__title">하루 시작 시간</p>
        <p id="dss-desc" class="dss__desc">이 시각 전까지는 전날의 하루로 봐요</p>
        <div class="dss__opts" role="radiogroup" aria-labelledby="dss-title">
          <label v-for="h in DAY_START_HOURS" :key="h" class="dss__opt" :class="{ 'dss__opt--on': choice === h }">
            <input v-model="choice" type="radio" name="day-start" :value="h" class="dss__radio" />
            <span class="dss__label">{{ dayStartLabel(h) }}</span>
            <span v-if="h === DEFAULT_DAY_START_HOUR" class="dss__tag">기본</span>
          </label>
        </div>
        <p v-if="failed" class="dss__error" role="alert">저장하지 못했어요. 잠시 뒤 다시 해 주세요.</p>
        <button type="button" class="dss__ok" :disabled="busy" @click="save">저장</button>
        <button type="button" class="dss__cancel" @click="close">취소</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { DAY_START_HOURS, DEFAULT_DAY_START_HOUR, dayStartLabel } from '@/shared/utils/appDay'

const props = defineProps<{ modelValue: boolean; hour: number; onSave: (hour: number) => Promise<boolean> }>()
const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const choice = ref(props.hour)
const busy = ref(false)
const failed = ref(false)
watch(() => props.modelValue, (open) => {
  if (open) { choice.value = props.hour; failed.value = false }
})

function close() {
  emit('update:modelValue', false)
}
async function save() {
  if (choice.value === props.hour) { close(); return }
  busy.value = true
  failed.value = false
  const ok = await props.onSave(choice.value)
  busy.value = false
  if (ok) close()
  else failed.value = true
}
</script>

<style lang="scss" scoped>
.dss {
  position: fixed; inset: 0; z-index: 1000; display: flex; align-items: flex-end; justify-content: center; background: rgba(0, 0, 0, 0.45);
  &__sheet { width: 100%; max-width: 480px; max-height: 92vh; overflow-y: auto; padding: 24px 20px calc(20px + env(safe-area-inset-bottom)); border-radius: 20px 20px 0 0; background: #fff; }
  &__title { margin: 0 0 6px; font-size: 17px; font-weight: 700; color: #111; }
  &__desc { margin: 0 0 14px; font-size: 13.5px; line-height: 1.55; color: #666; }
  &__opts { display: flex; flex-direction: column; gap: 6px; }
  &__opt { display: flex; align-items: center; gap: 10px; padding: 11px 14px; border: 1.5px solid #E6E8EC; border-radius: 12px; cursor: pointer; &--on { border-color: #3B6FD8; background: #F4F8FF; } }
  &__radio { margin: 0; width: 18px; height: 18px; accent-color: #3B6FD8; }
  &__label { flex: 1; font-size: 15px; color: #222; }
  &__tag { font-size: 12px; color: #888; }
  &__error { margin: 10px 0 0; font-size: 12.5px; color: #B42318; }
  &__ok { width: 100%; margin-top: 16px; padding: 14px; border: 0; border-radius: 12px; background: #FFC700; font-size: 15px; font-weight: 700; font-family: inherit; color: #222; cursor: pointer; &:disabled { opacity: 0.6; } }
  &__cancel { width: 100%; margin-top: 8px; padding: 13px; border: 0; border-radius: 12px; background: #f1f2f4; font-size: 14px; font-family: inherit; color: #555; cursor: pointer; }
}
</style>

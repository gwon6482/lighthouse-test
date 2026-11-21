<template>
  <!-- 붙은 프로젝트가 끝났을 때(2026-11-21 루틴 리뉴얼 정할 것 2) — 루틴만 덩그러니 남지 않게 한 번 묻는다 -->
  <div class="res" role="dialog" aria-modal="true" aria-labelledby="res-title" @click.self="$emit('close')">
    <div class="res__panel">
      <button type="button" class="res__close" aria-label="닫기" @click="$emit('close')"><AppIcon name="ui-close" /></button>
      <h2 id="res-title" class="res__title">{{ project.name }}{{ ended }}</h2>
      <p class="res__desc">함께 하던 ‘{{ routine.name }}’{{ josa(routine.name, '은') }} 어떻게 할까요?</p>

      <div class="res__opts" role="radiogroup" aria-label="루틴을 어떻게 할까요">
        <label class="res__opt" :class="{ 'res__opt--on': choice === 'keep' }">
          <input v-model="choice" type="radio" value="keep" class="res__radio" />
          <span class="res__opt-text">
            <strong>감 유지로 바꾸기</strong>
            <span>{{ keepLine }}</span>
          </span>
        </label>
        <label class="res__opt" :class="{ 'res__opt--on': choice === 'end' }">
          <input v-model="choice" type="radio" value="end" class="res__radio" />
          <span class="res__opt-text">
            <strong>끝내기</strong>
            <span>지금까지 기록은 남아요</span>
          </span>
        </label>
      </div>

      <p v-if="failed" class="res__error" role="alert">저장하지 못했어요. 잠시 뒤 다시 해 주세요.</p>
      <button type="button" class="res__go" :disabled="busy" @click="decide">정하기</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { daysSummary, keepVersion } from '@/modules/career-design/lib/routine'
import type { Project, Routine } from '@/modules/career-design/types/career-design'

const props = defineProps<{ routine: Routine; project: Project; onDecide: (choice: 'keep' | 'end') => Promise<boolean> }>()
defineEmits<{ close: [] }>()

const choice = ref<'keep' | 'end'>('keep')
const busy = ref(false)
const failed = ref(false)
const ended = computed(() => (props.project.stoppedAt
  ? `${josa(props.project.name, '을')} 그만뒀어요`
  : `${josa(props.project.name, '이')} 끝났어요`))
const keepLine = computed(() => {
  const k = keepVersion(props.routine)
  return `${daysSummary(k.days)} · ${k.duration}분 · 기록 재기 없이`
})
// 받침에 맞춘 조사 — 괄호·기호 뒤면 마지막 한글로 본다('…(오픽·토익스피킹)이')
function josa(w: string, pair: '을' | '이' | '은'): string {
  const ch = w.match(/[가-힣](?=[^가-힣]*$)/)?.[0]
  const has = !!ch && (ch.charCodeAt(0) - 0xac00) % 28 !== 0
  if (pair === '을') return has ? '을' : '를'
  if (pair === '은') return has ? '은' : '는'
  return has ? '이' : '가'
}
async function decide() {
  busy.value = true
  failed.value = false
  const ok = await props.onDecide(choice.value)
  busy.value = false
  if (!ok) failed.value = true
}
</script>

<style scoped lang="scss">
.res {
  position: fixed; inset: 0; z-index: 60; display: flex; align-items: flex-end; justify-content: center; background: rgba(0, 0, 0, 0.4);
  &__panel { position: relative; width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 12px; padding: 24px 20px calc(20px + env(safe-area-inset-bottom)); border-radius: 20px 20px 0 0; background: #fff; }
  &__close { position: absolute; top: 14px; right: 14px; border: 0; background: none; padding: 6px; font-size: 18px; color: #999; cursor: pointer; }
  &__title { margin: 0; padding-right: 32px; font-size: 19px; font-weight: 800; color: #222; word-break: keep-all; }
  &__desc { margin: 0; font-size: 14px; color: #555; }
  &__opts { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
  &__opt { display: flex; align-items: flex-start; gap: 10px; padding: 14px; border: 1.5px solid #E6E8EC; border-radius: 14px; cursor: pointer; &--on { border-color: #3B6FD8; background: #F4F8FF; } }
  &__radio { margin-top: 3px; width: 18px; height: 18px; accent-color: #3B6FD8; }
  &__opt-text { display: flex; flex-direction: column; gap: 3px; strong { font-size: 15px; color: #222; } span { font-size: 12.5px; color: #777; } }
  &__error { margin: 0; font-size: 12.5px; color: #B42318; }
  &__go { margin-top: 4px; padding: 16px; border: 0; border-radius: 14px; background: #FFC700; font-family: inherit; font-size: 16px; font-weight: 700; color: #fff; cursor: pointer; &:disabled { opacity: 0.6; } }
}
</style>

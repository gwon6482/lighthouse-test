<template>
  <!-- 끝낸 줄을 누르면 뜨는 작은 메뉴(#101, 2026-11-26 오너 '(다)') — 기록 보기 · 다시 집중하기 · 완료 취소.
       모양은 공용 확인 시트(ConfirmSheet)와 같은 아래 시트. '완료 취소'는 확인 판을 한 번 더 거친다(부르는 쪽) -->
  <Teleport to="body">
    <div v-if="open" class="dms" @click.self="emit('close')" @keydown.esc="emit('close')">
      <div class="dms__sheet" role="dialog" aria-modal="true" aria-labelledby="dms-title">
        <p id="dms-title" class="dms__title">{{ name }}</p>
        <p v-if="sub" class="dms__sub">{{ sub }}</p>
        <ul class="dms__list">
          <li v-if="canView">
            <button ref="firstEl" type="button" class="dms__row" @click="emit('view')">
              <AppIcon name="ui-views" /><span class="dms__label">기록 보기</span><small>로그</small>
            </button>
          </li>
          <li v-if="canRefocus">
            <button type="button" class="dms__row" @click="emit('refocus')">
              <AppIcon name="ui-duration" /><span class="dms__label">다시 집중하기</span><small>시간이 더해져요</small>
            </button>
          </li>
          <li>
            <button type="button" class="dms__row dms__row--danger" @click="emit('undo')">
              <AppIcon name="ui-close" /><span class="dms__label">완료 취소</span>
            </button>
          </li>
        </ul>
        <button type="button" class="dms__close" @click="emit('close')">닫기</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'

const props = withDefaults(defineProps<{ open: boolean; name: string; sub?: string; canView?: boolean; canRefocus?: boolean }>(), { sub: '', canView: true, canRefocus: true })
const emit = defineEmits<{ view: []; refocus: []; undo: []; close: [] }>()

// 열리면 첫 줄에 초점, 닫히면 연 자리로(ConfirmSheet 와 같게)
const firstEl = ref<HTMLButtonElement | null>(null)
let opener: HTMLElement | null = null
watch(() => props.open, async (v) => {
  if (v) {
    opener = document.activeElement as HTMLElement | null
    await nextTick()
    firstEl.value?.focus()
  } else {
    opener?.focus?.()
    opener = null
  }
})
</script>

<style lang="scss" scoped>
.dms {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);

  &__sheet {
    width: 100%;
    max-width: 480px;
    padding: 22px 20px calc(20px + env(safe-area-inset-bottom));
    border-radius: 20px 20px 0 0;
    background: #fff;
  }
  &__title { margin: 0; font-size: 17px; font-weight: 700; color: #111; }
  &__sub { margin: 4px 0 0; font-size: 13px; color: #888; }
  &__list { list-style: none; margin: 14px 0 0; padding: 0; border-top: 1px solid #f0f0f0; }
  &__row {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 15px 2px;
    border: 0;
    border-bottom: 1px solid #f0f0f0;
    background: none;
    font: inherit;
    font-size: 15px;
    color: #222;
    text-align: left;
    cursor: pointer;
    :deep(svg) { width: 18px; height: 18px; color: #666; }
    small { margin-left: auto; font-size: 12.5px; color: #999; }
    &--danger { color: #D93636; :deep(svg) { color: #D93636; } }
  }
  &__label { font-weight: 600; }
  &__close {
    width: 100%;
    margin-top: 14px;
    padding: 13px;
    border: 0;
    border-radius: 12px;
    background: #f1f2f4;
    font: inherit;
    font-size: 14px;
    color: #555;
    cursor: pointer;
  }
}
</style>

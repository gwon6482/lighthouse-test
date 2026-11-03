<template>
  <!-- 진로계획 단계 표시 — '2/6 · 속도'(새 계획) / '수정 2/5 · 타임라인'(수정). 흐름은 useDesignSteps -->
  <div v-if="info" class="cd-step">
    <span class="cd-step__label">{{ info.editing ? '수정 ' : '' }}{{ info.no }}/{{ info.total }} · {{ info.label }}</span>
    <span class="cd-step__dots" aria-hidden="true">
      <i v-for="n in info.total" :key="n" :class="{ on: n <= info.no }" />
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDesignSteps, type DesignStepKey } from '../composables/useDesignSteps'

const props = defineProps<{ step: DesignStepKey }>()
const { stepInfo } = useDesignSteps()
const info = computed(() => stepInfo(props.step))
</script>

<style lang="scss">
.cd-step {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 20px;
  background: #FFF8D6;
  font-size: 12px;
  font-weight: 600;
  color: #6B5300;

  &__dots { display: flex; gap: 4px; }
  &__dots i { width: 14px; height: 4px; border-radius: 2px; background: rgba(0, 0, 0, 0.12); }
  &__dots i.on { background: #1a1a1a; }
}
</style>

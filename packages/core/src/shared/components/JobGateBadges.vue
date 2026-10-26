<template>
  <span v-if="shown.length" class="gate-badges" :class="`gate-badges--${size}`">
    <span
      v-for="b in shown"
      :key="b.key"
      class="gate-badge"
      :class="{ 'gate-badge--light': light }"
      :style="{ color: b.color, background: b.bg }"
      :title="b.desc"
    >
      <!-- 아이콘: 사용자 SVG 가 오면 gateBadges.ts 의 icon 만 채우면 된다 -->
      <img v-if="b.icon" class="gate-badge__icon" :src="b.icon" alt="" aria-hidden="true" />
      <span v-else class="gate-badge__icon" aria-hidden="true">{{ b.emoji }}</span>
      <span class="gate-badge__label">{{ b.label }}</span>
    </span>
  </span>
</template>

<script setup lang="ts">
// 직업 진입 관문 배지(최대 max 개). 관문 없는 직업은 아무것도 그리지 않는다.
import { computed } from 'vue'
import { gateBadge, sortGateBadges, type GateBadgeKey } from '@/shared/jobGates/gateBadges'
import { gateOf } from '@/shared/jobGates/useJobGate'

const props = withDefaults(defineProps<{ jobCode?: string | null; badges?: GateBadgeKey[]; max?: number; size?: 'sm' | 'md' }>(), {
  max: 2,
  size: 'sm',
})
const gate = computed(() => gateOf(props.jobCode))
const shown = computed(() => sortGateBadges(props.badges ?? gate.value?.badges ?? []).slice(0, props.max).map(gateBadge))
// 가벼운 면허(미용사·지게차 등)는 같은 배지를 조금 옅게
const light = computed(() => gate.value?.weight === 'light')
</script>

<style scoped lang="scss">
.gate-badges { display: inline-flex; flex-wrap: wrap; gap: 4px; vertical-align: middle; }
.gate-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.5;
  white-space: nowrap;

  &--light { opacity: 0.7; }
}
.gate-badge__icon { display: inline-grid; place-items: center; width: 1.15em; height: 1.15em; font-size: 0.95em; }
img.gate-badge__icon { object-fit: contain; }
.gate-badges--md .gate-badge { padding: 3px 9px; font-size: 12px; }
</style>

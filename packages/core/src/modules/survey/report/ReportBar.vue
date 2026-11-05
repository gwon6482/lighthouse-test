<template>
  <div class="rp-bar" :style="width ? { width: width + 'px' } : undefined">
    <div class="rp-bar__f" :style="{ width: pct(value) + '%', background: color }" />
    <div v-if="avg != null && width" class="rp-bar__avg" :style="{ left: avgLeft + 'px' }" />
  </div>
</template>

<script setup lang="ts">
/**
 * 0~1 값을 막대로. avg 를 주면 평균 위치에 검은 선.
 *
 * ⚠️ 평균선이 있는 막대는 `width`(정수 px)를 꼭 준다. 선 위치를 % 로 두면 픽셀 경계 사이에 걸려
 *    캡처할 때 선마다 굵기가 3~5px 로 제각각이 된다(2026-10-15 실제로 그랬다).
 *    정수 너비 × 반올림 위치 × 2px 굵기 → 모든 선이 같은 굵기로 또렷하다. 선의 **중심**이 평균이다.
 */
import { computed } from 'vue'
import { pct } from './reportUtil'

const AVG_W = 1 // 평균선 굵기(px) — report.scss 의 .rp-bar__avg width 와 같게

const props = defineProps<{ value: number; avg?: number | null; color: string; width?: number }>()
const avgLeft = computed(() => Math.round((props.avg ?? 0) * (props.width ?? 0)) - Math.floor(AVG_W / 2))
</script>

<template>
  <div class="mring" :style="{ width: size + 'px', height: size + 'px' }">
    <svg :viewBox="`0 0 ${size} ${size}`" :width="size" :height="size" aria-hidden="true">
      <circle :cx="c" :cy="c" :r="r" fill="none" :stroke="track" :stroke-width="stroke" />
      <circle
        :cx="c" :cy="c" :r="r" fill="none"
        :stroke="color" :stroke-width="stroke" stroke-linecap="round"
        :stroke-dasharray="`${dash} ${circ}`"
        :transform="`rotate(-90 ${c} ${c})`"
      />
    </svg>
    <div class="mring__label">
      <strong :style="{ color: textColor ?? color, fontSize: size * 0.3 + 'px' }">{{ pctValue }}<small :style="{ fontSize: size * 0.15 + 'px' }">%</small></strong>
      <span v-if="caption" :style="{ fontSize: Math.max(9, size * 0.12) + 'px' }">{{ caption }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 매칭도 원형 게이지 — '현재 직업과의 매칭도' 에서 퍼센트를 강조한다(화면 결과지·PDF 공용).
 * SVG 라 html-to-image 캡처와 서버 PDF(Chrome 인쇄) 모두에서 선명하다.
 */
import { computed } from 'vue'

const props = withDefaults(defineProps<{ value: number; color: string; size?: number; caption?: string; track?: string; /** 숫자 색 — 없으면 링 색 */ textColor?: string }>(), {
  size: 76, caption: '매칭도', track: '#ececec',
})
const stroke = computed(() => Math.round(props.size * 0.09))
const c = computed(() => props.size / 2)
const r = computed(() => (props.size - stroke.value) / 2)
const circ = computed(() => 2 * Math.PI * r.value)
const pctValue = computed(() => Math.round((props.value ?? 0) * 100))
const dash = computed(() => (Math.max(0, Math.min(100, pctValue.value)) / 100) * circ.value)
</script>

<style lang="scss" scoped>
.mring {
  position: relative;
  flex: none;

  svg { display: block; }

  &__label {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    line-height: 1;

    strong { font-weight: 800; letter-spacing: -0.02em; }
    small { margin-left: 1px; font-weight: 700; }
    span { margin-top: 3px; font-weight: 600; color: #767676; }  // 결과지 메타 회색
  }
}
</style>

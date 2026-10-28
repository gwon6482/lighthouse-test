<template>
  <section v-if="gate" class="gate-guide" :class="`gate-guide--${variant}`">
    <div class="gate-guide__head">
      <span class="gate-guide__title">{{ variant === 'plan' ? `${gate.title}${subjectJosa(gate.title)} 이렇게 준비해요` : '이 직업이 되려면' }}</span>
      <!-- 배지는 넣지 않는다 — 상세 헤더·각 항목에 이미 있다(2026-10-27 사용자) -->
    </div>

    <!-- 진로백과: 되는 길(조건·한 줄 설명·근거) -->
    <template v-if="variant === 'detail'">
      <ul class="gate-guide__conds">
        <li v-for="c in conditionLines" :key="c">{{ c }}</li>
      </ul>
      <p class="gate-guide__note">{{ gate.note }}</p>
    </template>

    <!-- 진로계획: 배지별로 강조할 것 -->
    <ul v-else class="gate-guide__tips">
      <li v-for="b in badges" :key="b.key">
        <span class="gate-guide__tip-key" :style="{ color: b.color }">
          <AppIcon :name="b.icon" /> {{ b.label }}
        </span>
        {{ b.guide }}
      </li>
    </ul>

    <p class="gate-guide__source">
      근거 · {{ gate.source }} · {{ GATE_CHECKED_AT }} 확인 · 제도는 바뀔 수 있어요
    </p>
  </section>
</template>

<script setup lang="ts">
// 진입 관문 안내 — detail(진로백과 직업 상세) / plan(진로계획 세우기 상단)
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import { gateBadge, sortGateBadges } from '@/shared/jobGates/gateBadges'
import { gateOf, gateConditionLines, GATE_CHECKED_AT } from '@/shared/jobGates/useJobGate'

const props = withDefaults(defineProps<{ jobCode?: string | null; variant?: 'detail' | 'plan' }>(), { variant: 'detail' })
const gate = computed(() => gateOf(props.jobCode))
const conditionLines = computed(() => (gate.value ? gateConditionLines(gate.value) : []))
const badges = computed(() => sortGateBadges(gate.value?.badges ?? []).map(gateBadge))
const subjectJosa = (w: string) => { const c = w.trim().slice(-1).charCodeAt(0) - 0xac00; return c < 0 || c > 11171 ? '은(는)' : c % 28 ? '은' : '는' }
</script>

<style scoped lang="scss">
.gate-guide {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border: 1px solid #ECE8DC;
  border-radius: 14px;
  background: #FFFDF6;
}
.gate-guide__head { display: flex; flex-direction: column; gap: 6px; }
.gate-guide__title { font-size: 15px; font-weight: 700; color: #222; }
.gate-guide__conds {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;

  li { padding: 4px 10px; border-radius: 8px; background: #fff; border: 1px solid #ECE8DC; font-size: 13px; font-weight: 600; color: #333; }
  li + li::before { content: none; }
}
.gate-guide__note { font-size: 14px; line-height: 1.6; color: #444; }
.gate-guide__tips {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 13px;
  line-height: 1.6;
  color: #444;
}
.gate-guide__tip-key { display: block; font-weight: 700; }
.gate-guide__source { font-size: 11px; color: #999; }
</style>

<template>
  <div class="dp-card">
    <div class="dp-ring">
      <svg viewBox="0 0 58 58">
        <circle cx="29" cy="29" r="24" fill="none" stroke="var(--dp-track)" stroke-width="5" />
        <circle
          cx="29" cy="29" r="24" fill="none"
          stroke="var(--dp-brand)" stroke-width="5" stroke-linecap="round"
          :stroke-dasharray="dashArray"
          transform="rotate(-90 29 29)"
        />
      </svg>
      <div class="dp-ring-label">
        <span class="dp-day">{{ dayCount }}</span>
        <span class="dp-day-unit">일차</span>
      </div>
    </div>

    <div class="dp-body">
      <div class="dp-top">
        <span class="dp-label">오늘의 달성률</span>
        <span class="dp-date">{{ date }}</span>
      </div>
      <div class="dp-figures">
        <span class="dp-pct">{{ pctLabel }}%</span>
        <span v-if="!isComplete" class="dp-frac">{{ done }} / {{ total }} 완료</span>
        <span v-else class="dp-done"><i class="ti ti-circle-check" aria-hidden="true"></i>다 했어요</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  dayCount: { type: Number, default: 1 },
  date: { type: String, default: '' },
  done: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
})

const CIRCUMFERENCE = 2 * Math.PI * 24
const pct = computed(() => (props.total ? props.done / props.total : 0))
const pctLabel = computed(() => Math.round(pct.value * 100))
const isComplete = computed(() => props.total > 0 && props.done === props.total)
const dashArray = computed(
  () => `${(CIRCUMFERENCE * pct.value).toFixed(1)} ${CIRCUMFERENCE.toFixed(1)}`,
)
</script>

<style scoped>
.dp-card {
  --dp-brand: #ffd100;
  --dp-track: #f6dca8;
  --dp-surface: #faeeda;
  --dp-label: #854f0b;
  --dp-date: #ba7517;
  --dp-num: #633806;
  --dp-day: #412402;
  --dp-done: #3b6d11;

  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--dp-surface);
  border-radius: 12px;
  padding: 16px;
}

.dp-ring {
  position: relative;
  width: 58px;
  height: 58px;
  flex-shrink: 0;
}
.dp-ring svg {
  width: 100%;
  height: 100%;
}
.dp-ring-label {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1;
}
.dp-day {
  font-size: 19px;
  font-weight: 500;
  color: var(--dp-day);
}
.dp-day-unit {
  font-size: 11px;
  color: var(--dp-num);
  margin-top: 1px;
}

.dp-body {
  flex: 1;
}
.dp-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.dp-label {
  font-size: 13px;
  color: var(--dp-label);
}
.dp-date {
  font-size: 12px;
  color: var(--dp-date);
}
.dp-figures {
  display: flex;
  align-items: baseline;
  gap: 7px;
}
.dp-pct {
  font-size: 24px;
  font-weight: 500;
  color: var(--dp-num);
}
.dp-frac {
  font-size: 13px;
  color: var(--dp-date);
}
.dp-done {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 13px;
  color: var(--dp-done);
}
.dp-done .ti {
  font-size: 15px;
  transform: translateY(1px);
}
</style>

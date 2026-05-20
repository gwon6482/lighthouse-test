<template>
  <div class="rjc" :class="`rjc--rank-${Math.min(rank, 4)}`" @click="emit('click')">
    <!-- 순위 배지 -->
    <div class="rjc__rank">
      <span class="rjc__rank-num">{{ rank }}</span>
    </div>

    <!-- 직업 정보 -->
    <div class="rjc__body">
      <p class="rjc__title">{{ job.title }}</p>
      <div class="rjc__tags">
        <span class="rjc__tag rjc__tag--primary">{{ job.classification.primary }}</span>
        <span class="rjc__sep">›</span>
        <span class="rjc__tag rjc__tag--secondary">{{ job.classification.secondary }}</span>
      </div>
    </div>

    <!-- 화살표 -->
    <div class="rjc__arrow">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { JobSummary } from '../../../types/encyclopedia'

defineProps<{
  job: JobSummary
  rank: number
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<style scoped>
.rjc {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: #fff;
  border-radius: 16px;
  cursor: pointer;
  transition: background 0.12s, transform 0.1s;
  border: 1px solid #EEEEED;
  margin-bottom: 8px;
}

.rjc:active {
  background: #F7F7F5;
  transform: scale(0.99);
}

/* ── 순위별 왼쪽 액센트 컬러 ── */
.rjc--rank-1 { border-left: 3.5px solid #F5A623; }
.rjc--rank-2 { border-left: 3.5px solid #9B9B9B; }
.rjc--rank-3 { border-left: 3.5px solid #CE8A5A; }
.rjc--rank-4 { border-left: 3.5px solid #E0E0E0; }

/* ── 순위 배지 ── */
.rjc__rank {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rjc--rank-1 .rjc__rank {
  background: linear-gradient(135deg, #FFD93D, #F5A623);
  box-shadow: 0 2px 8px rgba(245, 166, 35, 0.35);
}

.rjc--rank-2 .rjc__rank {
  background: linear-gradient(135deg, #E8E8E8, #B0B0B0);
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.rjc--rank-3 .rjc__rank {
  background: linear-gradient(135deg, #F0C090, #CE8A5A);
  box-shadow: 0 2px 6px rgba(206,138,90,0.3);
}

.rjc--rank-4 .rjc__rank {
  background: #F0F0EE;
}

.rjc__rank-num {
  font-size: 13px;
  font-weight: 800;
  line-height: 1;
  color: #fff;
}

.rjc--rank-4 .rjc__rank-num {
  color: #AAAAAA;
}

/* ── 직업 정보 ── */
.rjc__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.rjc__title {
  font-size: 15.5px;
  font-weight: 700;
  color: #1A1A2E;
  margin: 0;
  letter-spacing: -0.2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rjc__tags {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.rjc__tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 6px;
}

.rjc__tag--primary {
  background: #EEF2FF;
  color: #4F46E5;
}

.rjc__tag--secondary {
  background: #F4F4F0;
  color: #666;
}

.rjc__sep {
  font-size: 11px;
  color: #ccc;
}

/* ── 화살표 ── */
.rjc__arrow {
  flex-shrink: 0;
  color: #C8C8C8;
  display: flex;
  align-items: center;
}

.rjc:active .rjc__arrow {
  color: #888;
}
</style>

<template>
  <!-- 프로젝트 종류 '과정' 꼬리표(2026-11-16, 정할 것 1번) — 진도(기본)는 꼬리표가 없다.
       영역 꼬리표(채운 알약)와 헷갈리지 않게 테두리 알약 + 기간 그림. 어두운 배경 위에서도 흰 바탕이라 읽힌다 -->
  <span class="period-tag"><AppIcon name="kind-period" class="period-tag__icon" />과정</span>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
</script>

<style lang="scss">
.period-tag {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  flex: none;
  padding: 1px 7px 1px 5px;
  border: 1.3px solid #8a5a00;
  border-radius: 999px;
  background: #ffffff;
  color: #8a5a00;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.5;
  white-space: nowrap;
  vertical-align: middle;

  &__icon { width: 11px; height: 11px; font-size: 11px; }
}
</style>

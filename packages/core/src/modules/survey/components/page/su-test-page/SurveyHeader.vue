<template>
  <!-- 파트 이름은 모든 파트가 한 줄·같은 크기 (2026-11-15: '업무환경'만 두 줄·작게 하던 예외 제거 — 모바일은 인사말을 빼서 자리가 넉넉하다) -->
  <header class="survey-header">
    <div class="part-info">
      <span class="part-number">파트 {{ currentPartInfo.number }}</span>
      <span class="part-name">{{ currentPartInfo.name }}</span>
    </div>

    <!-- 로그인 여부와 상관없이 같은 문구 — 문항 페이지부터 (2026-10-30) -->
    <p class="survey-header__greeting">
      <template v-if="!isCover">나를 더 알아가는 중</template>
    </p>

    <div class="page-info">
      <template v-if="!isCover">{{ currentPartPageInfo.current }} / {{ currentPartPageInfo.total }} 페이지</template>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  currentPartInfo: { number: number; name: string }
  currentPartPageInfo: { current: number; total: number }
  isCover?: boolean // 파트 표지 — 문구·페이지 수를 숨긴다(문항 페이지부터 보인다)
}>()
</script>

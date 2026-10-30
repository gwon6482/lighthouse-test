<template>
  <header class="survey-header" :class="{ 'survey-header--geunmu': currentPartInfo.name === '업무환경' }">
    <div class="part-info" :class="{ 'part-info--geunmu': currentPartInfo.name === '업무환경' }">
      <span class="part-number">파트 {{ currentPartInfo.number }}</span>
      <span class="part-name" v-html="formatPartName(currentPartInfo.name)"></span>
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

function formatPartName(name: string): string {
  return name.replace('업무환경', '업무<br>환경')
}
</script>

<template>
  <header class="survey-header">
    <div class="part-info">
      <span class="part-number">파트 {{ currentPartInfo.number }}</span>
      <span class="part-name">{{ currentPartInfo.name }}</span>
    </div>

    <p class="survey-header__greeting">
      <template v-if="userName">함께 <strong>{{ userName }}</strong>님을 알아가는 중</template>
      <template v-else>나를 더 알아가는 중</template>
    </p>

    <div class="page-info">
      {{ currentPartPageInfo.current }} / {{ currentPartPageInfo.total }} 페이지
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  currentPartInfo: { number: number; name: string }
  currentPartPageInfo: { current: number; total: number }
  userName?: string
}>()
</script>

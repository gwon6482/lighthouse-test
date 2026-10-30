<template>
  <!-- 진행률은 막대로만 보여준다 — % 글씨는 두지 않는다 (2026-10-30) -->
  <div class="progress-bar">
    <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  progress: number
}>()
</script>

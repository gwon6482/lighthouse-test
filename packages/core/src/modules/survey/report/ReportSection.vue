<template>
  <div class="rp-sec">
    <div class="rp-sec__h"><i />{{ title }}<small v-if="sub">{{ sub }}</small></div>
    <slot />
  </div>
</template>

<script setup lang="ts">
/** 회색 띠 머리가 달린 구역(TCI 결과지 형식) */
defineProps<{ title: string; sub?: string }>()
</script>

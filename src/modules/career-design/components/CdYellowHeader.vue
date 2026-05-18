<template>
  <div class="cd-yellow-header">
    <button class="cd-yellow-header__back" @click="router.back()">‹</button>
    <div class="cd-yellow-header__text">
      <h1 class="cd-yellow-header__title">{{ title }}</h1>
      <p v-if="subtitle" class="cd-yellow-header__subtitle">{{ subtitle }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

defineProps<{ title: string; subtitle?: string }>()
const router = useRouter()
</script>

<style lang="scss">
.cd-yellow-header {
  background: #FFC700;
  padding: 20px 20px 24px;
  display: flex;
  align-items: flex-start;
  gap: 12px;

  &__back {
    background: none;
    border: none;
    font-size: 28px;
    color: #222;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__title {
    font-size: 22px;
    font-weight: 700;
    color: #222;
  }

  &__subtitle {
    font-size: 13px;
    color: #555;
    line-height: 1.4;
  }
}
</style>

<template>
  <header class="encyclopedia-home__header">
    <button class="encyclopedia-home__back" @click="router.back()">‹</button>
    <div class="encyclopedia-home__header-text">
      <h1 class="encyclopedia-home__title">진로백과</h1>
      <p class="encyclopedia-home__subtitle">관심 있는 직업을 검색하거나 추천 진로를 확인해보세요</p>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style lang="scss">
.encyclopedia-home {
  &__header {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 0 20px;
  }

  &__back {
    background: none;
    border: none;
    font-size: 28px;
    color: #333;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__header-text {
    text-align: center;
    flex: 1;
  }

  &__title {
    font-size: 28px;
    font-weight: 700;
    color: #333;
    margin-bottom: 8px;
  }

  &__subtitle {
    font-size: 14px;
    color: #888;
    line-height: 1.5;
  }
}
</style>

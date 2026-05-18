<template>
  <div class="career-achievement">
    <header class="career-achievement__header">
      <button class="career-achievement__back" @click="router.back()">‹</button>
      <h1 class="career-achievement__title">진로달성</h1>
    </header>

    <div class="career-achievement__body">
      <div class="career-achievement__icon">🏆</div>
      <p class="career-achievement__desc">진로 목표를 달성해 나가세요.</p>
      <p class="career-achievement__sub">준비 중인 기능입니다.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<style lang="scss">
.career-achievement {
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  &__header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 20px 0;
  }

  &__back {
    background: none;
    border: none;
    font-size: 28px;
    color: #333;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }

  &__title {
    font-size: 20px;
    font-weight: 700;
    color: #333;
  }

  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 40px 20px;
  }

  &__icon {
    font-size: 64px;
  }

  &__desc {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    text-align: center;
  }

  &__sub {
    font-size: 14px;
    color: #aaa;
    text-align: center;
  }
}
</style>

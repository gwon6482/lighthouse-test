<template>
  <div class="main-page">
    <AppHeader />

    <div class="main-page__body">
      <p class="main-page__coming">준비 중인 페이지입니다.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/shared/components/AppHeader.vue'
</script>

<style lang="scss">
.main-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;

  &__body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__coming {
    font-size: 14px;
    color: #aaa;
  }
}
</style>

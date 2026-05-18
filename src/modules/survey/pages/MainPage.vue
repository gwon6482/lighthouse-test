<template>
  <div class="main-page">
    <nav class="main-page__nav">
      <img class="main-page__logo" src="/Symbol_Logo.svg" alt="LightHouse" />
    </nav>

    <div class="main-page__body">
      <p class="main-page__coming">준비 중인 페이지입니다.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style lang="scss">
.main-page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;

  &__nav {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    background: #fff;
    border-bottom: 1px solid #EEEEE8;
    position: sticky;
    top: 0;
    z-index: 100;
  }

  &__logo {
    height: 29px;
    width: auto;
  }

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

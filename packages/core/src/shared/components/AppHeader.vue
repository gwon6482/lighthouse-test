<template>
  <nav class="app-header">
    <RouterLink to="/" class="app-header__logo-link">
      <img class="app-header__logo" src="/Symbol_Logo.svg" alt="LightHouse" />
    </RouterLink>
    <slot />
  </nav>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #EEEEE8;
  position: sticky;
  top: 0;
  z-index: 100;

  &__logo-link {
    display: flex;
    align-items: center;
  }

  &__logo {
    height: 29px;
    width: auto;
  }
}

/* 슬롯에 들어오는 CTA 버튼 공통 스타일 */
:deep(.app-header-btn) {
  background: #FFD100;
  color: #1a1a1a;
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 700;
  font-family: 'Pretendard', sans-serif;
  text-decoration: none;
  cursor: pointer;
  white-space: nowrap;
}
</style>

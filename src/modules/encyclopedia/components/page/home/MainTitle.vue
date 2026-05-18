<template>
  <nav class="enc-nav">
    <img class="enc-nav__logo" src="/Symbol_Logo.svg" alt="LightHouse" />
  </nav>
</template>

<script setup lang="ts">
</script>

<style lang="scss">
.enc-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #fff;
  border-bottom: 1px solid #EEEEE8;
  position: sticky;
  top: 0;
  z-index: 100;

  &__logo {
    height: 29px;
    width: auto;
  }
}
</style>

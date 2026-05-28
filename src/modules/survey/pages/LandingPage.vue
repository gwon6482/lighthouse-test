<template>
  <div class="landing">
    <header class="landing__header">
      <button class="landing__back" @click="router.back()">‹</button>
      <span class="landing__header-title">랜딩페이지</span>
      <span class="landing__header-spacer" />
    </header>

    <div class="landing__body">
      <div class="landing__placeholder">
        <span class="landing__placeholder-icon">🌟</span>
        <h1 class="landing__placeholder-title">랜딩페이지</h1>
        <p class="landing__placeholder-text">
          이 자리에 라이트하우스 서비스 소개·온보딩 화면이 들어올 거에요.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<style lang="scss">
.landing {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;

  &__header {
    position: sticky;
    top: 0;
    z-index: 10;
    display: grid;
    grid-template-columns: 44px 1fr 44px;
    align-items: center;
    height: 52px;
    padding: 0 8px;
    background: #fff;
    border-bottom: 1px solid #EEEEE8;
  }

  &__back {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    font-size: 20px;
    color: #444;
    cursor: pointer;
  }

  &__header-title {
    text-align: center;
    font-size: 14px;
    font-weight: 700;
    color: #222;
  }

  &__header-spacer { width: 44px; }

  &__body {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
  }

  &__placeholder {
    background: #fff;
    border-radius: 18px;
    padding: 40px 28px;
    text-align: center;
    max-width: 320px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }

  &__placeholder-icon { font-size: 48px; }
  &__placeholder-title { font-size: 22px; font-weight: 900; color: #222; margin: 4px 0 0; }
  &__placeholder-text { font-size: 13px; color: #666; line-height: 1.6; margin: 0; }
}
</style>

<template>
  <div class="coming-soon">
    <div class="coming-soon__inner">
      <div class="coming-soon__emoji">🚧</div>
      <h1 class="coming-soon__title">{{ title }}</h1>
      <p class="coming-soon__msg">{{ message }}</p>
      <p class="coming-soon__sub">곧 공개될 예정이에요</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const title = computed(() => String(route.meta.comingSoonTitle ?? '준비 중'))
const message = computed(() => String(route.meta.comingSoonMsg ?? '이 기능은 준비 중입니다.'))
</script>

<style scoped lang="scss">
.coming-soon {
  min-height: 100vh;
  background: #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 20px 96px;

  &__inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    max-width: 340px;
    text-align: center;
  }

  &__emoji {
    font-size: 48px;
    line-height: 1;
    margin-bottom: 4px;
  }

  &__title {
    font-size: 1.25rem;
    font-weight: 800;
    color: #1a1a1a;
    margin: 0;
  }

  &__msg {
    font-size: 0.9375rem;
    color: #555;
    line-height: 1.5;
    margin: 0;
  }

  &__sub {
    font-size: 0.8125rem;
    color: #aaa;
    margin-top: 8px;
  }
}
</style>

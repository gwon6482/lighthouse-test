<template>
  <div class="main-page">
    <AppHeader />

    <div class="main-page__body">
      <span class="main-page__badge" :class="`main-page__badge--${state}`">
        {{ state === 'before' ? '프로젝트 설계 전' : '프로젝트 설계 후' }}
      </span>
      <p class="main-page__coming">준비 중인 페이지입니다.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/shared/components/AppHeader.vue'

const route = useRoute()
const state = computed<'before' | 'after'>(() =>
  route.meta.mainState === 'before' ? 'before' : 'after',
)
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
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding-bottom: 80px;
  }

  &__badge {
    font-size: 12px;
    font-weight: 700;
    padding: 5px 12px;
    border-radius: 999px;

    &--before { color: #1DB95A; background: #E8F9EF; }
    &--after  { color: #A855F7; background: #F5EDFF; }
  }

  &__coming {
    font-size: 14px;
    color: #aaa;
    margin: 0;
  }
}
</style>

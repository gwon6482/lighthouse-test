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

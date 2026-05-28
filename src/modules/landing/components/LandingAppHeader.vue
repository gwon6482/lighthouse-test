<template>
  <header class="landing-app-header" :class="{ 'landing-app-header--hidden': !isHeaderVisible }">
    <nav>
      <RouterLink to="/" class="logo">
        <img :src="logoImg" alt="Lighthouse" />
      </RouterLink>
      <ul>
        <li><a href="javascript:void(0)">우리의 이야기</a></li>
        <li><a href="javascript:void(0)">서비스 소개</a></li>
        <li><a href="javascript:void(0)">사전 예약</a></li>
        <li><a href="javascript:void(0)">멘토 신청</a></li>
        <li><a href="javascript:void(0)">비즈니스</a></li>
      </ul>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import logoImg from '@/assets/landing/logo_header.png'

const isHeaderVisible = ref(true)
const lastScrollY = ref(0)

const handleScroll = () => {
  const currentScrollY = window.scrollY
  // 88 = 헤더 높이(px). 헤더 높이만큼은 스크롤해도 헤더가 사라지지 않도록.
  if (currentScrollY > lastScrollY.value && currentScrollY > 88) {
    isHeaderVisible.value = false
  } else {
    isHeaderVisible.value = true
  }
  lastScrollY.value = currentScrollY
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style lang="scss">
@import '@/appearance/modules/landing/app-header';
</style>

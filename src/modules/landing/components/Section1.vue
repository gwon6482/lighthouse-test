<template>
  <section class="section1">
    <img :src="symbolImg" alt="Section1 Symbol" class="section1_symbol" />

    <h2 class="section1_title">당신의 진로, 탐색부터 달성까지</h2>

    <p class="section1_description">
      라이트하우스는 진짜 나의 진로를 찾고 싶은 사람들을 위한 온라인 진로 서비스입니다.<br />
      자기이해부터 실무자 기반 진로정보, 전문가와 함께하는 컨설팅까지,<br />
      라이트하우스에서 당신의 진로를 찾아보세요.
    </p>

    <img :src="arrowImg" alt="Section1 Arrow Down" class="section1_arrow_down" />
  </section>
</template>

<script setup lang="ts">
import symbolImg from '@/assets/landing/section1_symbol.png'
import arrowImg from '@/assets/landing/section1_arrow_down.png'
</script>

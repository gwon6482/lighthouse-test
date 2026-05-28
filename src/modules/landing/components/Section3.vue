<template>
  <section class="section3">
    <div class="inner">
      <div class="section3_text">
        <label class="section3_label">STEP 1. 나를 알기</label>
        <h2 class="section3_title">
          <span class="highlight">"나"에서 시작</span>하는<br />진짜 진로
        </h2>
        <p class="section3_description">
          진로의 시작은 나를 아는 것!<br />
          나의 성격/기질을 통해 나의 강점과 강점이 드러나는 환경<br />
          을 알고 재능/흥미/가치관을 통해 진짜로 '하고 싶은 일'을<br />
          알 수 있어요
        </p>
      </div>

      <img :src="img" alt="Section3 Image" class="section3_image" />
    </div>
  </section>
</template>

<script setup lang="ts">
import img from '@/assets/landing/section3_image.png'
</script>

<style lang="scss">
@import '@/appearance/modules/landing/section3';
</style>

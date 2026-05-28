<template>
  <section class="section4">
    <div class="inner">
      <img :src="img" alt="Section4 Image" class="section4_image" />

      <div class="section4_text">
        <label class="section4_label">STEP 2. 진로 찾아보기</label>
        <h2 class="section4_title">
          <span class="highlight">이런 나에게 맞</span>는 진로,<br />무엇이 있을까
        </h2>
        <p class="section4_description">
          자기이해 검사를 통해 발견한 다양한 자신의 모습을<br />
          바탕으로 자신에게 맞는 진로들을 찾아보세요!<br />
          추천을 받을 수도 있고 진로백과에서 직접 찾아볼 수도<br />
          있습니다.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import img from '@/assets/landing/section4_image.png'
</script>

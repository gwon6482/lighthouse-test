<template>
  <section class="section6">
    <div class="inner">
      <img :src="img" alt="Section6 Image" class="section6_image" />

      <div class="section6_text">
        <label class="section6_label">STEP 4. 매일 성장하기</label>
        <h2 class="section6_title">
          <span class="highlight">느리지만 꾸준</span>하게<br />성장하기
        </h2>
        <p class="section6_description">
          매일매일 나의 성장치를 확인하고 기록할 수 있어요.<br />
          전체 계획속에서 오늘의 할일을 확인하고, 달성,<br />
          기록하여 하루하루 성장하는 나 자신을 발견할 수 있어요.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import img from '@/assets/landing/section6_image.png'
</script>

<style lang="scss">
@import '@/appearance/modules/landing/section6';
</style>

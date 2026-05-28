<template>
  <section class="section5">
    <div class="inner">
      <div class="section5_text">
        <label class="section5_label">STEP 3. 꿈에서 현실로</label>
        <h2 class="section5_title">
          <span class="highlight">막연하지 않고</span><br />현실적으로
        </h2>
        <p class="section5_description">
          실제 주요 기업들에서 필요로하는 핵심역량들을<br />
          알아보고, 현 직업인들의 준비과정을 참고하여<br />
          나만의 진로 준비과정을 설계할 수 있어요.
        </p>
      </div>

      <img :src="img" alt="Section5 Image" class="section5_image" />
    </div>
  </section>
</template>

<script setup lang="ts">
import img from '@/assets/landing/section5_image.png'
</script>

<style lang="scss">
@import '@/appearance/modules/landing/section5';
</style>

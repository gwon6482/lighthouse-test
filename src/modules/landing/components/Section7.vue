<template>
  <section class="section7">
    <div class="inner">
      <div class="section7_text">
        <label class="section7_label">STEP 5. 함께 나아가기</label>
        <h2 class="section7_title">
          <span class="highlight">각자의 삶속에</span>서<br />함께 성장하는 우리
        </h2>
        <p class="section7_description">
          사람들과 함께 나의 성장을 공유하고,<br />
          서로 응원하며 꿈을 향한 여정을 이뤄나갈 수 있어요.
        </p>
      </div>

      <img :src="img" alt="Section7 Image" class="section7_image" />
    </div>
  </section>
</template>

<script setup lang="ts">
import img from '@/assets/landing/section7_image.png'
</script>

<style lang="scss">
@import '@/appearance/modules/landing/section7';
</style>

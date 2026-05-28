<template>
  <section class="section8">
    <div class="inner">
      <h2 class="section8_title">
        당신의 삶을 밝히는 새로운 방법,<br />Lighthouse
      </h2>
      <p class="section8_description">
        Lighthouse는 당신의 일상에 긍정적인 변화를 가져다줍니다.<br />
        지금 바로 시작해보세요!
      </p>

      <div class="section8_iphone_container">
        <img :src="iphoneFrame" alt="section8_iphone_frame" class="section8_iphone_frame" />
        <video class="section8_video" autoplay loop muted playsinline>
          <source :src="videoSrc" type="video/mp4" />
        </video>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import iphoneFrame from '@/assets/landing/section8_iphone_frame.png'
import videoSrc from '@/assets/landing/section8_sample_video.mov'
</script>

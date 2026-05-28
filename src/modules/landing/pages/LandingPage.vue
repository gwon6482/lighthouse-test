<template>
  <div class="landing-root">
    <LandingAppHeader />
    <main>
      <Section1 />
      <Section2 />
      <Section3 />
      <Section4 />
      <Section5 />
      <Section6 />
      <Section7 />
      <Section8 />
    </main>
    <LandingAppFooter />
  </div>
</template>

<script setup lang="ts">
import LandingAppHeader from '../components/LandingAppHeader.vue'
import LandingAppFooter from '../components/LandingAppFooter.vue'
import Section1 from '../components/Section1.vue'
import Section2 from '../components/Section2.vue'
import Section3 from '../components/Section3.vue'
import Section4 from '../components/Section4.vue'
import Section5 from '../components/Section5.vue'
import Section6 from '../components/Section6.vue'
import Section7 from '../components/Section7.vue'
import Section8 from '../components/Section8.vue'
</script>

<style lang="scss" scoped>
.landing-root {
  font-family: 'Pretendard Variable', sans-serif;
  background-color: #F9FAFB;

  main {
    min-height: 100vh;
  }
}
</style>

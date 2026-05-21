<template>
  <div class="ca">
    <AppHeader />

    <div class="ca__hero">
      <h1 class="ca__title">진로달성</h1>
      <p class="ca__subtitle">목표를 향한 여정을 기록해요</p>
    </div>

    <JourneyIntro
      class="ca__intro"
      :step="3"
      headlineMain="계획을 세웠으니,"
      headlineEm="이제 실행할 차례예요."
      bodyLine1="목표를 향한 여정이 시작됐어요."
      bodyLine2="하나씩 완료해가며 꿈에 가까워지는 과정을 기록해보세요."
    />

    <div class="ca__body">
      <div class="ca__icon">🏆</div>
      <p class="ca__desc">진로 목표를 달성해 나가세요.</p>
    </div>

    <div class="ca__footer">
      <button class="ca__start-btn" @click="router.push('/career-achievement/start')">
        진로달성 시작하기
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppHeader from '@/shared/components/AppHeader.vue'
import JourneyIntro from '@/shared/components/JourneyIntro.vue'

const router = useRouter()
</script>

<style lang="scss">
.ca {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;

  &__hero {
    background: #fff;
    padding: 20px 20px 16px;
    border-bottom: 1px solid #EEEEE8;
  }

  &__title {
    font-size: 22px;
    font-weight: 800;
    color: #1a1a1a;
    margin: 0;
  }

  &__subtitle {
    font-size: 13px;
    color: #888;
    margin: 4px 0 0;
  }

  &__intro {
    margin: 16px 20px 4px;
  }

  &__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 40px 20px;
  }

  &__icon {
    font-size: 64px;
  }

  &__desc {
    font-size: 16px;
    font-weight: 600;
    color: #555;
    text-align: center;
    margin: 0;
  }

  &__footer {
    padding: 16px 20px 36px;
  }

  &__start-btn {
    width: 100%;
    padding: 18px;
    background: #FFC700;
    border: none;
    border-radius: 16px;
    font-size: 17px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;

    &:active { opacity: 0.85; }
  }
}
</style>

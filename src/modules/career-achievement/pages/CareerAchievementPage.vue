<template>
  <div class="career-achievement">
    <AppHeader />

    <!-- 소개 텍스트 -->
    <JourneyIntro
      class="ca-main__intro"
      :step="3"
      headlineMain="계획을 세웠으니,"
      headlineEm="이제 실행할 차례예요."
      bodyLine1="목표를 향한 여정이 시작됐어요."
      bodyLine2="하나씩 완료해가며 꿈에 가까워지는 과정을 기록해보세요."
    />

    <div class="career-achievement__body">
      <div class="career-achievement__icon">🏆</div>
      <p class="career-achievement__desc">진로 목표를 달성해 나가세요.</p>
      <p class="career-achievement__sub">준비 중인 기능입니다.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/shared/components/AppHeader.vue'
import JourneyIntro from '@/shared/components/JourneyIntro.vue'
</script>

<style lang="scss">
.ca-main__intro {
  margin: 16px 20px 4px;
}

.career-achievement {
  display: flex;
  flex-direction: column;
  min-height: 100vh;

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
    font-size: 18px;
    font-weight: 600;
    color: #333;
    text-align: center;
  }

  &__sub {
    font-size: 14px;
    color: #aaa;
    text-align: center;
  }
}
</style>

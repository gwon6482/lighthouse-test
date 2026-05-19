<template>
  <div class="career-achievement">
    <AppHeader />

    <!-- 소개 텍스트 -->
    <div class="ca-main__intro journey-intro">
      <div class="journey-intro__trail">
        <span class="journey-intro__trail-done">자기이해 ✓</span>
        <span class="journey-intro__trail-sep">›</span>
        <span class="journey-intro__trail-done">직업 탐색 ✓</span>
        <span class="journey-intro__trail-sep">›</span>
        <span class="journey-intro__trail-done">진로계획 ✓</span>
        <span class="journey-intro__trail-sep">›</span>
        <span class="journey-intro__trail-now">진로달성</span>
      </div>
      <p class="journey-intro__headline">
        계획을 세웠으니,<br>
        <em>이제 실행할 차례예요.</em>
      </p>
      <div class="journey-intro__rule" />
      <p class="journey-intro__body">
        목표를 향한 여정이 시작됐어요.<br>
        하나씩 완료해가며 꿈에 가까워지는 과정을 기록해보세요.
      </p>
    </div>

    <div class="career-achievement__body">
      <div class="career-achievement__icon">🏆</div>
      <p class="career-achievement__desc">진로 목표를 달성해 나가세요.</p>
      <p class="career-achievement__sub">준비 중인 기능입니다.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/shared/components/AppHeader.vue'
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

<template>
  <div class="su-main">
    <!-- 헤더 -->
    <AppHeader />

    <!-- 타이틀 -->
    <div class="su-main__hero">
      <h1 class="su-main__title">자기이해</h1>
      <p class="su-main__subtitle">나를 알면, 진로가 보여요</p>
    </div>

    <!-- 소개 박스 -->
    <JourneyIntro
      class="su-main__intro"
      :step="0"
      headlineMain="나를 알면,"
      headlineEm="길이 보여요."
      bodyLine1="진로는 남들이 정해줄 수 없어요."
      bodyLine2="나의 흥미, 강점, 성격을 먼저 파악하는 것부터 시작해볼게요."
    />

    <!-- 검사 절차 -->
    <div class="su-main__section">
      <h2 class="su-main__section-title">검사 절차</h2>
      <p class="su-main__section-sub">총 3개 파트 · 약 10분 소요</p>

      <div class="su-main__parts">
        <div v-for="part in parts" :key="part.label" class="su-main__part-card">
          <div class="su-main__part-top">
            <div class="su-main__part-left">
              <span class="su-main__part-label" :style="{ color: part.color }">{{ part.label }}</span>
              <span class="su-main__part-title">{{ part.title }}</span>
            </div>
            <span class="su-main__part-emoji">{{ part.emoji }}</span>
          </div>
          <p class="su-main__part-desc">{{ part.desc }}</p>
          <div class="su-main__part-pills">
            <span class="su-main__pill" :style="{ color: part.color, background: part.bg, borderColor: part.bg }">
              {{ part.questionCount }}
            </span>
            <span v-if="part.minutes" class="su-main__pill">⏱ 약 {{ part.minutes }}분</span>
          </div>
        </div>
      </div>

      <!-- 팁 -->
      <div class="su-main__tips">
        <p class="su-main__tips-title">이렇게 답해줘</p>
        <ul class="su-main__tip-list">
          <li v-for="tip in tips" :key="tip.text" class="su-main__tip-item">
            <span class="su-main__tip-icon">{{ tip.icon }}</span>
            <span>{{ tip.text }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- 검사 시작 버튼 -->
    <div class="su-main__footer">
      <button class="su-main__cta" @click="router.push('/self-understanding/select')">
        검사 시작하기
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppHeader from '@/shared/components/AppHeader.vue'
import JourneyIntro from '@/shared/components/JourneyIntro.vue'

const router = useRouter()

const parts = [
  {
    label: '파트 1',
    title: '성격 & 기질',
    desc: '타고난 기질·성격 패턴 9가지 요소 분석. 나를 가장 잘 아는 데이터가 돼.',
    emoji: '🧠',
    questionCount: '43문항',
    minutes: 5,
    color: '#CC9D00',
    bg: 'rgba(255,199,0,0.12)',
  },
  {
    label: '파트 2',
    title: '좋아하는 일',
    desc: '재능 · 흥미 · 가치관, 3개 파트로 나눠 내가 좋아하는 일을 구체적으로 찾아.',
    emoji: '✨',
    questionCount: '총 107문항',
    minutes: 5,
    color: '#2E8FD4',
    bg: 'rgba(91,184,245,0.12)',
  },
  {
    label: '파트 3',
    title: '업무 환경',
    desc: '좋아하는 일을 해도 맞지 않는 환경이면 힘들 수 있어. 진로 리스크를 미리 파악해.',
    emoji: '🌿',
    questionCount: '6개 항목',
    minutes: null,
    color: '#2A9D6F',
    bg: 'rgba(42,157,111,0.12)',
  },
]

const tips = [
  { icon: '💡', text: '정답은 없어. 현재 나의 모습 그대로 솔직하게 답해줘.' },
  { icon: '⚡', text: '너무 오래 고민하지 말고 첫 느낌으로 골라.' },
  { icon: '⚠️', text: '중간에 멈추면 처음부터 다시 시작해야 해.' },
]
</script>

<style lang="scss">
.su-main {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;


  &__hero {
    padding: 32px 20px 16px;
    text-align: center;
  }

  &__title {
    font-size: 28px;
    font-weight: 800;
    color: #222;
    margin-bottom: 8px;
  }

  &__subtitle {
    font-size: 14px;
    color: #888;
  }

  &__intro {
    margin: 0 20px 20px;
  }

  &__section {
    padding: 0 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__section-title {
    font-size: 16px;
    font-weight: 700;
    color: #222;
    margin-bottom: 0;
  }

  &__section-sub {
    font-size: 12px;
    color: #aaa;
    margin-top: -4px;
  }

  &__parts {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__part-card {
    background: #fff;
    border-radius: 16px;
    padding: 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__part-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  &__part-left {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__part-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
  }

  &__part-title {
    font-size: 18px;
    font-weight: 700;
    color: #222;
  }

  &__part-emoji {
    font-size: 28px;
    line-height: 1;
  }

  &__part-desc {
    font-size: 13px;
    color: #888;
    line-height: 1.6;
  }

  &__part-pills {
    display: flex;
    gap: 6px;
  }

  &__pill {
    font-size: 12px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 99px;
    border: 1px solid #eee;
    color: #888;
    background: #F8F8F8;
  }

  &__tips {
    background: #fff;
    border-radius: 16px;
    padding: 16px 18px;
  }

  &__tips-title {
    font-size: 13px;
    font-weight: 700;
    color: #222;
    margin-bottom: 12px;
  }

  &__tip-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__tip-item {
    display: flex;
    gap: 10px;
    font-size: 13px;
    color: #666;
    line-height: 1.5;
  }

  &__tip-icon {
    flex-shrink: 0;
  }

  &__footer {
    padding: 24px 20px 40px;
    margin-top: auto;
  }

  &__cta {
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

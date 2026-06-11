<template>
  <div class="intro">
    <!-- 건너뛰기 -->
    <button class="intro__skip" @click="finish">건너뛰기</button>

    <!-- 슬라이드 뷰포트 -->
    <div
      class="intro__viewport"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
    >
      <div class="intro__track" :style="{ transform: `translateX(-${index * 100}%)` }">
        <section v-for="(s, i) in slides" :key="i" class="intro__slide">
          <div class="intro__art" :style="{ background: s.bg }">
            <span class="intro__emoji">{{ s.emoji }}</span>
          </div>
          <h2 class="intro__title" v-html="s.title" />
          <p class="intro__body" v-html="s.body" />
        </section>
      </div>
    </div>

    <!-- 하단 영역: 점 + 버튼 -->
    <div class="intro__footer">
      <div class="intro__dots" aria-hidden="true">
        <span
          v-for="(s, i) in slides"
          :key="i"
          class="intro__dot"
          :class="{ 'intro__dot--active': i === index }"
        />
      </div>

      <button class="intro__cta" @click="next">
        {{ isLast ? '시작하기' : '다음' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const slides = [
  {
    emoji: '🧭',
    bg: 'linear-gradient(135deg, #FFF6D6 0%, #FFE99A 100%)',
    title: '나를 먼저<br/>이해하는 것부터',
    body: '성격·재능·흥미·가치관·업무환경<br/>5가지 검사로 진짜 나를 알아봐요.',
  },
  {
    emoji: '📚',
    bg: 'linear-gradient(135deg, #E6F0FF 0%, #C9DDFF 100%)',
    title: '537개 직업 중<br/>나에게 맞는 진로',
    body: '검사 결과를 바탕으로<br/>꼭 맞는 직업을 추천해드려요.',
  },
  {
    emoji: '🚀',
    bg: 'linear-gradient(135deg, #EFE6FF 0%, #DCC9FF 100%)',
    title: '계획을 세우고<br/>매일 실천까지',
    body: '진로 목표를 설계하고<br/>하루하루 달성해 나가요.',
  },
]

const index = ref(0)
const isLast = computed(() => index.value === slides.length - 1)

function next() {
  if (isLast.value) finish()
  else index.value++
}

function finish() {
  router.replace('/onboarding/auth')
}

// ── 스와이프 ──
let startX = 0
function onTouchStart(e: TouchEvent) {
  startX = e.changedTouches[0].clientX
}
function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - startX
  if (Math.abs(dx) < 50) return
  if (dx < 0 && !isLast.value) index.value++       // 왼쪽으로 → 다음
  else if (dx > 0 && index.value > 0) index.value-- // 오른쪽으로 → 이전
}
</script>

<style scoped lang="scss">
.intro {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #FFFFFF;
  z-index: 1500;
}

.intro__skip {
  position: absolute;
  top: max(16px, env(safe-area-inset-top));
  right: 18px;
  z-index: 2;
  border: none;
  background: transparent;
  color: #999;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  padding: 6px 4px;
  cursor: pointer;

  &:hover { color: #555; }
}

/* ── 슬라이드 ── */
.intro__viewport {
  flex: 1;
  overflow: hidden;
}

.intro__track {
  display: flex;
  height: 100%;
  transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.intro__slide {
  flex: 0 0 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  padding: 0 32px;
  box-sizing: border-box;
  text-align: center;
}

.intro__art {
  width: 200px;
  height: 200px;
  border-radius: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.08);
}

.intro__emoji {
  font-size: 88px;
  line-height: 1;
}

.intro__title {
  font-size: 25px;
  font-weight: 900;
  line-height: 1.35;
  letter-spacing: -0.5px;
  color: #1A1A1A;
  margin: 0;
}

.intro__body {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.6;
  color: #777;
  margin: 0;
}

/* ── 하단 ── */
.intro__footer {
  padding: 0 24px calc(28px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22px;
}

.intro__dots {
  display: flex;
  gap: 8px;
}

.intro__dot {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #E2E2E2;
  transition: width 0.3s, background 0.3s;

  &--active {
    width: 22px;
    background: #FFD100;
  }
}

.intro__cta {
  width: 100%;
  max-width: 420px;
  padding: 16px;
  font-size: 16px;
  font-weight: 800;
  font-family: inherit;
  letter-spacing: -0.2px;
  color: #1A1A1A;
  background: #FFD100;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.15s, transform 0.08s;

  &:hover { background: #F0C400; }
  &:active { transform: scale(0.98); }
}
</style>

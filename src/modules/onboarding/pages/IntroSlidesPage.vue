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
        {{ isLast ? '확인했어요' : '다음' }}
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
  router.replace('/onboarding/welcome')
}

// ── 스와이프 ──
let startX = 0
function onTouchStart(e: TouchEvent) {
  startX = e.changedTouches[0]?.clientX ?? 0
}
function onTouchEnd(e: TouchEvent) {
  const dx = (e.changedTouches[0]?.clientX ?? 0) - startX
  if (Math.abs(dx) < 50) return
  if (dx < 0 && !isLast.value) index.value++       // 왼쪽으로 → 다음
  else if (dx > 0 && index.value > 0) index.value-- // 오른쪽으로 → 이전
}
</script>

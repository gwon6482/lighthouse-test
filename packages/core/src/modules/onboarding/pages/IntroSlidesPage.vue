<!-- 가입 뒤 소개 4쪽(2026-11-20 시안 2판) — 쪽 내용은 lib/introSlides.ts, 가운데 그림은 components/IntroArt.vue.
     틀(그림 상자 → 제목 → 설명 → 점 → 노란 버튼, 옆으로 밀어 넘기기)은 예전 그대로. 건너뛰기 없음 -->
<template>
  <div class="intro">
    <div
      class="intro__viewport"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
    >
      <div class="intro__track" :style="{ transform: `translateX(-${index * 100}%)` }">
        <section
          v-for="(s, i) in INTRO_SLIDES"
          :key="s.art"
          :ref="(el) => (slideEls[i] = el as HTMLElement | null)"
          class="intro__slide"
          :aria-hidden="i === index ? undefined : 'true'"
          :inert="i !== index || undefined"
          :data-test="`intro-slide-${i + 1}`"
        >
          <p class="intro__step">{{ s.step }}</p>
          <p class="intro__worry">{{ s.worry }}</p>
          <!-- 작은 폰: 쪽이 넘치면 그림 상자만 비율 그대로 줄인다(fitArt). 자리 높이도 줄여 아래 글이 올라오게 -->
          <div class="intro__fit" :style="fitStyle(i)">
          <div :class="['intro__art', `intro__art--${s.tone}`]" :style="artStyle(i)">
            <!-- 쪽에 들어올 때 그림이 0.3초 떠오른다(동작 줄이기면 없음) -->
            <div :class="['intro__shot', { 'intro__shot--lift': i === index }]" role="img" :aria-label="s.artLabel">
              <IntroArt :kind="s.art" />
            </div>
            <span class="intro__ex">예시 화면이에요</span>
          </div>
          </div>
          <h2 class="intro__title">{{ s.title }}</h2>
          <p class="intro__body">{{ s.body }}</p>
        </section>
      </div>
    </div>

    <div class="intro__footer">
      <div class="intro__dots" aria-hidden="true">
        <span
          v-for="(s, i) in INTRO_SLIDES"
          :key="s.art"
          class="intro__dot"
          :class="{ 'intro__dot--active': i === index }"
        />
      </div>

      <button class="intro__cta" data-test="intro-cta" @click="next">{{ button.label }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import IntroArt from '../components/IntroArt.vue'
import { INTRO_SLIDES, INTRO_NEXT_PATH, introArtScale, introButton } from '../lib/introSlides'

const router = useRouter()

const index = ref(0)
const button = computed(() => introButton(index.value))
const isLast = computed(() => button.value.finish)

function next() {
  if (isLast.value) router.replace(INTRO_NEXT_PATH)
  else index.value++
}

// ── 작은 폰에서 그림 줄이기(2026-11-20) ──
// 쪽마다 그림 상자의 원래 높이(artH)와 줄인 배율(scale)을 둔다. 배율은 transform 으로, 자리 높이는 artH×scale 로.
const slideEls: (HTMLElement | null)[] = []
const fit = ref<{ artH: number; scale: number }[]>(INTRO_SLIDES.map(() => ({ artH: 0, scale: 1 })))
const fitStyle = (i: number) => {
  const f = fit.value[i]
  return f && f.scale < 1 ? { height: `${Math.round(f.artH * f.scale)}px` } : undefined
}
const artStyle = (i: number) => {
  const f = fit.value[i]
  return f && f.scale < 1 ? { transform: `scale(${f.scale})` } : undefined
}
function fitArt() {
  fit.value = INTRO_SLIDES.map((_, i) => {
    const slide = slideEls[i]
    const art = slide?.querySelector<HTMLElement>('.intro__art')
    const box = slide?.querySelector<HTMLElement>('.intro__fit')
    if (!slide || !art || !box) return { artH: 0, scale: 1 }
    const artH = art.offsetHeight                       // transform 은 offsetHeight 를 바꾸지 않는다 = 원래 높이
    const contentH = slide.scrollHeight - box.offsetHeight + artH
    return { artH, scale: introArtScale(slide.clientHeight, contentH, artH) }
  })
}
let raf = 0
const refit = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { fit.value = fit.value.map((f) => ({ ...f, scale: 1 })); nextTick(fitArt) }) }
onMounted(() => {
  nextTick(fitArt)
  document.fonts?.ready.then(refit).catch(() => {})
  window.addEventListener('resize', refit)
})
onBeforeUnmount(() => { window.removeEventListener('resize', refit); cancelAnimationFrame(raf) })

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

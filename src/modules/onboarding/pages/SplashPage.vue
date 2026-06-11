<template>
  <div class="splash">
    <div class="splash__stage">
      <!-- 우리 로고: 외곽선이 그려진 뒤 색이 채워짐 -->
      <svg
        class="splash__logo"
        width="132"
        height="157"
        viewBox="0 0 407 485"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="라이트하우스"
      >
        <path pathLength="1" fill="black" d="M347.429 59.5475C308.968 21.1022 257.858 0 203.5 0C149.142 0 98.0321 21.1876 59.5714 59.5475C21.1107 97.9928 0 149.082 0 203.418C0 301.924 68.802 384.709 164.783 403.163V474.671C164.783 477.576 166.065 480.31 168.287 482.19C169.996 483.642 172.219 484.411 174.441 484.411C175.039 484.411 175.723 484.411 176.321 484.24C309.993 457.755 407 339.686 407 203.504C407 149.168 385.804 98.0782 347.429 59.6329V59.5475Z" />
        <path pathLength="1" fill="white" d="M184.097 462.54V405.47C199.139 405.726 214.353 401.967 227.6 394.62C232.301 391.971 233.925 386.076 231.275 381.463C228.626 376.764 222.729 375.141 218.113 377.789C207.772 383.599 195.806 386.418 184.097 386.162V339.088C184.097 333.705 179.738 329.434 174.439 329.434H156.918L182.558 184.11H224.438L267.172 426.401C242.215 442.89 214.267 455.278 184.097 462.711V462.54Z" />
        <path pathLength="1" fill="white" d="M182.648 87.144L203.503 70.4844L224.357 87.144H182.648Z" />
        <path pathLength="1" fill="white" d="M222.9 106.536H184.098V135.584H222.9V106.536Z" />
        <path pathLength="1" fill="white" d="M242.217 154.978H164.697V164.632H242.217V154.978Z" />
        <path pathLength="1" fill="#FFD100" d="M284.694 413.672L244.182 183.94H252.046C257.43 183.94 261.703 179.583 261.703 174.286V145.238C261.703 139.856 257.345 135.584 252.046 135.584H242.388V106.537H252.046C256.148 106.537 259.823 103.974 261.191 100.044C262.558 96.1992 261.276 91.8421 258.114 89.279L209.653 50.492C206.149 47.6727 201.106 47.6727 197.517 50.492L149.056 89.279C145.808 91.8421 144.612 96.1992 145.979 100.044C147.347 103.888 151.022 106.537 155.125 106.537H164.782V135.584H155.125C149.74 135.584 145.467 139.941 145.467 145.238V174.286C145.467 179.668 149.825 183.94 155.125 183.94H162.988L135.894 337.209C135.381 340.028 136.151 342.933 138.031 345.154C139.911 347.375 142.561 348.657 145.467 348.657H164.868V383.257C79.9979 365.145 19.4863 291.245 19.4863 203.333C19.4863 154.209 38.6312 107.989 73.4168 73.2174C108.202 38.4458 154.441 19.3086 203.585 19.3086C252.729 19.3086 298.968 38.4458 333.753 73.2174C368.539 107.989 387.684 154.209 387.684 203.333C387.684 287.571 347.855 364.291 284.78 413.672H284.694Z" />
        <path pathLength="1" fill="black" d="M199.655 259.548C193.245 259.548 188.031 264.759 188.031 271.167C188.031 277.574 193.245 282.786 199.655 282.786C206.065 282.786 211.279 277.574 211.279 271.167C211.279 264.759 206.065 259.548 199.655 259.548Z" />
      </svg>
    </div>

    <div class="splash__wordmark">
      <span class="splash__name">라이트하우스</span>
      <span class="splash__tag">나의 진로를 비추는 빛</span>
    </div>

    <div class="splash__dots" aria-hidden="true">
      <span /><span /><span />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const HOLD_MS = 3500   // 로고 → 이름 → 태그라인 → 로딩점(~2.9s) 까지 보인 뒤 전환
let timer: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  timer = setTimeout(() => {
    router.replace('/onboarding/intro')
  }, HOLD_MS)
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>

<style scoped lang="scss">
.splash {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 30px;
  background: #FFFFFF;
  overflow: hidden;
  z-index: 2000;
}

/* ── 로고 무대 ── */
.splash__stage {
  display: flex;
  align-items: center;
  justify-content: center;
}

.splash__logo {
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.12));

  path {
    // 시작: 색은 비어있고(외곽선만), 선은 감춰진 상태
    fill-opacity: 0;
    stroke: #1A1A1A;
    stroke-width: 5;
    stroke-linejoin: round;
    stroke-linecap: round;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    // 1) 외곽선 그리기  2) 색 채우며 선 사라지기
    animation:
      logo-draw 1.3s ease forwards,
      logo-fill 0.6s ease 1.2s forwards;
  }
}

@keyframes logo-draw {
  to { stroke-dashoffset: 0; }
}

@keyframes logo-fill {
  to {
    fill-opacity: 1;
    stroke-opacity: 0;
  }
}

/* ── 워드마크 ── */
.splash__wordmark {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.splash__name {
  font-size: 26px;
  font-weight: 900;
  letter-spacing: -0.4px;
  color: #1A1A1A;
  animation: splash-fade 0.6s ease 1.6s both;   // 로고 완성 직후 먼저 등장
}

.splash__tag {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: #888;
  animation: splash-fade 0.6s ease 2.0s both;    // 이름 뒤이어 등장
}

/* ── 로딩 점 ── */
.splash__dots {
  display: flex;
  gap: 7px;
  opacity: 0;
  animation: splash-fade 0.5s ease 2.4s both;    // 태그라인 뒤, 마지막에 등장

  span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #FFD100;
    animation: splash-bounce 1.2s ease-in-out infinite;

    &:nth-child(2) { animation-delay: 0.15s; }
    &:nth-child(3) { animation-delay: 0.3s; }
  }
}

@keyframes splash-bounce {
  0%, 100% { transform: translateY(0); opacity: 0.4; }
  50%      { transform: translateY(-7px); opacity: 1; }
}

@keyframes splash-fade {
  from { transform: translateY(8px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

/* 모션 최소화 선호 사용자 — 바로 완성된 로고 표시 */
@media (prefers-reduced-motion: reduce) {
  .splash__logo path {
    fill-opacity: 1;
    stroke-opacity: 0;
    stroke-dashoffset: 0;
    animation: none;
  }
  .splash__name,
  .splash__tag,
  .splash__dots,
  .splash__dots span {
    animation: none;
  }
  .splash__dots { opacity: 1; }
}
</style>

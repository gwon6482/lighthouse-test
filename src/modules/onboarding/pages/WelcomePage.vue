<template>
  <div class="welcome">
    <div class="welcome__inner">
      <!-- 성공 체크 애니메이션 -->
      <div class="welcome__badge" aria-hidden="true">
        <svg width="84" height="84" viewBox="0 0 84 84" fill="none">
          <circle class="welcome__ring" cx="42" cy="42" r="39" stroke="#FFD100" stroke-width="5" />
          <path class="welcome__tick" d="M26 43.5 L37 54 L58 31" stroke="#FFD100" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <h1 class="welcome__title">
        <strong>{{ name }}</strong>님,<br/>환영해요! 🎉
      </h1>
      <p class="welcome__desc">
        가입이 완료됐어요.<br/>
        이제 나에게 꼭 맞는 진로를 찾아볼까요?
      </p>
    </div>

    <footer class="welcome__footer">
      <button class="welcome__cta" @click="start">시작하기</button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/shared/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const name = computed(() => authStore.user?.name ?? authStore.user?.email?.split('@')[0] ?? '회원')

function start() {
  // 갓 가입한 사용자는 진로계획이 없으므로 '설계 전' 메인으로
  router.replace('/main/before')
}
</script>

<style scoped lang="scss">
.welcome {
  position: fixed;
  inset: 0;
  background: #FFFFFF;
  display: flex;
  flex-direction: column;
  z-index: 1400;
}

.welcome__inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0 32px;
}

.welcome__badge {
  margin-bottom: 28px;
}

.welcome__ring {
  transform-origin: 42px 42px;
  stroke-dasharray: 245;
  stroke-dashoffset: 245;
  animation: welcome-ring 0.6s ease 0.1s forwards;
}

.welcome__tick {
  stroke-dasharray: 60;
  stroke-dashoffset: 60;
  animation: welcome-tick 0.4s ease 0.55s forwards;
}

.welcome__title {
  font-size: 26px;
  font-weight: 900;
  line-height: 1.35;
  letter-spacing: -0.5px;
  color: #1A1A1A;
  margin: 0 0 14px;
  animation: welcome-fade 0.5s ease 0.7s both;

  strong { color: #1A1A1A; }
}

.welcome__desc {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.6;
  color: #888;
  margin: 0;
  animation: welcome-fade 0.5s ease 0.9s both;
}

.welcome__footer {
  padding: 12px 24px calc(28px + env(safe-area-inset-bottom));
  animation: welcome-fade 0.5s ease 1.1s both;
}

.welcome__cta {
  width: 100%;
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

@keyframes welcome-ring { to { stroke-dashoffset: 0; } }
@keyframes welcome-tick { to { stroke-dashoffset: 0; } }
@keyframes welcome-fade {
  from { transform: translateY(8px); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .welcome__ring, .welcome__tick { stroke-dashoffset: 0; animation: none; }
  .welcome__title, .welcome__desc, .welcome__footer { animation: none; }
}
</style>

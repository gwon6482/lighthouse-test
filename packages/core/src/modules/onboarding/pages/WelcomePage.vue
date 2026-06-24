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
        <strong>{{ name }}</strong>님,<br/>환영합니다! 🎉
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


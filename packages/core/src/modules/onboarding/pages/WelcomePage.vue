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
        <strong>{{ name }}</strong>님,<br/>환영합니다! <AppIcon name="ui-celebrate" />
      </h1>
      <!-- 설명·띠(2026-11-20 시안 2판 권장) — 소개 1쪽(자기 이해)과 이어지게. 제목은 그대로(오너).
           다음 화면(진로 여정 시작)과 겹치지 않게 '여정·세 단계'는 쓰지 않고, 그 화면에 없는 시간(약 20분)을 알린다 -->
      <p class="welcome__desc">
        가입을 마쳤어요.<br/>
        첫걸음은 나를 아는 것부터예요.
      </p>
      <span class="welcome__first">먼저 자기이해 검사부터 · 약 20분</span>
    </div>

    <footer class="welcome__footer">
      <button class="welcome__cta" @click="start">시작하기</button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
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


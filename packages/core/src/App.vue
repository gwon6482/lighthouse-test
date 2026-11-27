<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted, watch } from 'vue'
import { useAuthStore } from '@/shared/stores/auth'
import { useAchievementStore } from '@/shared/stores/achievement'
import { useHardwareBack } from '@/shared/composables/useHardwareBack'
import BottomNav from '@/shared/components/BottomNav.vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { appToast, appToastAction, runToastAction } from '@/shared/composables/useAppToast'

const authStore = useAuthStore()
const achievementStore = useAchievementStore()

// 안드로이드 하드웨어 백버튼 전역 처리 (R4)
const { showExitToast } = useHardwareBack()

onMounted(async () => {
  if (authStore.token) {
    await authStore.fetchMe()
    if (authStore.user) achievementStore.loadActivePlan()
  }
})

// 로그인 상태 변화에 따라 active plan 로드/리셋
watch(() => authStore.user, (u) => {
  if (u) achievementStore.loadActivePlan()
  else achievementStore.reset()
})
</script>

<template>
  <RouterView />
  <BottomNav />

  <!-- 하드웨어 백버튼: 루트에서 한 번 더 누르면 종료 안내 (R4) -->
  <Transition name="exit-toast">
    <div v-if="showExitToast" class="exit-toast" role="status">
      한 번 더 누르면 종료됩니다
    </div>
  </Transition>

  <!-- 잠깐 알림(useAppToast) — 앱 종료 안내와 같은 모양·자리. 화면 읽기 프로그램에도 읽힌다(role=status) -->
  <Transition name="exit-toast">
    <div v-if="appToast && !showExitToast" :key="appToast" class="exit-toast app-toast" :class="{ 'app-toast--action': appToastAction }" role="status">
      <AppIcon name="ui-check" :size="15" />{{ appToast }}
      <button v-if="appToastAction" type="button" class="app-toast__action" @click="runToastAction">{{ appToastAction.label }}</button>
    </div>
  </Transition>
</template>

<style lang="scss">
.exit-toast {
  position: fixed;
  left: 50%;
  bottom: calc(88px + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 9999;
  padding: 10px 18px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.82);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  pointer-events: none;
}

.app-toast {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
// 버튼이 있는 알림(2026-11-26 '되돌렸어요 · 다시 완료') — 이것만 누를 수 있다
.app-toast--action {
  pointer-events: auto;
  padding-right: 6px;
}
.app-toast__action {
  margin-left: 6px;
  padding: 6px 12px;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  color: #FFD84D;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.exit-toast-enter-active,
.exit-toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.exit-toast-enter-from,
.exit-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>

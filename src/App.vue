<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted, watch } from 'vue'
import { useAuthStore } from '@/shared/stores/auth'
import { useAchievementStore } from '@/shared/stores/achievement'
import BottomNav from '@/shared/components/BottomNav.vue'

const authStore = useAuthStore()
const achievementStore = useAchievementStore()

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
</template>

<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useAuthStore } from '@/shared/stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  if (authStore.token) authStore.fetchMe()
})
</script>

<template>
  <RouterView />
</template>

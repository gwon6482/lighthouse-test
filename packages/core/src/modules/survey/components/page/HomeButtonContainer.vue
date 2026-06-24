<template>
  <div class="button-container">
    <template v-for="menu in menus" :key="menu.name">
      <RouterLink v-if="menu.route" class="main-button" :to="menu.route">
        <span class="button-icon">{{ menu.icon }}</span>
        <span class="button-text">{{ menu.name }}</span>
      </RouterLink>
      <button
        v-else
        type="button"
        class="main-button"
        @click="menu.onClick?.()"
      >
        <span class="button-icon">{{ menu.icon }}</span>
        <span class="button-text">{{ menu.name }}</span>
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
interface MenuItem {
  name: string
  icon: string
  route?: string
  onClick?: () => void
}

defineProps<{
  menus: MenuItem[]
}>()
</script>

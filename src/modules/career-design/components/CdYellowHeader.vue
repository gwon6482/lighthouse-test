<template>
  <div class="cd-yellow-header" :style="{ background: color ?? '#FFC700' }">
    <button class="cd-yellow-header__back" :style="{ color: textColor }" @click="router.back()">‹</button>
    <div class="cd-yellow-header__text">
      <h1 class="cd-yellow-header__title" :style="{ color: textColor }">{{ title }}</h1>
      <p v-if="subtitle" class="cd-yellow-header__subtitle" :style="{ color: subtitleColor }">{{ subtitle }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{ title: string; subtitle?: string; color?: string }>()
const router = useRouter()

const isYellow = computed(() => !props.color || props.color === '#FFC700')
const textColor = computed(() => isYellow.value ? '#222' : '#fff')
const subtitleColor = computed(() => isYellow.value ? '#555' : 'rgba(255,255,255,0.75)')
</script>

<style lang="scss">
.cd-yellow-header {
  padding: 20px 20px 24px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  transition: background 0.2s;

  &__back {
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    flex-shrink: 0;
    margin-top: 2px;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__title {
    font-size: 22px;
    font-weight: 700;
  }

  &__subtitle {
    font-size: 13px;
    line-height: 1.4;
  }
}
</style>

<template>
  <img class="cd-cat-icon" :src="iconSrc" :alt="category" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ProjectCategory } from '../types/career-design'

const props = defineProps<{ category: ProjectCategory }>()

const iconMap: Record<ProjectCategory, string> = {
  qualification: '/career-design/icon-qualification.svg',
  knowledge: '/career-design/icon-knowledge.svg',
  skill: '/career-design/icon-skill.svg',
  portfolio: '/career-design/icon-portfolio.svg',
}

const iconSrc = computed(() => iconMap[props.category])
</script>

<style lang="scss">
.cd-cat-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 10px;
}
</style>

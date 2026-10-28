<template>
  <svg
    v-if="def"
    class="app-icon"
    :viewBox="def.viewBox"
    :width="size"
    :height="size"
    aria-hidden="true"
    focusable="false"
    v-html="def.body"
  />
</template>

<script setup lang="ts">
// 자체 아이콘 — 이름(public/icons 파일 이름)으로 그린다. 색은 글자색(currentColor), 크기는 기본 1em.
// 아이콘 추가: public/icons 에 SVG → `pnpm icons` → <AppIcon name="…" />
import { computed } from 'vue'
import { ICONS } from '@/shared/icons/icons.generated'

const props = withDefaults(defineProps<{ name: string; size?: string | number }>(), { size: '1em' })
const def = computed(() => ICONS[props.name])
</script>

<style scoped>
.app-icon { display: inline-block; flex-shrink: 0; vertical-align: -0.125em; }
/* 펼침 토글: ui-chevron-down 하나로 아래(닫힘)↔위(열림), --side 는 ui-chevron-right 로 오른쪽↔아래 */
.app-icon.chevron-toggle { transition: transform 0.2s; }
.app-icon.chevron-toggle--open { transform: rotate(180deg); }
.app-icon.chevron-toggle--side.chevron-toggle--open { transform: rotate(90deg); }
</style>

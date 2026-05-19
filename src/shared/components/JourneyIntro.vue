<template>
  <div class="journey-intro">
    <div class="journey-intro__trail">
      <template v-for="(s, i) in STEPS" :key="s">
        <span :class="`journey-intro__trail-${i < step ? 'done' : i === step ? 'now' : 'next'}`">
          {{ i < step ? s + ' ✓' : s }}
        </span>
        <span v-if="i < STEPS.length - 1" class="journey-intro__trail-sep">›</span>
      </template>
    </div>
    <p class="journey-intro__headline">
      {{ headlineMain }}<br>
      <em>{{ headlineEm }}</em>
    </p>
    <div class="journey-intro__rule" />
    <p class="journey-intro__body">
      {{ bodyLine1 }}<br>
      {{ bodyLine2 }}
    </p>
  </div>
</template>

<script setup lang="ts">
const STEPS = ['자기이해', '직업 탐색', '진로계획', '진로달성'] as const

defineProps<{
  step: 0 | 1 | 2 | 3
  headlineMain: string
  headlineEm: string
  bodyLine1: string
  bodyLine2: string
}>()
</script>

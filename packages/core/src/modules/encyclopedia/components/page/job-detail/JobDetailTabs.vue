<template>
  <nav class="job-detail-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      :class="['job-detail-tabs__btn', { 'job-detail-tabs__btn--active': activeTab === tab.value }]"
      @click="emit('change', tab.value)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>

<script setup lang="ts">
import type { JobDetailTab } from '../../../types/encyclopedia'

defineProps<{
  activeTab: JobDetailTab
}>()

const emit = defineEmits<{
  change: [tab: JobDetailTab]
}>()

const tabs: { value: JobDetailTab; label: string }[] = [
  { value: 'overview',    label: '개요' },
  { value: 'review',      label: '후기' },
  { value: 'preparation', label: '준비과정' },
  { value: 'recruitment', label: '채용' },
]
</script>

<template>
  <div class="routine-card">
    <div
      v-for="(routine, i) in routines"
      :key="i"
      class="routine-row"
      @click="$emit('toggle', i)"
    >
      <i
        :class="routine.done ? 'ti ti-circle-check' : 'ti ti-circle'"
        class="routine-icon"
        :style="{ color: routine.done ? '#639922' : 'var(--rt-muted, #9ca3af)' }"
        aria-hidden="true"
      ></i>
      <span class="routine-title" :class="{ 'is-done': routine.done }">{{ routine.title }}</span>
      <span class="routine-meta">{{ routine.meta }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  // [{ title, meta, done }]
  routines: { type: Array, default: () => [] },
})
defineEmits(['toggle'])
</script>

<style scoped>
.routine-card {
  background: var(--rt-surface, #ffffff);
  border: 0.5px solid var(--rt-border, #eceef0);
  border-radius: 12px;
  padding: 4px 14px;
}
.routine-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 0;
  cursor: pointer;
}
.routine-row + .routine-row {
  border-top: 0.5px solid var(--rt-border, #eceef0);
}
.routine-icon {
  font-size: 20px;
}
.routine-title {
  flex: 1;
  font-size: 14px;
  color: var(--rt-text, #374151);
}
.routine-title.is-done {
  color: var(--rt-muted, #9ca3af);
  text-decoration: line-through;
}
.routine-meta {
  font-size: 12px;
  color: var(--rt-muted, #9ca3af);
}
</style>

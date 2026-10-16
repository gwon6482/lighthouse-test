<template>
  <div class="task-card" @click="$emit('open')">
    <div class="task-body">
      <div class="task-meta">
        <span class="task-chip" :style="{ background: task.bg, color: task.fg }">{{ task.category }}</span>
        <span class="task-time">{{ task.meta }}</span>
      </div>
      <p class="task-title" :class="{ 'is-done': task.done }">{{ task.title }}</p>
    </div>

    <button
      type="button"
      class="task-ctrl"
      :class="{ 'is-done': task.done }"
      :aria-label="task.done ? '완료 취소' : '시작하기'"
      @click.stop="onCtrl"
    >
      <i :class="task.done ? 'ti ti-check' : 'ti ti-player-play'" aria-hidden="true"></i>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  // { title, category, bg, fg, meta, done }
  task: { type: Object, required: true },
})
const emit = defineEmits(['open', 'toggle'])

function onCtrl() {
  if (props.task.done) emit('toggle')
  else emit('open')
}
</script>

<style scoped>
.task-card {
  --tc-brand: #ffd100;
  --tc-brand-ink: #412402;
  --tc-done: #639922;

  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--tc-surface, #ffffff);
  border: 0.5px solid var(--tc-border, #eceef0);
  border-radius: 12px;
  padding: 13px 14px;
  cursor: pointer;
}

.task-body {
  flex: 1;
}
.task-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.task-chip {
  font-size: 12px;
  padding: 2px 9px;
  border-radius: 20px;
}
.task-time {
  font-size: 12px;
  color: var(--tc-muted, #9ca3af);
}
.task-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--tc-text, #374151);
}
.task-title.is-done {
  color: var(--tc-muted, #9ca3af);
  text-decoration: line-through;
}

.task-ctrl {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 50%;
  background: var(--tc-brand);
  color: var(--tc-brand-ink);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.task-ctrl .ti {
  font-size: 18px;
}
.task-ctrl.is-done {
  background: var(--tc-done);
  color: #ffffff;
}
</style>

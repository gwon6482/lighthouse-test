<template>
  <div class="pv">
    <div class="pv-head">
      <button type="button" class="pv-back" aria-label="닫기" @click="$emit('back')">
        <i class="ti ti-chevron-left" aria-hidden="true"></i>
      </button>
      <span class="pv-head-title">진행 화면</span>
    </div>

    <div class="pv-card">
      <span class="pv-chip" :style="{ background: task.bg, color: task.fg }">{{ task.category }}</span>
      <p class="pv-title">{{ task.title }}</p>
      <p class="pv-meta"><i class="ti ti-clock" aria-hidden="true"></i> {{ task.meta }} · 진행 중</p>

      <div class="pv-steps">
        <div class="pv-step"><i class="ti ti-book" aria-hidden="true"></i><span>학습 자료 살펴보기</span></div>
        <div class="pv-step"><i class="ti ti-pencil" aria-hidden="true"></i><span>핵심 내용 정리하기</span></div>
      </div>
    </div>

    <button type="button" class="pv-complete" @click="$emit('complete')">
      <i class="ti ti-check" aria-hidden="true"></i>완료하기
    </button>
  </div>
</template>

<script setup>
defineProps({
  // { title, category, bg, fg, meta }
  task: { type: Object, required: true },
})
defineEmits(['back', 'complete'])
</script>

<style scoped>
.pv {
  --pv-done: #639922;
}
.pv-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 2px 18px;
}
.pv-back {
  display: flex;
  padding: 2px;
  background: none;
  border: none;
  color: var(--pv-muted-strong, #6b7280);
  cursor: pointer;
}
.pv-back .ti {
  font-size: 22px;
}
.pv-head-title {
  font-size: 16px;
  font-weight: 500;
}

.pv-card {
  background: var(--pv-surface, #ffffff);
  border: 0.5px solid var(--pv-border, #eceef0);
  border-radius: 12px;
  padding: 18px;
  margin-bottom: 16px;
}
.pv-chip {
  font-size: 12px;
  padding: 2px 9px;
  border-radius: 20px;
}
.pv-title {
  margin: 12px 0 6px;
  font-size: 18px;
  font-weight: 500;
}
.pv-meta {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--pv-muted, #9ca3af);
}
.pv-meta .ti {
  font-size: 14px;
  vertical-align: -2px;
}
.pv-steps {
  border-top: 0.5px solid var(--pv-border, #eceef0);
  padding-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pv-step {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: var(--pv-muted-strong, #6b7280);
}
.pv-step .ti {
  font-size: 18px;
  color: var(--pv-muted, #9ca3af);
}

.pv-complete {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: var(--pv-done);
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 13px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}
.pv-complete .ti {
  font-size: 17px;
}
</style>

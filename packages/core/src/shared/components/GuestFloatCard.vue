<template>
  <!-- 비회원 화면 아래 떠 있는 작은 카드(2026-11-11) — 자기이해 결과지(가입 버튼)·진로백과(검사로)가 같이 쓴다.
       화면 끝에 붙은 바가 아니라 둥근 카드로 뜬다(사용자 결정: 바는 싫다 → 시안 https://claude.ai/artifact/5f99gwCLauoXZ2MLBJpdbf ② 작은 카드).
       언제 보일지(show)와 버튼(기본 슬롯)은 쓰는 쪽이 정한다. 노란 버튼이 필요하면 슬롯에 class="gfloat__cta" -->
  <Teleport to="body">
    <div :class="['gfloat', { 'is-show': show }]" data-export-skip>
      <div class="gfloat__card">
        <p class="gfloat__t"><AppIcon name="ui-privacy" :size="14" />{{ title }}</p>
        <div class="gfloat__actions"><slot /></div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import AppIcon from './AppIcon.vue'

defineProps<{ show: boolean; title: string }>()
</script>

<style scoped lang="scss">
.gfloat {
  position: fixed;
  z-index: 50;
  left: 0;
  right: 0;
  bottom: calc(14px + env(safe-area-inset-bottom, 0px));
  padding: 0 max(10px, env(safe-area-inset-right, 0px)) 0 max(10px, env(safe-area-inset-left, 0px));
  pointer-events: none;
}
.gfloat__card {
  display: grid;
  gap: 10px;
  max-width: 600px;
  margin: 0 auto;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.18);
  transform: translateY(calc(100% + 30px));
  opacity: 0;
  visibility: hidden;   // 숨었을 때 버튼에 탭 이동이 가지 않게
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s, visibility 0s 0.3s;

  .gfloat.is-show & { transform: none; opacity: 1; visibility: visible; pointer-events: auto; transition-delay: 0s; }
}
.gfloat__t { display: flex; align-items: center; gap: 6px; padding: 0 2px; font-size: 0.875rem; font-weight: 800; color: #1a1a1a; :deep(svg) { color: #9a7400; } }
.gfloat__actions { display: grid; grid-template-columns: repeat(auto-fit, minmax(0, 1fr)); gap: 8px; }
:slotted(.gfloat__cta) {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 46px;
  border-radius: 10px;
  background: #ffd100;
  font-size: 0.95rem;
  font-weight: 700;
  color: #1a1a1a;
  text-decoration: none;
}
@media (prefers-reduced-motion: reduce) { .gfloat__card { transition: none; } }
</style>

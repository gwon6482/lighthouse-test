<template>
  <!-- 비회원 잠금 상자(2026-11-09) — 결과지(나머지 결과)·진로백과(나머지 정보)가 같이 쓴다. 버튼은 쓰는 쪽이 넣는다 -->
  <div class="glock" data-export-skip>
    <span class="glock__icon" aria-hidden="true"><AppIcon name="ui-privacy" :size="22" /></span>
    <p class="glock__title">{{ title }}</p>
    <ul v-if="items?.length" class="glock__items">
      <li v-for="t in items" :key="t">{{ t }}</li>
    </ul>
    <div class="glock__actions"><slot /></div>
    <p v-if="note" class="glock__note">{{ note }}</p>
  </div>
</template>

<script setup lang="ts">
import AppIcon from './AppIcon.vue'

defineProps<{ title: string; items?: string[]; note?: string }>()
</script>

<style scoped lang="scss">
.glock {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 24px 20px 20px;
  border: 1px solid #eeeeee;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.08);
  text-align: center;
}
.glock__icon { display: inline-grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; background: #fff6c2; color: #9a7400; }
.glock__title { font-size: 1.05rem; font-weight: 800; line-height: 1.4; color: #1a1a1a; word-break: keep-all; }
.glock__items {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
  margin: 2px 0 4px;
  padding: 0;
  list-style: none;

  li { padding: 4px 10px; border-radius: 999px; background: #f5f5f5; font-size: 0.78rem; font-weight: 600; color: #5f6670; }
}
.glock__actions { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.glock__note { font-size: 0.75rem; line-height: 1.5; color: #767676; word-break: keep-all; }
</style>

<template>
  <!-- 비회원 잠금 상자(2026-11-09) — 결과지(나머지 결과)·진로백과(나머지 정보)가 같이 쓴다. 버튼은 쓰는 쪽이 넣는다.
       eyebrow 를 주면 자물쇠 원 대신 한 줄 머리말 + 큰 제목이 된다(결과지, 2026-11-11 A안 — 버튼이 상자의 주인공) -->
  <div :class="['glock', { 'glock--emph': eyebrow }]" data-export-skip>
    <p v-if="eyebrow" class="glock__eyebrow"><AppIcon name="ui-privacy" :size="14" />{{ eyebrow }}</p>
    <span v-else class="glock__icon" aria-hidden="true"><AppIcon name="ui-privacy" :size="22" /></span>
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

defineProps<{ title: string; items?: string[]; note?: string; eyebrow?: string }>()
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

// 결과지 A안 — 머리말·큰 제목 다음 바로 버튼. 제목은 \n 으로 줄을 나눈다
.glock--emph { gap: 0; padding: 24px 20px 20px; }
.glock__eyebrow { display: flex; align-items: center; gap: 5px; margin-bottom: 8px; font-size: 0.78rem; font-weight: 700; color: #a07800; }
.glock--emph .glock__title { margin-bottom: 18px; font-size: 1.3rem; line-height: 1.38; white-space: pre-line; text-wrap: balance; }
.glock--emph .glock__actions { gap: 10px; }
.glock--emph .glock__note { margin-top: 8px; font-size: 0.72rem; }
</style>

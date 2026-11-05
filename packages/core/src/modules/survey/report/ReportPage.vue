<template>
  <section class="rp-page">
    <div v-if="!cover" class="rp-run">
      <div class="rp-run__l"><img :src="logo" alt="" />{{ T.title }} <em>{{ T.subtitle }}</em></div>
      <div class="rp-run__r">{{ T.summary.respondentId }} {{ meta.id.slice(0, 8) }}<template v-if="meta.date"> · {{ T.summary.date }} {{ meta.date }}</template></div>
    </div>

    <slot />

    <div class="rp-foot">
      <div class="rp-foot__l">
        <img :src="symbol" alt="" />
        <div><template v-for="(line, i) in T.footer" :key="i">{{ line }}<br v-if="i < T.footer.length - 1" /></template></div>
      </div>
      <div class="rp-foot__n">{{ n }} / {{ total }}</div>
    </div>
  </section>
</template>

<script setup lang="ts">
/** A4 한 쪽의 틀 — 공통 머리말(표지 제외)·꼬리말·쪽 번호. 내용은 slot 으로 받는다. */
import logo from '@/assets/report/logo_header.png'
import symbol from '@/assets/report/section1_symbol.png'
import { REPORT_TEXT as T } from './reportText'
import type { ReportMeta } from './reportUtil'

defineProps<{ n: number; total: number; meta: ReportMeta; cover?: boolean }>()
</script>

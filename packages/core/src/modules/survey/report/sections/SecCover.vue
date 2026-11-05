<template>
  <div class="rp-cover">
    <div class="rp-cover__l">
      <img :src="logo" alt="라이트하우스" />
      <div class="rp-cover__title">{{ T.title }}</div>
      <div class="rp-cover__sub">{{ T.subtitle }}</div>
      <div v-if="meta.date" class="rp-cover__date">{{ T.summary.date }} : {{ meta.date }}</div>
    </div>
    <div class="rp-cover__panel">
      <p><template v-for="(l, i) in T.coverPanel" :key="i">{{ l }}<br /></template></p>
      <img :src="symbol" alt="" />
    </div>
  </div>
</template>

<script setup lang="ts">
/** 1쪽 머리 — 로고·제목·검사일·노란 패널 */
import type { ResearchResultData } from '../reportData'
import logo from '@/assets/report/logo_header.png'
import symbol from '@/assets/report/section1_symbol.png'
import { REPORT_TEXT as T } from '../reportText'
import type { ReportMeta } from '../reportUtil'

defineProps<{ data: ResearchResultData; meta: ReportMeta }>()
</script>

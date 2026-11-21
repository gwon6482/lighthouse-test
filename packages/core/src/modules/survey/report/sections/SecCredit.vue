<template>
  <div class="rp-credit">
    <b>{{ T.credit.heading }}</b>
    <p>{{ T.credit.text }}</p>
  </div>
</template>

<script setup lang="ts">
/**
 * 참고(출처, 2026-11-22) — '결과 활용 안내' 바로 아래 작은 글. 회색 띠 머리(ReportSection) 없이 주석 모양으로만.
 * 글은 reportText.ts 의 credit(화면 결과지와 같은 글)
 */
import type { ResearchResultData } from '../reportData'
import { REPORT_TEXT as T } from '../reportText'
import type { ReportMeta } from '../reportUtil'

defineProps<{ data: ResearchResultData; meta: ReportMeta }>()
</script>

<template>
  <ReportSection :title="T.jobs.guideHeading">
    <table class="rp-table"><tr><td style="color: #333">{{ T.jobs.guide }}</td></tr></table>
  </ReportSection>
</template>

<script setup lang="ts">
/** 결과 활용 안내 */
import type { ResearchResultData } from '../reportData'
import ReportSection from '../ReportSection.vue'
import { REPORT_TEXT as T } from '../reportText'
import type { ReportMeta } from '../reportUtil'

defineProps<{ data: ResearchResultData; meta: ReportMeta }>()
</script>

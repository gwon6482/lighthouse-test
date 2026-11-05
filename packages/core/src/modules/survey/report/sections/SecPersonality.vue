<template>
  <ReportSection v-if="factors.length" :title="T.personality.heading" :sub="T.personality.sub">
    <table class="rp-table">
      <tr>
        <th class="l">{{ T.personality.cols.name }}</th>
        <th>{{ T.personality.cols.score }}</th>
        <th>{{ T.personality.cols.avg }}</th>
        <th>{{ T.personality.cols.top }}</th>
        <th><div class="rp-scale"><span>0</span><span>50</span><span>100</span></div></th>
      </tr>
      <tr v-for="(f, i) in factors" :key="f.code">
        <td :class="i < 3 ? 'top' : 'label'">{{ f.name }}</td>
        <td :class="['num', rankScoreClass(i)]">{{ pct(f.score) }}</td>
        <td class="num muted">{{ f.average != null ? pct(f.average) : '-' }}</td>
        <td class="num blue">{{ f.top_percent != null ? f.top_percent + '%' : '-' }}</td>
        <td style="width: 62mm"><ReportBar :value="f.score" :avg="f.average" :color="rankColor(i)" :width="226" /></td>
      </tr>
    </table>
    <ul class="rp-note"><li v-for="t in T.personality.notes" :key="t">{{ t }}</li></ul>
  </ReportSection>
</template>

<script setup lang="ts">
/** 성격 프로파일 — 9요소 점수·평균·상위 %·막대 */
import { computed } from 'vue'
import type { ResearchResultData } from '../reportData'
import ReportSection from '../ReportSection.vue'
import ReportBar from '../ReportBar.vue'
import { REPORT_TEXT as T } from '../reportText'
import { pct, rankColor, rankScoreClass, type ReportMeta } from '../reportUtil'

const props = defineProps<{ data: ResearchResultData; meta: ReportMeta }>()
const factors = computed<any[]>(() => props.data.analysis?.personality?.all ?? [])
</script>

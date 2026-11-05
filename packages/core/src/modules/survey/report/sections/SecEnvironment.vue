<template>
  <ReportSection v-if="parts.length" :title="T.environment.heading" :sub="T.environment.sub">
    <table class="rp-table">
      <tr>
        <th class="l">{{ T.environment.cols.name }}</th>
        <th><div class="rp-scale"><span>1</span><span>3</span><span>5</span></div></th>
        <th>{{ T.environment.cols.level }}</th>
        <th class="l">{{ T.environment.cols.desc }}</th>
      </tr>
      <tr v-for="p in parts" :key="p.code">
        <td class="label" style="width: 30mm">{{ p.name }}</td>
        <td style="width: 46mm">
          <div class="rp-dots">
            <span
              v-for="lv in 5"
              :key="lv"
              :class="['rp-dot', { on: lv === p.level, avg: lv !== p.level && Math.round(p.average) === lv }]"
            />
          </div>
        </td>
        <td class="num rp-level">{{ p.level }}</td>
        <td class="desc">{{ p.level_description }}</td>
      </tr>
    </table>
    <ul class="rp-note"><li v-for="t in T.environment.notes" :key="t">{{ t }}</li></ul>
  </ReportSection>
</template>

<script setup lang="ts">
/** 업무 환경 성향 — 6항목 1~5 척도 */
import { computed } from 'vue'
import type { ResearchResultData } from '../reportData'
import ReportSection from '../ReportSection.vue'
import { REPORT_TEXT as T } from '../reportText'
import type { ReportMeta } from '../reportUtil'

const props = defineProps<{ data: ResearchResultData; meta: ReportMeta }>()
const parts = computed<any[]>(() => props.data.analysis?.environment?.parts ?? [])
</script>

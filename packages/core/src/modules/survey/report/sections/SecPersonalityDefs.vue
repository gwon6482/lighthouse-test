<template>
  <ReportSection v-if="factors.length" :title="T.personalityDefs.heading" :sub="T.personalityDefs.sub">
    <table class="rp-table">
      <tr>
        <th class="l">{{ T.personalityDefs.cols.name }}</th>
        <th class="l">{{ T.personalityDefs.cols.def }}</th>
      </tr>
      <tr v-for="f in factors" :key="f.code">
        <td class="label" style="width: 32mm; white-space: nowrap">{{ f.name }}</td>
        <td class="desc">{{ T1_DEFINITIONS[f.code] ?? '' }}</td>
      </tr>
    </table>
  </ReportSection>
</template>

<script setup lang="ts">
/** 성격 요소 정의 — 성격 프로파일과 같은 순서(점수순)로 9요소의 뜻. 정의 문장은 화면 결과지와 공유 */
import { computed } from 'vue'
import type { ResearchResultData } from '../reportData'
import { T1_DEFINITIONS } from '../t1Definitions'
import ReportSection from '../ReportSection.vue'
import { REPORT_TEXT as T } from '../reportText'
import type { ReportMeta } from '../reportUtil'

const props = defineProps<{ data: ResearchResultData; meta: ReportMeta }>()
const factors = computed<any[]>(() => props.data.analysis?.personality?.all ?? [])
</script>

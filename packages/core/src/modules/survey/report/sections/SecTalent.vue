<template>
  <ReportSection v-if="talents.length" :title="T.talent.heading" :sub="T.talent.sub">
    <table class="rp-table">
      <tr>
        <th />
        <th class="l">{{ T.talent.cols.name }}</th>
        <th>{{ T.talent.cols.score }}</th>
        <th><div class="rp-scale"><span>0</span><span>100</span></div></th>
        <th class="l">{{ T.talent.cols.desc }}</th>
      </tr>
      <tr v-for="(t, i) in talents" :key="t.code">
        <td class="c"><span v-if="i < 3" :class="['rp-tag', rankTagClass(i)]">{{ T.talent.rank(i + 1) }}</span></td>
        <td :class="i < 3 ? 'top' : 'label'">{{ t.name }}</td>
        <td :class="['num', rankScoreClass(i)]">{{ pct(t.score) }}</td>
        <td style="width: 42mm"><ReportBar :value="t.score" :avg="t.average" :color="rankColor(i)" :width="150" /></td>
        <td class="desc">{{ t.definition }}</td>
      </tr>
    </table>
  </ReportSection>
</template>

<script setup lang="ts">
/** 재능 프로파일 — 8가지 재능·상위 3 강조·설명 */
import { computed } from 'vue'
import type { ResearchResultData } from '../reportData'
import ReportSection from '../ReportSection.vue'
import ReportBar from '../ReportBar.vue'
import { REPORT_TEXT as T } from '../reportText'
import { pct, rankColor, rankScoreClass, rankTagClass, type ReportMeta } from '../reportUtil'

const props = defineProps<{ data: ResearchResultData; meta: ReportMeta }>()
const talents = computed<any[]>(() => props.data.analysis?.talent?.all ?? [])
</script>

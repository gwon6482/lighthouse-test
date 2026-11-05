<template>
  <ReportSection v-if="values.length" :title="T.values.heading" :sub="T.values.sub">
    <table class="rp-table">
      <tr v-for="(v, i) in values" :key="v.code">
        <td class="c" style="width: 18mm"><span :class="['rp-tag', rankTagClass(i)]">{{ T.values.rank(i + 1) }}</span></td>
        <td class="strong" style="width: 28mm">{{ v.name }}</td>
        <td class="desc">{{ v.definition }}</td>
      </tr>
    </table>
  </ReportSection>
</template>

<script setup lang="ts">
/** 나의 가치관 — 1~3순위 */
import { computed } from 'vue'
import type { ResearchResultData } from '../reportData'
import ReportSection from '../ReportSection.vue'
import { REPORT_TEXT as T } from '../reportText'
import { rankTagClass, type ReportMeta } from '../reportUtil'

const props = defineProps<{ data: ResearchResultData; meta: ReportMeta }>()
const values = computed<any[]>(() => {
  const v = props.data.analysis?.values ?? {}
  return [v.priority_1, v.priority_2, v.priority_3].filter(Boolean)
})
</script>

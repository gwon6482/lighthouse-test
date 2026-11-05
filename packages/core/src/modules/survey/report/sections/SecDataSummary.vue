<template>
  <ReportSection :title="T.summary.heading">
    <table class="rp-table rp-kv">
      <tr>
        <td><b>{{ T.summary.respondentId }}</b>{{ meta.id }}</td>
        <td><template v-if="meta.date"><b>{{ T.summary.date }}</b>{{ meta.date }}</template></td>
      </tr>
      <tr>
        <td><b>{{ T.summary.parts }}</b>{{ T.summary.partsValue }}</td>
        <td><b>{{ T.summary.items }}</b>{{ T.summary.itemsValue }}</td>
      </tr>
    </table>
  </ReportSection>
</template>

<script setup lang="ts">
/** DATA SUMMARY — 응답 번호·검사일·검사 구성·문항 수 */
import type { ResearchResultData } from '../reportData'
import ReportSection from '../ReportSection.vue'
import { REPORT_TEXT as T } from '../reportText'
import type { ReportMeta } from '../reportUtil'

defineProps<{ data: ResearchResultData; meta: ReportMeta }>()
</script>

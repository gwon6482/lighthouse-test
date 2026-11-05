<template>
  <ReportSection v-if="interests.length" :title="T.interest.heading" :sub="T.interest.sub(a.interest.total)">
    <table class="rp-table rp-table--tight">
      <tr v-for="c in interests" :key="c.name">
        <td class="rp-interest-cat" style="width: 40mm">{{ c.name }}</td>
        <td><span v-for="it in c.items" :key="it.field_id ?? it.name" class="rp-chip">{{ it.name }}</span></td>
      </tr>
    </table>
  </ReportSection>
</template>

<script setup lang="ts">
/** 관심 분야 — 분야별 고른 항목 */
import { computed } from 'vue'
import type { ResearchResultData } from '../reportData'
import ReportSection from '../ReportSection.vue'
import { REPORT_TEXT as T } from '../reportText'
import type { ReportMeta } from '../reportUtil'

const props = defineProps<{ data: ResearchResultData; meta: ReportMeta }>()
const a = computed(() => props.data.analysis ?? {})
const interests = computed<any[]>(() => Object.values(a.value.interest?.by_category ?? {}))
</script>

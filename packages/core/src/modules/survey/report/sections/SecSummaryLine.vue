<template>
  <ReportSection v-if="topInterest || talents[0] || values[0]" :title="T.summaryLine.heading">
    <div class="rp-summary">
      {{ T.summaryLine.pre }}
      <!-- 구절 끝 공백은 {{ ' ' }} 로 넣는다 — </template> 앞의 맨 공백은 Vue 가 지워서 '에서언어' 처럼 붙었다 -->
      <template v-if="topInterest"><span>{{ topInterest }}</span>{{ T.summaryLine.afterInterest }}{{ ' ' }}</template>
      <template v-if="topTalent"><span>{{ topTalent }}</span>{{ objectJosa(topTalent) }} {{ T.summaryLine.afterTalent }}{{ ' ' }}</template>
      <template v-if="values[0]"><span>{{ values[0].name }}</span>{{ objectJosa(values[0].name) }} {{ T.summaryLine.afterValue }}</template>
    </div>
  </ReportSection>
</template>

<script setup lang="ts">
/** 한 줄 요약 — 관심 분야·재능·가치를 한 문장으로 */
import { computed } from 'vue'
import type { ResearchResultData } from '../reportData'
import ReportSection from '../ReportSection.vue'
import { REPORT_TEXT as T } from '../reportText'
import { objectJosa } from '../josa'
import type { ReportMeta } from '../reportUtil'

const props = defineProps<{ data: ResearchResultData; meta: ReportMeta }>()
const a = computed(() => props.data.analysis ?? {})
const talents = computed<any[]>(() => a.value.talent?.all ?? [])
const topTalent = computed(() => a.value.talent?.top3?.[0]?.name ?? talents.value[0]?.name)
const values = computed<any[]>(() => {
  const v = a.value.values ?? {}
  return [v.priority_1, v.priority_2, v.priority_3].filter(Boolean)
})
// 화면 결과지와 같은 규칙 — 고른 항목이 가장 많은 분야
const topInterest = computed(() => {
  const cats = Object.values(a.value.interest?.by_category ?? {}) as any[]
  return cats.length ? cats.reduce((x, y) => (x.items.length >= y.items.length ? x : y)).name : null
})
</script>

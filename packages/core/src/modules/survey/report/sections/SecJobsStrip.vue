<template>
  <ReportSection v-if="jobs.length && data.groups?.length" :title="T.jobsStrip.heading" :sub="T.jobsStrip.sub">
    <div class="rp-js">
      <div v-for="(j, i) in jobs" :key="j.jobCode" class="rp-js__cell">
        <span :class="['rp-tag', i === 0 ? 'rp-tag--y' : 'rp-tag--n']">{{ i + 1 }}</span>
        <span class="rp-js__t">{{ j.title }}</span>
        <small>{{ j.classification?.primary }}</small>
        <span class="rp-js__m">{{ pct(j.match_score) }}%</span>
      </div>
    </div>
    <ul class="rp-note"><li>{{ T.jobsStrip.note }}</li></ul>
  </ReportSection>
</template>

<script setup lang="ts">
/**
 * 직업 순위 Top 5 요약 띠 — **앱 전용**(2026-11-09). 직무 3가지 표 바로 밑에 순위·직업·매칭도만 가로 5칸.
 * 막대·급여·만족도는 뺐다 — 넣으면 4쪽이 넘친다(시안 B 한 줄 표에서 실측). 직무가 없으면 그리지 않는다(SecJobs 가 대신)
 */
import { computed } from 'vue'
import type { ResearchResultData } from '../reportData'
import ReportSection from '../ReportSection.vue'
import { REPORT_TEXT as T } from '../reportText'
import { pct, type ReportMeta } from '../reportUtil'

const props = defineProps<{ data: ResearchResultData; meta: ReportMeta }>()
const jobs = computed<any[]>(() => props.data.recommend ?? [])
</script>

<template>
  <ReportSection v-if="groups.length" :title="T.jobGroups.heading" :sub="T.jobGroups.sub">
    <table class="rp-table">
      <tr>
        <th />
        <th class="l">{{ T.jobGroups.cols.name }}</th>
        <th>{{ T.jobGroups.cols.detail }}</th>
        <th class="l">{{ T.jobGroups.cols.why }}</th>
      </tr>
      <tr v-for="(g, i) in groups" :key="g.code">
        <td class="c"><span :class="['rp-tag', i === 0 ? 'rp-tag--y' : 'rp-tag--n']">{{ i + 1 }}</span></td>
        <td class="rp-job" style="width: 58mm">
          <span class="rp-job__t">{{ g.name }}</span>
          <small>{{ T.jobGroups.reps(g.jobs.slice(0, 3).map((j) => j.title), rest(g)) }}</small>
        </td>
        <td style="width: 56mm">
          <!-- 화면 직무 카드·Top 5 와 같은 막대 — 대표 직업 3개의 평균 -->
          <div class="rp-jbars">
            <template v-for="row in detail(g)" :key="row.key">
              <span :class="['rp-jbars__l', `rp-jbars--${row.key}`]">{{ row.label }}</span>
              <span class="rp-jbars__t"><span :class="['rp-jbars__f', `rp-jbars--${row.key}`]" :style="{ width: pct(row.value) + '%' }" /></span>
              <span :class="['rp-jbars__v', `rp-jbars--${row.key}`]">{{ pct(row.value) }}</span>
            </template>
          </div>
        </td>
        <td class="rp-grp-why">
          <template v-if="g.reasons.length">
            <template v-for="(r, k) in g.reasons" :key="r.axis + r.code"><template v-if="k"> · </template><b :class="['rp-kw', { 'rp-kw--t1': r.axis === 'T1' }]">{{ r.name }}</b><span class="rp-ax">({{ T.jobGroups.axis[r.axis] }})</span></template>
          </template>
          <template v-else>-</template>
        </td>
      </tr>
    </table>
    <ul class="rp-note"><li v-for="t in T.jobGroups.notes" :key="t">{{ t }}</li></ul>
  </ReportSection>
</template>

<script setup lang="ts">
/** 나에게 맞는 직무 3가지(2026-11-09) — 랜딩 정본과 같다. 응답의 groups 가 비면 그리지 않는다(SecJobs 가 대신) */
import { computed } from 'vue'
import type { ResearchResultData } from '../reportData'
import type { JobGroupRecommend } from '../../types/survey'
import ReportSection from '../ReportSection.vue'
import { REPORT_TEXT as T } from '../reportText'
import { pct, t2Score, type ReportMeta } from '../reportUtil'

const props = defineProps<{ data: ResearchResultData; meta: ReportMeta }>()
const groups = computed<JobGroupRecommend[]>(() => props.data.groups ?? [])
// '외 N개' — 대표 3자리가 묶음 직업이면 그 안의 직업 수만큼 센다(화면 '직업 N개'와 같은 기준)
const rest = (g: JobGroupRecommend) => g.jobCount - g.jobs.slice(0, 3).reduce((s, j) => s + (j.members?.length ?? 1), 0)
const detail = (g: JobGroupRecommend) => {
  const d = g.match_detail
  return [
    { key: 't1', label: T.jobs.detail.t1, value: d.T1 },
    { key: 't2', label: T.jobs.detail.t2, value: t2Score(d) },
    { key: 't3', label: T.jobs.detail.t3, value: d.T3 },
  ]
}
</script>

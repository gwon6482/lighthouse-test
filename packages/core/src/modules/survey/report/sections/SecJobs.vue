<template>
  <ReportSection v-if="jobs.length" :title="T.jobs.heading" :sub="T.jobs.sub">
    <table class="rp-table">
      <tr>
        <th />
        <th class="l">{{ T.jobs.cols.name }}</th>
        <th>{{ T.jobs.cols.match }}</th>
        <th>{{ T.jobs.cols.detail }}</th>
        <th>{{ T.jobs.cols.meta }}</th>
      </tr>
      <tr v-for="(j, i) in jobs" :key="j.jobCode">
        <td class="c"><span :class="['rp-tag', i === 0 ? 'rp-tag--y' : 'rp-tag--n']">{{ i + 1 }}</span></td>
        <td class="rp-job" style="width: 48mm">
          <span class="rp-job__t">{{ j.title }}</span>
          <span v-if="isCurrentJob(j, data.currentJob ?? null)" class="rp-cj__mine">{{ T.currentJob.mine }}</span>
          <small v-if="j.members?.length > 1">{{ j.members.map((m: any) => m.title).join(' · ') }}</small>
          <small>{{ j.classification?.primary }}</small>
        </td>
        <td class="num rp-match">{{ pct(j.match_score) }}%</td>
        <td style="width: 62mm">
          <!-- 화면 결과지(ResearchResult .rr__job-bars)와 같은 모양: 색 점 라벨 · 단색 3색 막대 · 숫자 -->
          <div class="rp-jbars">
            <template v-for="row in detail(j)" :key="row.key">
              <span :class="['rp-jbars__l', `rp-jbars--${row.key}`]">{{ row.label }}</span>
              <span class="rp-jbars__t"><span :class="['rp-jbars__f', `rp-jbars--${row.key}`]" :style="{ width: pct(row.value) + '%' }" /></span>
              <span :class="['rp-jbars__v', `rp-jbars--${row.key}`]">{{ pct(row.value) }}</span>
            </template>
          </div>
        </td>
        <td class="c rp-jobmeta">
          {{ j.salary?.median ? T.jobs.salary(j.salary.median) : '-' }}<br />
          {{ j.jobSatisfaction ? T.jobs.satisfaction(j.jobSatisfaction) : '' }}
        </td>
      </tr>
    </table>
    <ul class="rp-note"><li v-for="t in T.jobs.notes" :key="t">{{ t }}</li></ul>
  </ReportSection>
</template>

<script setup lang="ts">
/** 추천 직업 Top 5 */
import { computed } from 'vue'
import type { ResearchResultData } from '../reportData'
import ReportSection from '../ReportSection.vue'
import { REPORT_TEXT as T } from '../reportText'
import { pct, t2Score, type ReportMeta } from '../reportUtil'
import { isCurrentJob } from '../currentJobMatch'

const props = defineProps<{ data: ResearchResultData; meta: ReportMeta }>()
const jobs = computed<any[]>(() => props.data.recommend ?? [])
const detail = (j: any) => {
  const d = j.match_detail ?? {}
  return [
    { key: 't1', label: T.jobs.detail.t1, value: d.T1 ?? 0 },
    { key: 't2', label: T.jobs.detail.t2, value: t2Score({ T21: d.T21 ?? 0, T22: d.T22 ?? 0, T23: d.T23 ?? 0 }) },
    { key: 't3', label: T.jobs.detail.t3, value: d.T3 ?? 0 },
  ]
}
</script>

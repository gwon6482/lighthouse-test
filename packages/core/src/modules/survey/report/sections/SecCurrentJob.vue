<template>
  <ReportSection v-if="cj" :title="T.currentJob.heading" :sub="T.currentJob.sub">
    <table class="rp-table">
      <tr>
        <td class="rp-job" style="width: 58mm">
          <span class="rp-cj__name">{{ cj.selected?.title?.trim() || cj.title }}</span>
          <small v-if="groupNote">{{ groupNote }}</small>
          <template v-if="cj.rankable">
            <span class="rp-cj__rank">{{ currentJobRankText(cj) }}</span>
            <span v-if="band" :class="['rp-cj__band', `is-${band.key}`]">{{ band.text }}</span>
          </template>
          <small v-else>{{ RANKLESS_NOTE }}</small>
          <span v-if="cj.inTop" class="rp-cj__top5">{{ T.currentJob.inTop }}</span>
          <span class="rp-cj__area">{{ currentJobAreaSummary(cj) }}</span>
        </td>
        <td style="width: 24mm"><div style="display: flex; justify-content: center"><MatchRing :value="cj.match_score" color="#ffd100" text-color="#1a1a1a" :size="70" /></div></td>
        <td>
          <div class="rp-jbars">
            <template v-for="row in rows" :key="row.key">
              <span :class="['rp-jbars__l', `rp-jbars--${row.key}`]">{{ row.label }}</span>
              <span class="rp-jbars__t"><span :class="['rp-jbars__f', `rp-jbars--${row.key}`]" :style="{ width: pct(row.value) + '%' }" /></span>
              <span :class="['rp-jbars__v', `rp-jbars--${row.key}`]">{{ pct(row.value) }}</span>
            </template>
          </div>
        </td>
      </tr>
      <!-- 같은 분야 — 순위를 믿을 수 있을 때만 -->
      <tr v-if="cj.rankable && cj.field && cj.field.total > 1">
        <td colspan="3" class="rp-cj__field">
          <b>{{ FIELD_HEADING }}</b>
          <span class="rp-cj__field-sub">{{ currentJobFieldRankText(cj) }}</span>
          <span v-if="cj.field.better.length" class="rp-cj__field-list">
            <span v-for="b in cj.field.better" :key="b.jobCode" class="rp-cj__peer">
              {{ b.title.trim() }} <em>{{ b.rank }}위</em> <b>{{ pct(b.match_score) }}%</b>
            </span>
          </span>
          <span v-else class="rp-cj__field-sub">{{ FIELD_TOP_NOTE }}</span>
        </td>
      </tr>
    </table>
  </ReportSection>
</template>

<script setup lang="ts">
/** 현재 직업과의 매칭도 (실무자만) — 해석 규칙은 composables/currentJobMatch.ts (화면과 공유) */
import { computed } from 'vue'
import type { ResearchResultData } from '../reportData'
import {
  currentJobAreaSummary, currentJobBand, currentJobFieldRankText, currentJobGroupNote, currentJobRankText,
  FIELD_HEADING, FIELD_TOP_NOTE, RANKLESS_NOTE,
} from '../currentJobMatch'
import ReportSection from '../ReportSection.vue'
import MatchRing from '../MatchRing.vue'
import { REPORT_TEXT as T } from '../reportText'
import { pct, t2Score, type ReportMeta } from '../reportUtil'

const props = defineProps<{ data: ResearchResultData; meta: ReportMeta }>()
const cj = computed(() => props.data.currentJob ?? null)
const band = computed(() => (cj.value ? currentJobBand(cj.value) : null))
const groupNote = computed(() => (cj.value ? currentJobGroupNote(cj.value) : null))
const rows = computed(() => {
  const d = cj.value?.match_detail ?? { T1: 0, T21: 0, T22: 0, T23: 0, T3: 0 }
  return [
    { key: 't1', label: T.jobs.detail.t1, value: d.T1 },
    { key: 't2', label: T.jobs.detail.t2, value: t2Score(d) },
    { key: 't3', label: T.jobs.detail.t3, value: d.T3 },
  ]
})
</script>

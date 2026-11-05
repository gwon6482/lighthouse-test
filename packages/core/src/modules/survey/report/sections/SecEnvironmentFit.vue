<template>
  <ReportSection v-if="texts" :title="T.environment.fitHeading">
    <div class="rp-two">
      <div class="rp-box rp-box--g">
        <h4>{{ T.environment.good }}</h4>
        <p v-for="t in texts.good ?? []" :key="t.part">{{ t.text }}</p>
        <div class="rp-chips"><span v-for="w in we?.good ?? []" :key="w.code" class="rp-chip">{{ w.name }}</span></div>
      </div>
      <div class="rp-box rp-box--r">
        <h4>{{ T.environment.bad }}</h4>
        <p v-for="t in texts.bad ?? []" :key="t.part">{{ t.text }}</p>
        <div class="rp-chips"><span v-for="w in we?.bad ?? []" :key="w.code" class="rp-chip">{{ w.name }}</span></div>
      </div>
    </div>
  </ReportSection>
</template>

<script setup lang="ts">
/** 나에게 맞는 / 맞지 않는 환경 */
import { computed } from 'vue'
import type { ResearchResultData } from '../reportData'
import ReportSection from '../ReportSection.vue'
import { REPORT_TEXT as T } from '../reportText'
import type { ReportMeta } from '../reportUtil'

const props = defineProps<{ data: ResearchResultData; meta: ReportMeta }>()
const texts = computed(() => props.data.analysis?.environment?.texts ?? null)
const we = computed(() => props.data.analysis?.environment?.weItems ?? null)
</script>

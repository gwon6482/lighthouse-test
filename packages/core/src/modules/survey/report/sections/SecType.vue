<template>
  <ReportSection v-if="pt" :title="T.type.heading">
    <div class="rp-type">
      <!-- 앱: 성격 유형 그림 원본(public/T1_img). 랜딩은 이걸 줄인 /survey/t1/*.webp 를 쓴다 — 앱엔 그 경로가 없어 HTML 이 와서 PDF 가 깨졌다 -->
      <img v-if="pt.base_type" :src="`/T1_img/${pt.base_type}-Photoroom.png`" alt="" />
      <div>
        <p class="rp-type__name">{{ pt.full_name }}</p>
        <p class="rp-type__desc">{{ pt.description }}</p>
        <span class="rp-tag rp-tag--y">{{ pt.base_name }}</span>
        <span class="rp-tag rp-tag--b">{{ pt.modifier }}</span>
      </div>
    </div>
  </ReportSection>
</template>

<script setup lang="ts">
/** 성격 유형 — 그림·이름·설명·태그 */
import { computed } from 'vue'
import type { ResearchResultData } from '../reportData'
import ReportSection from '../ReportSection.vue'
import { REPORT_TEXT as T } from '../reportText'
import type { ReportMeta } from '../reportUtil'

const props = defineProps<{ data: ResearchResultData; meta: ReportMeta }>()
const pt = computed(() => props.data.analysis?.personality_type)
</script>

<template>
  <div
    class="pi-wrap"
    :style="{ '--pi-area': introData.color.text, '--pi-area-bg': introData.color.bg }"
  >

    <!-- 영역색 짧은 선 -->
    <span class="pi-rule" />

    <!-- 메타 + 타이틀 -->
    <div class="pi-hero">
      <p class="pi-meta">
        <span class="pi-label">{{ introData.partLabel }}</span>
        · {{ introData.questionCount }}
        <template v-if="introData.estimatedMinutes"> · 약 {{ introData.estimatedMinutes }}분</template>
      </p>
      <h2 class="pi-title">{{ introData.title }}</h2>
      <p class="pi-desc">{{ introData.description }}</p>
    </div>

    <!-- 핵심 안내 -->
    <ul class="pi-highlights">
      <li v-for="(item, i) in introData.highlights" :key="i" class="pi-hi-item">
        <span class="pi-hi-check"><AppIcon name="ui-check" /></span>
        <span class="pi-hi-text">{{ item }}</span>
      </li>
    </ul>

  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
/**
 * SurveyPartIntro 컴포넌트
 *
 * T1 / T21 / T3 파트 시작 전 렌더되는 파트 소개 화면(표지).
 * "다음" 버튼은 SelfUnderstandingTestPage 의 SurveyNavBtnNext 를 그대로 사용.
 * 표지는 페이지 수·진행률 계산에서 빠진다(useSurvey 의 isPartIntro).
 *
 * 콘텐츠(introData)는 useSurvey.ts 의 partIntros 객체에 하드코딩.
 * 문구·문항수·예상시간·영역색 수정 시 useSurvey.ts 의 partIntros 를 수정할 것.
 *
 * SURVEY_FLOW_UPDATE.md 참고
 */
import type { PartIntroData } from '@/modules/survey/types/survey'

defineProps<{ introData: PartIntroData }>()
</script>

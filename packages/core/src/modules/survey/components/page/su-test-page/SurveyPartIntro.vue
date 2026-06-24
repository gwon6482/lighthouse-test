<template>
  <div class="pi-wrap">

    <!-- 상단 메타 -->
    <div class="pi-meta-row">
      <span class="pi-label">{{ introData.partLabel }}</span>
      <div class="pi-badges">
        <span class="pi-badge count">{{ introData.questionCount }}</span>
        <span v-if="introData.estimatedMinutes" class="pi-badge time">
          ⏱ 약 {{ introData.estimatedMinutes }}분
        </span>
      </div>
    </div>

    <!-- 이모지 + 타이틀 -->
    <div class="pi-hero">
      <span class="pi-emoji">{{ introData.emoji }}</span>
      <h2 class="pi-title">{{ introData.title }}</h2>
      <p class="pi-desc">{{ introData.description }}</p>
    </div>

    <!-- 핵심 안내 -->
    <ul class="pi-highlights">
      <li v-for="(item, i) in introData.highlights" :key="i" class="pi-hi-item">
        <span class="pi-hi-dot" />
        <span class="pi-hi-text">{{ item }}</span>
      </li>
    </ul>

  </div>
</template>

<script setup lang="ts">
/**
 * SurveyPartIntro 컴포넌트
 *
 * T1 / T21 / T3 파트 시작 전 렌더되는 파트 소개 화면.
 * "다음" 버튼은 SelfUnderstandingTestPage 의 SurveyNavBtnNext 를 그대로 사용.
 *
 * 콘텐츠(introData)는 useSurvey.ts 의 partIntros 객체에 하드코딩.
 * 문구·문항수·예상시간 수정 시 useSurvey.ts 의 partIntros 를 수정할 것.
 *
 * SURVEY_FLOW_UPDATE.md 참고
 */
import type { PartIntroData } from '@/modules/survey/types/survey'

defineProps<{ introData: PartIntroData }>()
</script>

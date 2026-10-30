<template>
  <div class="su-main">
    <!-- 헤더 -->
    <AppHeader />

    <!-- 타이틀 -->
    <div class="su-main__hero">
      <h1 class="su-main__title">자기 이해</h1>
      <p class="su-main__subtitle">내 성격과 재능, 흥미를 알아보는 단계예요</p>
    </div>

    <!-- 소개 박스 -->
    <JourneyIntro
      class="su-main__intro"
      :step="0"
      headlineMain="나를 알면,"
      headlineEm="길이 보여요."
      bodyLine1="진로는 다른 사람이 정해 줄 수 없어요."
      bodyLine2="내 성격과 재능, 흥미를 알아보는 것부터 시작해 볼게요."
    />

    <!-- 검사 절차 -->
    <div class="su-main__section">
      <h2 class="su-main__section-title">검사 절차</h2>
      <p class="su-main__section-sub">총 3개 파트 · 약 10분 소요</p>

      <div class="su-main__parts">
        <div v-for="part in parts" :key="part.label" class="su-main__part-card">
          <div class="su-main__part-top">
            <div class="su-main__part-left">
              <span class="su-main__part-label" :style="{ color: part.area.text }">{{ part.label }}</span>
              <span class="su-main__part-title">{{ part.title }}</span>
            </div>
          </div>
          <p class="su-main__part-desc">{{ part.desc }}</p>
          <div class="su-main__part-keywords">
            <span
              v-for="keyword in part.keywords"
              :key="keyword"
              class="su-main__keyword"
              :style="{ color: part.area.text, background: part.area.bg, borderColor: part.area.line }"
            >
              #{{ keyword }}
            </span>
          </div>
        </div>
      </div>

      <!-- 팁 -->
      <div class="su-main__tips">
        <p class="su-main__tips-title">이렇게 답해 주세요</p>
        <ul class="su-main__tip-list">
          <li v-for="tip in tips" :key="tip.text" class="su-main__tip-item">
            <span class="su-main__tip-icon"><AppIcon :name="tip.icon" /></span>
            <span>{{ tip.text }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- 검사 시작 버튼 -->
    <div class="su-main__footer">
      <button class="su-main__cta" @click="router.push('/self-understanding/select')">
        검사 시작하기
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppIcon from '@/shared/components/AppIcon.vue'
import { AREA_COLOR, TIP_ICON } from '@/modules/survey/surveyIcons'
import { useRouter } from 'vue-router'
import AppHeader from '@/shared/components/AppHeader.vue'
import JourneyIntro from '@/shared/components/JourneyIntro.vue'

const router = useRouter()

// 영역 색(area)은 surveyIcons.AREA_COLOR 한 곳에서 — 파트 표지(SurveyPartIntro)와 같은 값
// keywords — 설명을 다 읽지 않아도 한눈에 보이는 요약 배지
const parts = [
  {
    label: '파트 1',
    title: '성격 & 기질',
    desc: '타고난 기질과 성격을 9가지 요소로 분석해요. 나를 이해하는 가장 기본적인 자료가 돼요.',
    keywords: ['기질', '성격'],
    area: AREA_COLOR.personality,
  },
  {
    label: '파트 2',
    title: '좋아하는 일',
    desc: '재능·흥미·가치관 3가지 영역에서 내가 잘하는 것, 좋아하는 것, 중요하게 여기는 것을 찾아요.',
    keywords: ['재능', '흥미', '가치관'],
    area: AREA_COLOR.likes,
  },
  {
    label: '파트 3',
    title: '업무 환경',
    desc: '좋아하는 일이라도 환경이 맞지 않으면 힘들 수 있어요. 나에게 맞는 근무 환경을 미리 확인해요.',
    keywords: ['근무 환경', '일하는 방식'],
    area: AREA_COLOR.environment,
  },
]

const tips = [
  { icon: TIP_ICON.honest, text: '정답은 없어요. 지금 내 모습 그대로 솔직하게 답해 주세요.' },
  { icon: TIP_ICON.quick, text: '너무 오래 고민하지 말고 처음 떠오르는 대로 골라 주세요.' },
  { icon: TIP_ICON.warning, text: '중간에 그만두면 처음부터 다시 해야 해요.' },
]
</script>

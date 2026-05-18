<template>
  <div class="cd-main">
    <!-- 헤더 -->
    <header class="cd-main__header">
      <button class="cd-main__back" @click="router.back()">‹</button>
      <img class="cd-main__logo" src="/career-design/logo-lighthouse.svg" alt="LightHouse" />
      <button class="cd-main__menu">≡</button>
    </header>

    <!-- 타이틀 -->
    <div class="cd-main__hero">
      <h1 class="cd-main__title">진로계획 세우기</h1>
      <p class="cd-main__subtitle">목표를 향한 체계적인 준비</p>
    </div>

    <!-- 진로계획 가이드 -->
    <div class="cd-main__guide">
      <h2 class="cd-main__section-title">어떻게 진행되나요?</h2>

      <!-- STEP 1: 목표 설정 -->
      <div class="cd-main__step-card">
        <div class="cd-main__step-header">
          <span class="cd-main__step-no">STEP 01</span>
          <span class="cd-main__step-title">목표 설정</span>
        </div>
        <div class="cd-main__step-preview">
          <div class="g-row">
            <span class="g-label">목표 직무</span>
            <div class="g-input-mock">마케팅 기획자<span class="g-cursor" /></div>
          </div>
          <div class="g-row">
            <span class="g-label">준비 기간</span>
            <div class="g-date-row">
              <div class="g-date-mock">2024.01</div>
              <span class="g-tilde">~</span>
              <div class="g-date-mock">2025.12</div>
            </div>
          </div>
          <div class="g-row">
            <span class="g-label">목표 직무</span>
            <div class="g-chip-row">
              <span class="g-duty-chip">마케팅 기획안 작성</span>
              <span class="g-duty-chip">데이터 분석</span>
              <span class="g-add-chip">+ 추가</span>
            </div>
          </div>
        </div>
        <p class="cd-main__step-desc">목표 직무, 준비 기간, 맡고 싶은 직무를 입력해요</p>
      </div>

      <!-- STEP 2: 프로젝트 구성 -->
      <div class="cd-main__step-card">
        <div class="cd-main__step-header">
          <span class="cd-main__step-no">STEP 02</span>
          <span class="cd-main__step-title">프로젝트 구성</span>
        </div>
        <div class="cd-main__step-preview">
          <div class="g-cat-tabs">
            <span class="g-cat-tab" style="color:#1DB95A; border-bottom-color:#1DB95A">자격요건</span>
            <span class="g-cat-tab g-cat-tab--off">분야지식</span>
            <span class="g-cat-tab g-cat-tab--off">직무기술</span>
            <span class="g-cat-tab g-cat-tab--off">포트폴리오</span>
          </div>
          <div class="g-proj-list">
            <div class="g-proj-chip" style="border-color:#1DB95A; color:#1DB95A; background:color-mix(in srgb,#1DB95A 8%,white)">GA4 자격증 준비</div>
            <div class="g-proj-chip" style="border-color:#1DB95A; color:#1DB95A; background:color-mix(in srgb,#1DB95A 8%,white)">SMAT 마케팅 자격증</div>
            <div class="g-proj-add">+ 프로젝트 추가</div>
          </div>
        </div>
        <p class="cd-main__step-desc">자격요건·분야지식·직무기술·포트폴리오 4가지 카테고리로 프로젝트를 추가해요</p>
      </div>

      <!-- STEP 3: 타임라인 배치 -->
      <div class="cd-main__step-card">
        <div class="cd-main__step-header">
          <span class="cd-main__step-no">STEP 03</span>
          <span class="cd-main__step-title">타임라인 배치</span>
        </div>
        <div class="cd-main__step-preview">
          <div class="g-pool-row">
            <div class="g-pool-chip" style="border-color:#1DB95A;color:#1DB95A">GA4 자격증</div>
            <div class="g-pool-chip" style="border-color:#F47820;color:#F47820">마케팅 원론</div>
            <div class="g-pool-chip" style="border-color:#A855F7;color:#A855F7">Figma 기초</div>
          </div>
          <div class="g-arrow-hint">↓ 탭 후 월을 선택해 배치</div>
          <div class="g-slot g-slot--filled">
            <span class="g-slot-badge">2024년 1월</span>
            <div class="g-slot-item" style="border-left-color:#1DB95A">GA4 자격증<span class="g-slot-cat" style="color:#1DB95A">자격요건</span></div>
          </div>
          <div class="g-slot g-slot--empty">
            <span class="g-slot-badge">2024년 2월</span>
            <span class="g-slot-empty-text">여기에 배치</span>
          </div>
        </div>
        <p class="cd-main__step-desc">프로젝트를 선택하고 원하는 월에 탭해서 타임라인을 채워요</p>
      </div>

      <!-- STEP 4: 계획 완성 -->
      <div class="cd-main__step-card">
        <div class="cd-main__step-header">
          <span class="cd-main__step-no">STEP 04</span>
          <span class="cd-main__step-title">계획 완성</span>
        </div>
        <div class="cd-main__step-preview">
          <div class="g-result-top">
            <span class="g-result-job">🎯 마케팅 기획자</span>
            <span class="g-result-period">2024.01 ~ 2025.12</span>
          </div>
          <div class="g-result-timeline">
            <div class="g-rt-row">
              <div class="g-rt-dot" /><div class="g-rt-line" />
              <div class="g-rt-content">
                <span class="g-rt-month">2024년 1월</span>
                <div class="g-rt-item" style="border-left-color:#1DB95A">GA4 자격증 준비</div>
              </div>
            </div>
            <div class="g-rt-row">
              <div class="g-rt-dot" /><div class="g-rt-line" />
              <div class="g-rt-content">
                <span class="g-rt-month">2024년 3월</span>
                <div class="g-rt-item" style="border-left-color:#F47820">마케팅 원론</div>
              </div>
            </div>
            <div class="g-rt-row">
              <div class="g-rt-dot" />
              <div class="g-rt-content">
                <span class="g-rt-month">2024년 6월</span>
                <div class="g-rt-item" style="border-left-color:#4480F5">포트폴리오 완성</div>
              </div>
            </div>
          </div>
        </div>
        <p class="cd-main__step-desc">완성된 진로 로드맵으로 체계적인 준비를 시작해요</p>
      </div>
    </div>

    <!-- 나의 좋아요 직업 -->
    <div class="cd-main__card-wrap">
      <h2 class="cd-main__section-title">나의 좋아요 직업</h2>
      <div class="cd-main__job-list">
        <RecommendedJobCard
          v-for="job in likedJobs"
          :key="job.jobCode"
          :job="job"
        />
      </div>
    </div>

    <!-- 하단 버튼 -->
    <div class="cd-main__footer">
      <button class="cd-main__cta" @click="startPlan">진로계획 시작하기</button>
      <button class="cd-main__cta-secondary" @click="goToExplore">진로계획 탐색하기</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useCareerDesign } from '../composables/useCareerDesign'
import RecommendedJobCard from '../../encyclopedia/components/page/home/RecommendedJobCard.vue'
import type { JobSummary } from '../../encyclopedia/types/encyclopedia'

const router = useRouter()
const { resetDraftPlan } = useCareerDesign()

function startPlan() {
  resetDraftPlan()
  router.push('/career-design/plan/new')
}

const likedJobs: JobSummary[] = [
  {
    jobCode: '013601',
    title: '마케팅 기획자',
    classification: { primary: '경영·사무·금융·보험직', secondary: '광고·홍보·조사 전문가' },
  },
  {
    jobCode: '013602',
    title: '콘텐츠 마케터',
    classification: { primary: '문화·예술·디자인·방송직', secondary: '작가·출판 전문가' },
  },
  {
    jobCode: '013603',
    title: '브랜드 매니저',
    classification: { primary: '경영·사무·금융·보험직', secondary: '마케팅 전문가' },
  },
]

function goToExplore() {
  router.push('/career-design/explore')
}
</script>

<style lang="scss">
.cd-main {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: #fff;
  }

  &__back,
  &__menu {
    background: none;
    border: none;
    font-size: 24px;
    color: #333;
    cursor: pointer;
    padding: 4px;
    width: 36px;
    text-align: center;
  }

  &__logo {
    height: 28px;
    width: auto;
  }

  &__hero {
    padding: 40px 20px 24px;
    text-align: center;
  }

  &__title {
    font-size: 28px;
    font-weight: 800;
    color: #222;
    margin-bottom: 8px;
  }

  &__subtitle {
    font-size: 14px;
    color: #888;
  }

  &__guide {
    padding: 0 20px 4px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  /* 단계 카드 */
  &__step-card {
    background: #fff;
    border-radius: 16px;
    padding: 18px 16px 16px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__step-header {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__step-no {
    font-size: 11px;
    font-weight: 800;
    color: #FFC700;
    background: #FFFBEC;
    padding: 3px 8px;
    border-radius: 6px;
    letter-spacing: 0.3px;
  }

  &__step-title {
    font-size: 15px;
    font-weight: 700;
    color: #222;
  }

  &__step-preview {
    background: #F8F8F8;
    border-radius: 12px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__step-desc {
    font-size: 12px;
    color: #999;
    line-height: 1.6;
  }

  /* ─── 미리보기 공용 요소 ─── */
  .g-label {
    font-size: 10px;
    font-weight: 600;
    color: #aaa;
    min-width: 46px;
  }

  .g-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .g-input-mock {
    flex: 1;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 500;
    color: #222;
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .g-cursor {
    display: inline-block;
    width: 1.5px;
    height: 12px;
    background: #FFC700;
    animation: blink 1s step-end infinite;
  }

  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

  .g-date-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .g-date-mock {
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 5px 10px;
    font-size: 12px;
    font-weight: 500;
    color: #444;
  }

  .g-tilde { font-size: 12px; color: #aaa; }

  .g-chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    flex: 1;
  }

  .g-duty-chip {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 4px 8px;
    font-size: 11px;
    color: #444;
  }

  .g-add-chip {
    border: 1.5px dashed #FFC700;
    border-radius: 8px;
    padding: 4px 8px;
    font-size: 11px;
    font-weight: 600;
    color: #FFC700;
  }

  /* STEP 2 */
  .g-cat-tabs {
    display: flex;
    gap: 0;
    border-bottom: 1.5px solid #eee;
  }

  .g-cat-tab {
    flex: 1;
    text-align: center;
    font-size: 11px;
    font-weight: 700;
    padding: 6px 2px;
    border-bottom: 2px solid transparent;
    margin-bottom: -1.5px;
    color: #aaa;

    &:first-child { border-bottom-color: inherit; }
  }

  .g-cat-tab--off { font-weight: 500; }

  .g-proj-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .g-proj-chip {
    border: 1.5px solid;
    border-radius: 10px;
    padding: 7px 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .g-proj-add {
    border: 1.5px dashed #FFC700;
    border-radius: 10px;
    padding: 7px 12px;
    font-size: 12px;
    font-weight: 600;
    color: #FFC700;
    text-align: center;
  }

  /* STEP 3 */
  .g-pool-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .g-pool-chip {
    border: 1.5px solid;
    border-radius: 20px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 500;
  }

  .g-arrow-hint {
    font-size: 11px;
    color: #bbb;
    text-align: center;
  }

  .g-slot {
    border-radius: 10px;
    padding: 8px 10px;
    display: flex;
    flex-direction: column;
    gap: 6px;

    &--filled { background: #fff; border: 1px solid #eee; }
    &--empty  { border: 1.5px dashed #e0e0e0; }
  }

  .g-slot-badge {
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    background: #FFC700;
    padding: 2px 8px;
    border-radius: 10px;
    align-self: flex-start;
  }

  .g-slot-item {
    border-left: 2.5px solid;
    border-radius: 6px;
    padding: 5px 10px;
    font-size: 11px;
    font-weight: 500;
    color: #222;
    background: #fafafa;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .g-slot-cat {
    margin-left: auto;
    font-size: 10px;
    font-weight: 600;
  }

  .g-slot-empty-text {
    font-size: 11px;
    color: #ccc;
    text-align: center;
    padding: 2px 0 4px;
  }

  /* STEP 4 */
  .g-result-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .g-result-job {
    font-size: 13px;
    font-weight: 700;
    color: #222;
  }

  .g-result-period {
    font-size: 11px;
    color: #aaa;
  }

  .g-result-timeline {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .g-rt-row {
    display: flex;
    gap: 10px;
    align-items: flex-start;
  }

  .g-rt-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #FFC700;
    flex-shrink: 0;
    margin-top: 4px;
  }

  .g-rt-line {
    position: absolute;
  }

  .g-rt-row {
    position: relative;
    padding-left: 0;

    &:not(:last-child)::before {
      content: '';
      position: absolute;
      left: 3.5px;
      top: 12px;
      bottom: -6px;
      width: 1px;
      background: #eee;
    }
  }

  .g-rt-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-bottom: 10px;
  }

  .g-rt-month {
    font-size: 11px;
    font-weight: 700;
    color: #444;
  }

  .g-rt-item {
    border-left: 2.5px solid;
    border-radius: 6px;
    padding: 5px 10px;
    font-size: 11px;
    color: #333;
    background: #fff;
  }

  &__card-wrap {
    flex: 1;
    padding: 20px;
  }

  &__section-title {
    font-size: 16px;
    font-weight: 700;
    color: #222;
    margin-bottom: 12px;
  }

  &__job-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__footer {
    padding: 16px 20px 32px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__cta {
    width: 100%;
    padding: 18px;
    background: #FFC700;
    border: none;
    border-radius: 16px;
    font-size: 17px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;

    &:active { opacity: 0.85; }
  }

  &__cta-secondary {
    width: 100%;
    padding: 18px;
    background: #fff;
    border: 2px solid #FFC700;
    border-radius: 16px;
    font-size: 17px;
    font-weight: 700;
    color: #CC9D00;
    cursor: pointer;

    &:active { opacity: 0.85; }
  }
}
</style>

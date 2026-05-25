<template>
  <div class="cd-main">
    <!-- 헤더 -->
    <AppHeader />

    <!-- 타이틀 -->
    <div class="cd-main__hero">
      <h1 class="cd-main__title">진로계획 세우기</h1>
      <p class="cd-main__subtitle">목표를 향한 체계적인 준비</p>
    </div>

    <!-- 소개 텍스트 -->
    <JourneyIntro
      class="cd-main__intro"
      :step="2"
      headlineMain="목표가 생겼으니,"
      headlineEm="이제 길을 만들어요."
      bodyLine1="자신을 이해하고 꿈꾸는 직업을 찾은 지금,"
      bodyLine2="그 꿈까지 닿을 구체적인 계획을 세워볼게요."
    />

    <!-- 진로계획 가이드 -->
    <div class="cd-main__guide">
      <h2 class="cd-main__section-title">어떻게 진행되나요?</h2>

      <!-- STEP 1: 목표 설정 -->
      <div class="cd-main__step-header">
        <span class="cd-main__step-no">STEP 01</span>
        <span class="cd-main__step-title">목표 설정</span>
      </div>
      <div class="cd-main__step-card">
        <div class="cd-main__step-preview">
          <div class="g-row">
            <span class="g-label">목표 직업</span>
            <div class="g-input-mock">{{ typingText }}<span class="g-cursor" /></div>
          </div>
          <div class="g-row">
            <span class="g-label">계획명</span>
            <div class="g-input-mock g-input-mock--static">OOO의 마케팅 기획자 되기 프로젝트</div>
          </div>
          <div class="g-row">
            <span class="g-label">준비 기간</span>
            <div class="g-date-row">
              <div class="g-date-mock">2024.01</div>
              <span class="g-tilde">~</span>
              <div class="g-date-mock">2025.12</div>
            </div>
          </div>
        </div>
        <p class="cd-main__step-desc">목표 직업, 계획명, 준비 기간을 입력해요</p>
      </div>

      <!-- STEP 2: 프로젝트 구성 -->
      <div class="cd-main__step-header">
        <span class="cd-main__step-no">STEP 02</span>
        <span class="cd-main__step-title">프로젝트 구성</span>
      </div>
      <div class="cd-main__step-card">
        <div class="cd-main__step-preview">
          <div class="g-cat-tabs">
            <span
              v-for="cat in guideCategories"
              :key="cat.value"
              class="g-cat-tab"
              :class="{ 'g-cat-tab--off': guideActiveTab !== cat.value }"
              :style="guideActiveTab === cat.value ? { color: cat.color, borderBottomColor: cat.color } : {}"
              @click="guideActiveTab = cat.value"
            >{{ cat.label }}</span>
          </div>
          <Transition name="g-tab-fade" mode="out-in">
            <div :key="guideActiveTab" class="g-proj-list">
              <div
                v-for="proj in guideProjectMap[guideActiveTab]"
                :key="proj"
                class="g-proj-chip"
                :style="{
                  borderColor: guideCatColor,
                  color: guideCatColor,
                  background: `color-mix(in srgb, ${guideCatColor} 8%, white)`
                }"
              >{{ proj }}</div>
              <div class="g-proj-add">+ 프로젝트 추가</div>
            </div>
          </Transition>
        </div>
        <p class="cd-main__step-desc">자격요건·분야지식·직무기술·포트폴리오 4가지 카테고리로 프로젝트를 추가해요</p>
      </div>

      <!-- STEP 3: 타임라인 배치 -->
      <div class="cd-main__step-header">
        <span class="cd-main__step-no">STEP 03</span>
        <span class="cd-main__step-title">타임라인 배치</span>
      </div>
      <div class="cd-main__step-card">
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
      <div class="cd-main__step-header">
        <span class="cd-main__step-no">STEP 04</span>
        <span class="cd-main__step-title">계획 완성</span>
      </div>
      <div class="cd-main__step-card">
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

    <!-- 목표 진로 카드 -->
    <div class="cd-main__target-wrap">
      <h2 class="cd-main__section-title">목표 진로</h2>

      <!-- 로딩 -->
      <div v-if="targetLoading" class="cd-target-skeleton" />

      <!-- 설정된 목표 진로 -->
      <div v-else-if="targetCareer" class="cd-target-card cd-target-card--set">
        <div class="cd-target-card__icon">🎯</div>
        <div class="cd-target-card__info">
          <p class="cd-target-card__title">{{ targetCareer.title ?? targetCareer.ref }}</p>
          <p v-if="targetCareer.classification" class="cd-target-card__sub">
            {{ targetCareer.classification.primary }} · {{ targetCareer.classification.secondary }}
          </p>
          <p v-else class="cd-target-card__sub">사용자 지정 진로</p>
        </div>
        <button class="cd-target-card__edit" @click="openPopup">변경</button>
      </div>

      <!-- 미설정 -->
      <div v-else class="cd-target-card cd-target-card--empty" @click="openPopup">
        <div class="cd-target-card__icon">＋</div>
        <p class="cd-target-card__hint">목표 진로를 설정해보세요</p>
        <span class="cd-target-card__arrow">›</span>
      </div>
    </div>

    <!-- 하단 버튼 -->
    <div class="cd-main__footer">
      <button class="cd-main__cta-target" @click="openPopup">목표 진로 설정하기</button>
      <button class="cd-main__cta" @click="startPlan">진로계획 시작하기</button>
      <button class="cd-main__cta-secondary" @click="goToExplore">진로계획 탐색하기</button>
    </div>

    <!-- 목표 진로 설정 팝업 -->
    <Teleport to="body">
      <Transition name="popup-fade">
        <div v-if="popupOpen" class="cd-popup-overlay" @click.self="closePopup">
          <Transition name="popup-slide">
            <div v-if="popupOpen" class="cd-popup">
              <div class="cd-popup__handle" />

              <!-- 모드 선택 -->
              <template v-if="popupMode === 'choose'">
                <div class="cd-popup__header">
                  <p class="cd-popup__title">목표 진로 설정</p>
                  <button class="cd-popup__close" @click="closePopup">✕</button>
                </div>
                <p class="cd-popup__desc">목표 진로를 어떻게 설정할까요?</p>
                <div class="cd-popup__options">
                  <button class="cd-popup__option" @click="goToEncyclopedia">
                    <span class="cd-popup__option-icon">📚</span>
                    <div class="cd-popup__option-text">
                      <strong>진로백과에서 선택하기</strong>
                      <span>538개 직업 중 나의 목표 진로를 찾아요</span>
                    </div>
                    <span class="cd-popup__option-arrow">›</span>
                  </button>
                  <button class="cd-popup__option" @click="popupMode = 'manual'">
                    <span class="cd-popup__option-icon">✏️</span>
                    <div class="cd-popup__option-text">
                      <strong>내가 직접 입력하기</strong>
                      <span>진로백과에 없는 직업도 자유롭게 입력해요</span>
                    </div>
                    <span class="cd-popup__option-arrow">›</span>
                  </button>
                </div>
              </template>

              <!-- 직접 입력 -->
              <template v-else-if="popupMode === 'manual'">
                <div class="cd-popup__header">
                  <button class="cd-popup__back" @click="popupMode = 'choose'">‹</button>
                  <p class="cd-popup__title">직접 입력하기</p>
                  <button class="cd-popup__close" @click="closePopup">✕</button>
                </div>
                <p class="cd-popup__desc">목표 진로 이름을 자유롭게 입력해주세요</p>
                <div class="cd-popup__input-wrap">
                  <input
                    ref="manualInputRef"
                    v-model="manualInput"
                    class="cd-popup__input"
                    type="text"
                    placeholder="예) 유튜브 크리에이터, 파티시에"
                    maxlength="40"
                    @keyup.enter="submitManual"
                  />
                  <span class="cd-popup__input-count">{{ manualInput.length }}/40</span>
                </div>
                <button
                  class="cd-popup__confirm"
                  :disabled="!manualInput.trim()"
                  @click="submitManual"
                >설정 완료</button>
              </template>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import AppHeader from '@/shared/components/AppHeader.vue'
import JourneyIntro from '@/shared/components/JourneyIntro.vue'
import { useRouter } from 'vue-router'
import { useCareerDesign } from '../composables/useCareerDesign'
import { fetchTargetCareer, updateTargetCareer } from '@/modules/encyclopedia/encyclopedia.api'
import type { TargetCareer } from '@/modules/encyclopedia/encyclopedia.api'

const router = useRouter()
const { resetDraftPlan, draftPlan } = useCareerDesign()

// STEP 02 가이드 탭
const guideCategories = [
  { value: 'qualification', label: '자격요건', color: '#1DB95A' },
  { value: 'knowledge',     label: '분야지식', color: '#F47820' },
  { value: 'skill',         label: '직무기술', color: '#A855F7' },
  { value: 'portfolio',     label: '포트폴리오', color: '#4480F5' },
] as const
type GuideCat = typeof guideCategories[number]['value']

const guideActiveTab = ref<GuideCat>('qualification')

const guideProjectMap: Record<GuideCat, string[]> = {
  qualification: ['GA4 자격증 준비', 'SMAT 마케팅 자격증', 'ADsP 데이터 분석'],
  knowledge:     ['마케팅 원론', '소비자행동론', '데이터 마케팅 입문'],
  skill:         ['Figma 기초', 'SNS 콘텐츠 크리에이티브', 'SQL for 마케터'],
  portfolio:     ['브랜드 SNS 기획서', '캠페인 기획서 작성', '최종 포트폴리오'],
}

const guideCatColor = computed(
  () => guideCategories.find(c => c.value === guideActiveTab.value)?.color ?? '#1DB95A'
)

// ── 타이핑 효과 ──
const typingWords = ['마케팅 기획자', '소프트웨어 엔지니어', 'UX 디자이너', '데이터 분석가', '영상 크리에이터', '간호사', '건축가']
const typingText = ref('')
let typingTimer: ReturnType<typeof setTimeout> | null = null
let typingIdx = 0
let charIdx = 0
let isDeleting = false

function runTyping() {
  const word = typingWords[typingIdx]
  if (!word) return
  if (!isDeleting) {
    typingText.value = word.slice(0, charIdx + 1)
    charIdx++
    if (charIdx === word.length) {
      isDeleting = true
      typingTimer = setTimeout(runTyping, 1400)
      return
    }
    typingTimer = setTimeout(runTyping, 110)
  } else {
    typingText.value = word.slice(0, charIdx - 1)
    charIdx--
    if (charIdx === 0) {
      isDeleting = false
      typingIdx = (typingIdx + 1) % typingWords.length
      typingTimer = setTimeout(runTyping, 300)
      return
    }
    typingTimer = setTimeout(runTyping, 55)
  }
}

function startPlan() {
  resetDraftPlan()
  if (targetCareer.value) {
    draftPlan.targetJob = targetCareer.value.title ?? targetCareer.value.ref
  }
  router.push('/career-design/plan/new')
}

function goToExplore() {
  router.push('/career-design/explore')
}

// ── 목표 진로 ──
const targetCareer = ref<TargetCareer | null>(null)
const targetLoading = ref(false)

async function loadTargetCareer() {
  targetLoading.value = true
  try {
    const { data } = await fetchTargetCareer()
    if (data.success) targetCareer.value = data.targetCareer
  } catch { /* 비로그인 등 무시 */ } finally {
    targetLoading.value = false
  }
}

// ── 팝업 ──
const popupOpen = ref(false)
const popupMode = ref<'choose' | 'manual'>('choose')
const manualInput = ref('')
const manualInputRef = ref<HTMLInputElement | null>(null)

function openPopup() {
  popupMode.value = 'choose'
  manualInput.value = ''
  popupOpen.value = true
}

function closePopup() {
  popupOpen.value = false
}

function goToEncyclopedia() {
  closePopup()
  router.push('/career-encyclopedia')
}

async function submitManual() {
  const name = manualInput.value.trim()
  if (!name) return
  try {
    const { data } = await updateTargetCareer({ refType: 'custom', ref: name })
    if (data.success) {
      targetCareer.value = { refType: 'custom', ref: name, title: name }
    }
  } catch { /* ignore */ }
  closePopup()
}

// 직접 입력 모드 전환 시 자동 포커스
watch(popupMode, async (mode) => {
  if (mode === 'manual') {
    await nextTick()
    manualInputRef.value?.focus()
  }
})

onMounted(() => {
  loadTargetCareer()
  runTyping()
})

onUnmounted(() => {
  if (typingTimer) clearTimeout(typingTimer)
})
</script>

<style lang="scss">
.cd-main {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;



  &__hero {
    padding: 32px 20px 16px;
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

  /* 소개 텍스트 */
  &__intro {
    margin: 0 20px 20px;
  }

  &__guide {
    padding: 0 20px 4px;
    display: flex;
    flex-direction: column;
    gap: 8px;
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

  &__step-card + &__step-header {
    margin-top: 24px;
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
    font-size: 17px;
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
    font-size: 14px;
    font-weight: 600;
    color: #333;
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

    &--static { color: #888; }
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
    cursor: pointer;
    transition: color 0.15s, border-bottom-color 0.15s;
    user-select: none;
  }

  .g-cat-tab--off { font-weight: 500; }

  .g-tab-fade-enter-active,
  .g-tab-fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
  .g-tab-fade-enter-from   { opacity: 0; transform: translateY(4px); }
  .g-tab-fade-leave-to     { opacity: 0; transform: translateY(-4px); }

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

  &__section-title {
    font-size: 16px;
    font-weight: 700;
    color: #222;
    margin-bottom: 12px;
  }

  /* ── 목표 진로 섹션 ── */
  &__target-wrap {
    padding: 20px 20px 4px;
  }

  .cd-target-skeleton {
    height: 72px;
    background: linear-gradient(90deg, #ebebeb 25%, #e0e0e0 50%, #ebebeb 75%);
    background-size: 200% 100%;
    animation: blink 1.4s infinite;
    border-radius: 16px;
  }

  .cd-target-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 16px;
    cursor: pointer;

    &--set {
      background: #FFFBEC;
      border: 1.5px solid #FFE566;
    }

    &--empty {
      background: #F8F8F8;
      border: 1.5px dashed #D8D8D4;
    }

    &__icon {
      font-size: 22px;
      flex-shrink: 0;
    }

    &__info {
      flex: 1;
      min-width: 0;
    }

    &__title {
      font-size: 15px;
      font-weight: 700;
      color: #222;
      margin: 0 0 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &__sub {
      font-size: 12px;
      color: #888;
      margin: 0;
    }

    &__hint {
      font-size: 14px;
      color: #AAA;
      margin: 0;
      flex: 1;
    }

    &__edit {
      flex-shrink: 0;
      padding: 5px 12px;
      background: #FFC700;
      border: none;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      color: #fff;
      cursor: pointer;
    }

    &__arrow {
      font-size: 20px;
      color: #ccc;
    }
  }

  &__footer {
    padding: 16px 20px 32px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__cta-target {
    width: 100%;
    padding: 18px;
    background: #fff;
    border: 2px solid #FFC700;
    border-radius: 16px;
    font-size: 17px;
    font-weight: 700;
    color: #FFC700;
    cursor: pointer;

    &:active { opacity: 0.85; }
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

/* ── 팝업 오버레이 ── */
.cd-popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 200;
  display: flex;
  align-items: flex-end;
}

/* ── 팝업 시트 ── */
.cd-popup {
  width: 100%;
  background: #fff;
  border-radius: 24px 24px 0 0;
  padding: 12px 20px 40px;
  display: flex;
  flex-direction: column;
  gap: 0;

  &__handle {
    width: 40px;
    height: 4px;
    background: #DDD;
    border-radius: 2px;
    margin: 0 auto 20px;
    flex-shrink: 0;
  }

  &__header {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }

  &__back {
    background: none;
    border: none;
    font-size: 24px;
    color: #555;
    cursor: pointer;
    padding: 0 12px 0 0;
    line-height: 1;
  }

  &__title {
    flex: 1;
    font-size: 17px;
    font-weight: 800;
    color: #111;
    margin: 0;
  }

  &__close {
    background: none;
    border: none;
    font-size: 16px;
    color: #AAA;
    cursor: pointer;
    padding: 4px;
  }

  &__desc {
    font-size: 13px;
    color: #888;
    margin: 0 0 20px;
    line-height: 1.5;
  }

  &__options {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__option {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px;
    background: #F8F8F6;
    border: 1.5px solid #EEEEE8;
    border-radius: 16px;
    text-align: left;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s;

    &:active {
      background: #F0F0EC;
      border-color: #DDD;
    }

    &-icon {
      font-size: 24px;
      flex-shrink: 0;
    }

    &-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;

      strong {
        font-size: 15px;
        font-weight: 700;
        color: #111;
      }

      span {
        font-size: 12px;
        color: #999;
      }
    }

    &-arrow {
      font-size: 22px;
      color: #CCC;
      flex-shrink: 0;
    }
  }

  &__input-wrap {
    position: relative;
    margin-bottom: 16px;
  }

  &__input {
    width: 100%;
    padding: 14px 50px 14px 16px;
    background: #F8F8F6;
    border: 1.5px solid #E4E4E0;
    border-radius: 14px;
    font-size: 15px;
    color: #111;
    outline: none;
    box-sizing: border-box;
    font-family: inherit;
    transition: border-color 0.15s;

    &::placeholder { color: #BBB; }
    &:focus { border-color: #FFC700; }
  }

  &__input-count {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 11px;
    color: #BBB;
  }

  &__confirm {
    width: 100%;
    padding: 16px;
    background: #FFC700;
    border: none;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 700;
    color: #fff;
    cursor: pointer;
    transition: opacity 0.15s;

    &:disabled {
      opacity: 0.4;
      cursor: default;
    }

    &:not(:disabled):active { opacity: 0.85; }
  }
}

/* ── 팝업 트랜지션 ── */
.popup-fade-enter-active,
.popup-fade-leave-active { transition: opacity 0.22s; }
.popup-fade-enter-from,
.popup-fade-leave-to     { opacity: 0; }

.popup-slide-enter-active,
.popup-slide-leave-active { transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
.popup-slide-enter-from,
.popup-slide-leave-to     { transform: translateY(100%); }
</style>

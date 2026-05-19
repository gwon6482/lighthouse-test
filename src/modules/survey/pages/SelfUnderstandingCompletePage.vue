<template>
  <div class="lh-page complete-page">

    <section class="complete-hero">
      <div class="complete-icon">🎉</div>
      <h1 class="complete-title">검사 완료!</h1>
      <p class="complete-sub">수고했어, 검사가 끝났어.<br>결과를 분석하고 있어.</p>
    </section>

    <section class="complete-summary">
      <div v-for="part in parts" :key="part.label" class="complete-part-row">
        <span class="complete-part-emoji">{{ part.emoji }}</span>
        <span class="complete-part-name">{{ part.name }}</span>
        <span class="complete-check">✓</span>
      </div>
    </section>

    <div class="complete-cta-wrap">
      <RouterLink
        class="complete-cta-result"
        :to="`/self-understanding/result/${surveyId}`"
      >
        결과 보고서 보기
      </RouterLink>
      <RouterLink class="complete-cta-home" to="/">
        홈으로 돌아가기
      </RouterLink>
    </div>

    <!-- 비회원 전용 가입 유도 -->
    <div v-if="!authStore.isLoggedIn" class="complete-signup-section">
      <p class="complete-signup-desc">가입하면 검사 결과가 저장되고<br>맞춤 진로를 이어서 탐색할 수 있어요.</p>
      <button class="complete-signup-btn" @click="showSignUp = true">
        회원가입하고 더 진행하기
      </button>
    </div>

    <SignUpModal v-model="showSignUp" @registered="onRegistered" />

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSurvey } from '../composables/useSurvey'
import { useAuthStore } from '@/shared/stores/auth'
import { linkSurveyToUser } from '../survey.api'
import SignUpModal from '../components/SignUpModal.vue'

const router = useRouter()
const authStore = useAuthStore()
const { surveyId } = useSurvey()

const showSignUp = ref(false)

const parts = [
  { emoji: '🧠', name: '성격 & 기질' },
  { emoji: '✨', name: '좋아하는 일' },
  { emoji: '🌿', name: '업무 환경' },
]

async function onRegistered(token: string, user: any) {
  // 1. 자동 로그인
  authStore.setAuth(token, user)

  // 2. 현재 검사 결과를 가입된 계정에 연결
  if (surveyId.value) {
    await linkSurveyToUser(surveyId.value).catch(() => {})
  }

  // 3. 메인으로 이동
  router.push('/')
}
</script>

<style scoped lang="scss">
.complete-signup-section {
  margin: 0 1rem 2rem;
  padding: 1.25rem 1.25rem 1.375rem;
  background: #FFFBEA;
  border: 1.5px solid #FFD100;
  border-radius: 1.125rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.complete-signup-desc {
  font-size: 0.875rem;
  color: #555;
  line-height: 1.6;
  margin: 0;
}

.complete-signup-btn {
  width: 100%;
  padding: 0.875rem;
  font-size: 0.9375rem;
  font-weight: 800;
  font-family: 'Pretendard', sans-serif;
  letter-spacing: -0.2px;
  background: #FFD100;
  color: #1a1a1a;
  border: none;
  border-radius: 0.875rem;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;

  &:hover { background: #f0c400; }
  &:active { transform: scale(0.98); }
}
</style>

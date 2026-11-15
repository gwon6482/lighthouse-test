<template>
  <!-- 내 진로상황(2026-11-16) — [진로계획 세우기] 다음, 템플릿 앞. 목표 직업에 예시 진로설계가 있을 때만 온다(CareerDesignPage.goToTemplates).
       답은 서버의 내 정보로 저장해 템플릿이 '내 상황 플랜'을 만든다. 건너뛰면 지금처럼 비전공·전공 플랜 -->
  <div class="cd-situ">
    <CdYellowHeader
      title="진로계획 세우기"
      :subtitle="prep ? `${prep.displayName} 예시 계획을 내 상황에 맞춰요` : '내 상황에 맞춰 계획을 준비해요'"
      back-to="/career-design"
    />
    <div class="cd-situ__body">
      <p v-if="loading" class="cd-situ__loading">불러오는 중이에요…</p>
      <template v-else>
        <div class="cd-situ__titlebar">
          <h2 class="cd-situ__title">내 진로상황</h2>
          <button type="button" class="cd-situ__skip" @click="skip">건너뛰기</button>
        </div>
        <p class="cd-situ__sub">적은 내용은 마이페이지에서 언제든 고칠 수 있어요</p>
        <CareerSituationForm v-model="draft" :prep="prep" :job-code="jobCode" :job-title="jobTitle" mode="step" />
        <p v-if="error" class="cd-situ__error">{{ error }}</p>
        <button type="button" class="cd-situ__cta" :disabled="saving" @click="next">{{ saving ? '저장하는 중이에요…' : '내 상황에 맞춘 플랜 보기' }}</button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import CdYellowHeader from '../components/CdYellowHeader.vue'
import CareerSituationForm from '../components/CareerSituationForm.vue'
import { loadLibraryPlan } from '../composables/useHelperExamples'
import { cloneProfile, emptyProfile, hasAnything, schoolFromOnboarding, useCareerProfile } from '../composables/useCareerProfile'
import { fetchTargetCareer } from '@/modules/encyclopedia/encyclopedia.api'
import { useAuthStore } from '@/shared/stores/auth'
import { careerSituationOpen } from '@/shared/config/features'
import type { JobPreparation } from '@/modules/encyclopedia/types/encyclopedia'
import type { CareerProfile } from '../types/career-design'

const router = useRouter()
const auth = useAuthStore()
const { load, save, onboardingStatus } = useCareerProfile()

const TEMPLATES = '/career-design/templates'
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const prep = ref<JobPreparation | null>(null)
const jobCode = ref('')
const jobTitle = ref('')
const draft = ref<CareerProfile>(emptyProfile())

onMounted(async () => {
  if (!auth.isLoggedIn) { router.replace('/'); return }
  if (!careerSituationOpen()) { router.replace(TEMPLATES); return }   // 처리방침 시행일(11-23) 전
  try {
    const [{ data }, saved] = await Promise.all([fetchTargetCareer(), load()])
    const target = data.targetCareer
    if (target?.refType === 'jobCode') {
      jobCode.value = target.ref
      jobTitle.value = target.title ?? ''
      prep.value = await loadLibraryPlan(target.ref)
    }
    // 예시 진로설계가 없는 목표면 이 단계에 올 일이 없다 — 진로계획 첫 화면으로
    if (!prep.value) { router.replace('/career-design'); return }
    // 적어 둔 것이 있으면 그대로(학년이 바뀌었을 수 있어 확인받는다), 없으면 가입 때 고른 '지금 상황'으로 학교를 채운다
    draft.value = saved ? cloneProfile(saved) : { ...emptyProfile(), school: schoolFromOnboarding(onboardingStatus.value) }
    if (draft.value.school === 'college' && !draft.value.year) draft.value.year = 1
  } catch {
    error.value = '불러오지 못했어요. 건너뛰고 진행할 수 있어요.'
  } finally {
    loading.value = false
  }
})

function skip() {
  router.push({ path: TEMPLATES, query: { situation: 'skip' } })
}

async function next() {
  // 아무것도 고르지 않았으면 저장하지 않고 건너뛴 것과 같게
  if (!hasAnything(draft.value)) { skip(); return }
  saving.value = true
  error.value = ''
  const ok = await save(draft.value)
  saving.value = false
  if (!ok) { error.value = '저장하지 못했어요. 다시 눌러 주세요.'; return }
  router.push(TEMPLATES)
}
</script>

<style lang="scss">
.cd-situ {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #F5F5F5;

  &__body { flex: 1; padding: 16px 16px 32px; display: flex; flex-direction: column; gap: 10px; }
  &__loading { font-size: 13px; color: #999; padding: 40px 0; text-align: center; }
  &__titlebar { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding: 4px 4px 0; }
  &__title { font-size: 19px; font-weight: 800; color: #222; }
  &__skip {
    border: 0; background: none; padding: 4px; font-family: inherit; font-size: 13px; font-weight: 700; color: #777;
    text-decoration: underline; text-underline-offset: 3px; cursor: pointer;
    &:focus-visible { outline: 2px solid #FFC700; outline-offset: 2px; border-radius: 6px; }
  }
  &__sub { font-size: 12.5px; color: #999; padding: 0 4px 4px; }
  &__error { font-size: 13px; color: #E05050; padding: 0 4px; }
  &__cta {
    margin-top: 6px; width: 100%; padding: 16px; border: 0; border-radius: 14px; background: #FFC700;
    font-family: inherit; font-size: 16px; font-weight: 700; color: #fff; cursor: pointer;
    &:disabled { opacity: 0.6; cursor: default; }
    &:active { opacity: 0.85; }
  }
}
</style>

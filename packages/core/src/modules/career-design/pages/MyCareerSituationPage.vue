<template>
  <!-- 마이페이지 > 내 진로상황(2026-11-16) — 진로계획을 세우지 않아도 언제든 적고 고친다. 지우기도 여기서(처리방침: 언제든 고치거나 지울 수 있다) -->
  <div class="mcs">
    <header class="mcs-bar">
      <button type="button" class="mcs-bar__back" aria-label="뒤로" @click="safeBack(router, '/mypage')"><AppIcon name="ui-back" /></button>
      <h1>내 진로상황</h1>
      <button type="button" class="mcs-bar__save" :disabled="saving || loading" @click="submit">{{ saving ? '저장 중' : '저장' }}</button>
    </header>

    <div class="mcs__body">
      <p v-if="loading" class="mcs__note">불러오는 중이에요…</p>
      <template v-else>
        <p class="mcs__note">적어 두면 진로계획을 세울 때 내 상황에 맞춘 플랜을 보여 드려요. 지금 진행 중인 계획은 바뀌지 않아요.</p>
        <CareerSituationForm v-model="draft" :prep="prep" :job-code="jobCode" :job-title="jobTitle" mode="edit" />
        <p v-if="message" :class="['mcs__msg', { 'mcs__msg--error': failed }]">{{ message }}</p>

        <div v-if="saved" class="mcs__danger">
          <button v-if="!confirmDelete" type="button" class="mcs__delete" @click="confirmDelete = true">내 진로상황 지우기</button>
          <div v-else class="mcs__confirm">
            <p>적어 둔 학교·이미 해 둔 것·경력·성과가 모두 지워져요.</p>
            <div>
              <button type="button" class="mcs__confirm-cancel" @click="confirmDelete = false">취소</button>
              <button type="button" class="mcs__confirm-ok" :disabled="saving" @click="removeAll">지우기</button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import CareerSituationForm from '../components/CareerSituationForm.vue'
import { loadLibraryPlan } from '../composables/useHelperExamples'
import { cloneProfile, emptyProfile, schoolFromOnboarding, useCareerProfile } from '../composables/useCareerProfile'
import { fetchTargetCareer } from '@/modules/encyclopedia/encyclopedia.api'
import { useAuthStore } from '@/shared/stores/auth'
import { careerSituationOpen } from '@/shared/config/features'
import { safeBack } from '@/shared/utils/navigation'
import type { JobPreparation } from '@/modules/encyclopedia/types/encyclopedia'
import type { CareerProfile } from '../types/career-design'

const router = useRouter()
const auth = useAuthStore()
const { load, save, remove, onboardingStatus } = useCareerProfile()

const loading = ref(true)
const saving = ref(false)
const message = ref('')
const failed = ref(false)
const confirmDelete = ref(false)
const saved = ref(false)          // 서버에 적어 둔 것이 있는가(지우기 단추)
const draft = ref<CareerProfile>(emptyProfile())
// 지금 목표 직업 — 학과 질문과 '이미 해 둔 것' 목록을 그 직업의 예시 계획에서 뽑는다(목표가 없으면 그 칸 없이)
const prep = ref<JobPreparation | null>(null)
const jobCode = ref('')
const jobTitle = ref('')

onMounted(async () => {
  if (!auth.isLoggedIn) { router.replace('/'); return }
  if (!careerSituationOpen()) { router.replace('/mypage'); return }   // 처리방침 시행일(11-23) 전
  const [profile, target] = await Promise.all([load(true), fetchTargetCareer().then((r) => r.data.targetCareer).catch(() => null)])
  saved.value = !!profile
  draft.value = profile ? cloneProfile(profile) : { ...emptyProfile(), school: schoolFromOnboarding(onboardingStatus.value) }
  if (draft.value.school === 'college' && !draft.value.year) draft.value.year = 1
  if (target?.refType === 'jobCode') {
    jobCode.value = target.ref
    jobTitle.value = target.title ?? ''
    prep.value = await loadLibraryPlan(target.ref)
  }
  loading.value = false
})

async function submit() {
  saving.value = true
  message.value = ''
  const ok = await save(draft.value)
  saving.value = false
  failed.value = !ok
  if (!ok) { message.value = '저장하지 못했어요. 다시 눌러 주세요.'; return }
  safeBack(router, '/mypage')
}

async function removeAll() {
  saving.value = true
  const ok = await remove()
  saving.value = false
  if (!ok) { failed.value = true; message.value = '지우지 못했어요. 다시 눌러 주세요.'; return }
  router.replace('/mypage')
}
</script>

<style lang="scss">
.mcs {
  min-height: 100vh;
  background: #F5F5F5;

  &__body { padding: 14px 16px 40px; display: flex; flex-direction: column; gap: 10px; }
  &__note { font-size: 12.5px; line-height: 1.6; color: #888; padding: 0 4px; word-break: keep-all; }
  &__msg { font-size: 13px; color: #1D6FD8; padding: 0 4px; &--error { color: #E05050; } }
  &__danger { margin-top: 18px; display: flex; flex-direction: column; align-items: center; }
  &__delete { border: 0; background: none; font-family: inherit; font-size: 13px; color: #999; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; padding: 6px; }
  &__confirm {
    width: 100%; box-sizing: border-box; background: #fff; border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 10px;
    p { font-size: 13px; color: #555; line-height: 1.5; }
    div { display: flex; justify-content: flex-end; gap: 8px; }
    button { border: 0; border-radius: 10px; padding: 9px 14px; font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
  }
  &__confirm-cancel { background: #F2F3F5; color: #555; }
  &__confirm-ok { background: #E05050; color: #fff; &:disabled { opacity: 0.6; } }
}
.mcs-bar {
  position: sticky; top: 0; z-index: 5; display: grid; grid-template-columns: 56px 1fr 56px; align-items: center;
  height: 52px; padding: env(safe-area-inset-top) 6px 0; background: #fff; box-sizing: content-box;
  h1 { text-align: center; font-size: 16px; font-weight: 700; color: #222; }
  &__back { width: 40px; height: 40px; display: grid; place-items: center; border: 0; background: none; font-size: 20px; color: #333; cursor: pointer; }
  &__save {
    justify-self: end; border: 0; background: none; padding: 8px 10px; font-family: inherit; font-size: 15px; font-weight: 700; color: #1D6FD8; cursor: pointer;
    &:disabled { color: #AAA; cursor: default; }
  }
}
</style>

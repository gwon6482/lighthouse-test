<template>
  <!-- 결과지 직무 카드의 '채용 공고'(2026-11-09). 직무 = 고용24 채용 직종 중분류 — 공고 목록은 진로백과 채용 탭과 같은 컴포넌트 -->
  <div class="job-detail-page">
    <header class="job-detail-header">
      <button class="job-detail-header__back" @click="safeBack(router, '/career-encyclopedia')"><AppIcon name="ui-back" /></button>
      <div class="job-detail-header__info">
        <div class="job-detail-header__classifications">
          <span class="job-detail-header__primary">직무 채용 공고</span>
        </div>
        <h1 class="job-detail-header__title">{{ group?.name ?? ' ' }}</h1>
      </div>
    </header>

    <div class="job-detail-page__content">
      <RecruitmentTab :group-code="code" @group="(g) => (group = g)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import { safeBack } from '@/shared/utils/navigation'
import RecruitmentTab from '../components/page/job-detail/tabs/RecruitmentTab.vue'

const route = useRoute()
const router = useRouter()
const code = route.params.code as string
// 직무 이름은 공고 응답에 같이 온다(결과지 카드와 같은 화면 이름)
const group = ref<{ code: string; name: string; fullName: string } | null>(null)
</script>

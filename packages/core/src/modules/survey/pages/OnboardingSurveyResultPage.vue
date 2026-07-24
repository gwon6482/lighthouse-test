<template>
  <SurveyResultBody :survey-id="surveyId" @job-click="openOverview">
    <!-- 온보딩(회원가입) 흐름: 진로백과로 이동하지 않고 다음 단계로 -->
    <section class="m-sec result-next-section">
      <button class="result-next-btn" @click="goNext">다음으로</button>
    </section>
  </SurveyResultBody>

  <!-- 추천 직업 개요 팝업 (진로백과로 이동하는 대신 개요만 표시) -->
  <JobOverviewModal v-model="showOverview" :job-code="overviewJobCode" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SurveyResultBody from '../components/SurveyResultBody.vue'
import JobOverviewModal from '../components/JobOverviewModal.vue'

const route = useRoute()
const router = useRouter()
const surveyId = route.params.survey_id as string

const showOverview = ref(false)
const overviewJobCode = ref('')

function openOverview(jobCode: string) {
  overviewJobCode.value = jobCode
  showOverview.value = true
}

function goNext() {
  sessionStorage.removeItem('lh_survey_return')
  router.push('/main/before')
}
</script>

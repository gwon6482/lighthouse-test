<template>
  <div class="mb">
    <AppHeader />

    <div class="mb__body">
      <header class="mb__intro">
        <span class="mb__badge">진로 여정 시작</span>
        <h1 class="mb__headline">
          <strong>{{ userName }}</strong>님의<br/>진로 여정을 시작해요
        </h1>
        <p class="mb__sub">세 단계를 차례로 완료하면 나만의 진로 계획이 완성돼요.</p>

        <div class="mb__progress">
          <div class="mb__progress-bar">
            <div class="mb__progress-fill" :style="{ width: `${(doneCount / steps.length) * 100}%` }" />
          </div>
          <span class="mb__progress-text">{{ doneCount }} / {{ steps.length }} 완료</span>
        </div>
      </header>

      <div v-if="loading" class="mb__loading">불러오는 중...</div>

      <div v-else class="mb__steps">
        <button
          v-for="step in steps"
          :key="step.key"
          class="mb__step"
          :class="[`mb__step--${step.status}`]"
          :disabled="step.status !== 'active'"
          @click="onStepClick(step)"
        >
          <!-- 좌측: 단계 번호 / 상태 아이콘 -->
          <span class="mb__step-mark">
            <svg v-if="step.status === 'done'" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <svg v-else-if="step.status === 'locked'" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="2" stroke="#BBB" stroke-width="2"/>
              <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="#BBB" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <span v-else class="mb__step-no">{{ step.no }}</span>
          </span>

          <!-- 가운데: 제목 + 설명 -->
          <span class="mb__step-text">
            <span class="mb__step-title">{{ step.title }}</span>
            <span class="mb__step-desc">{{ step.desc }}</span>
          </span>

          <!-- 우측: 상태 라벨 / 화살표 -->
          <span class="mb__step-right">
            <span v-if="step.status === 'done'" class="mb__step-tag">완료</span>
            <svg v-else-if="step.status === 'active'" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9 6l6 6-6 6" stroke="#1A1A1A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </button>
      </div>

      <!-- 세 단계 모두 완료: 진로달성 진입 -->
      <button v-if="!loading && allDone" class="mb__finish" @click="startAchievement">
        진로달성 시작하기!
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/shared/components/AppHeader.vue'
import { useAuthStore } from '@/shared/stores/auth'
import { useAchievementStore } from '@/shared/stores/achievement'
import { fetchUserSurveyResults, fetchTargetCareer } from '@/modules/encyclopedia/encyclopedia.api'

const router = useRouter()
const authStore = useAuthStore()
const achievementStore = useAchievementStore()

const userName = computed(() => authStore.user?.name ?? authStore.user?.email?.split('@')[0] ?? '회원')

const loading = ref(true)
const surveyDone = ref(false)
const targetDone = ref(false)
const planDone = ref(false)

type StepStatus = 'done' | 'active' | 'locked'
interface Step {
  key: string
  no: number
  title: string
  desc: string
  route: string
  done: boolean
  status: StepStatus
}

const steps = computed<Step[]>(() => {
  const raw = [
    {
      key: 'survey',
      no: 1,
      title: '자기이해 검사',
      desc: '5가지 검사로 나의 성격·재능·흥미·가치관을 파악해요.',
      route: '/self-understanding',
      done: surveyDone.value,
    },
    {
      key: 'target',
      no: 2,
      title: '목표 진로 결정',
      desc: '추천 직업을 살펴보고 목표 진로를 정해요.',
      route: '/career-encyclopedia',
      done: targetDone.value,
    },
    {
      key: 'plan',
      no: 3,
      title: '진로 프로젝트 설계',
      desc: '목표까지 가는 나만의 프로젝트 계획을 세워요.',
      route: '/career-design',
      done: planDone.value,
    },
  ]
  return raw.map((s, i) => {
    let status: StepStatus
    if (s.done) status = 'done'
    else if (raw.slice(0, i).every((p) => p.done)) status = 'active'  // 이전 단계 모두 완료 시에만 활성
    else status = 'locked'
    return { ...s, status }
  })
})

const doneCount = computed(() => steps.value.filter((s) => s.done).length)
const allDone = computed(() => doneCount.value === steps.value.length)

function onStepClick(step: Step) {
  if (step.status !== 'active') return
  // 각 단계를 /main/before 에서 시작했음을 표시 — 완료 후 여기로 복귀시키기 위함
  if (step.key === 'survey') {
    sessionStorage.setItem('lh_survey_return', '/main/before')
  } else if (step.key === 'target') {
    sessionStorage.setItem('lh_target_return', '/main/before')
  } else if (step.key === 'plan') {
    sessionStorage.setItem('lh_plan_return', '/main/before')
  }
  router.push(step.route)
}

function startAchievement() {
  router.push('/career-achievement')
}

async function load() {
  loading.value = true
  try {
    const [sr, tc] = await Promise.all([
      fetchUserSurveyResults().catch(() => null),
      fetchTargetCareer().catch(() => null),
    ])
    surveyDone.value = (sr?.data.surveyResults?.length ?? 0) > 0
    targetDone.value = !!tc?.data.targetCareer
    await achievementStore.loadActivePlan(true)
    planDone.value = achievementStore.hasActivePlan
  } finally {
    loading.value = false
  }
  // 세 단계 모두 완료 시: 자동 이동하지 않고 '진로달성 시작하기!' CTA 를 노출한다
}

onMounted(load)
</script>

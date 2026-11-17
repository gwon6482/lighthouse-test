<template>
  <!-- 분류로 찾기 입구(2026-11-17 시안 2판) — 진로 둘러보기 아래, 나의 추천 진로 위.
       단계 0(필요를 못 느낌)에게는 고르는 화면보다 둘러보기가 먼저라 그 아래에 둔다(진로상담) -->
  <section class="be">
    <h2 class="be__title">분류로 찾기</h2>
    <div class="be__grid">
      <button v-for="t in tiles" :key="t.key" type="button" class="be__tile" @click="openAxis(t.key)">
        <span class="be__icon" :style="{ color: t.color.text, background: t.color.bg }"><AppIcon :name="t.icon" /></span>
        <b class="be__name">{{ t.name }}</b>
        <span class="be__hint">{{ t.hint }}</span>
      </button>
    </div>
    <button v-if="mine" type="button" class="be__mine" @click="openMine">
      <span>내 검사 결과로 찾기<template v-if="mine.interestName"> · <b>{{ mine.interestName }}</b></template><template v-if="talentName"> · <b>{{ talentName }}</b></template></span>
      <AppIcon name="ui-chevron-right" class="be__mine-arrow" />
    </button>
    <RouterLink v-else-if="hintTo" :to="hintTo" class="be__hintline">검사를 하면 내 결과로 바로 찾을 수 있어요</RouterLink>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import { AREA_COLOR } from '@/modules/survey/surveyIcons'
import { useAuthStore } from '@/shared/stores/auth'
import { features } from '@/shared/config/features'
import { useBrowseAxes, useMyBrowseStart } from '../../../composables/useJobBrowse'
import { queryFromState } from '../../../lib/browseQuery'
import type { BrowseAxisKey } from '../../../types/browse'

const router = useRouter()
const auth = useAuthStore()
const guest = features.guestEntry && !auth.isLoggedIn
const { axes, load: loadAxes } = useBrowseAxes()
const { mine, noSurvey, load: loadMine } = useMyBrowseStart()

// 칸 색 — 검사 결과 화면과 같은 영역 색(좋아하는 일 = 하늘, 업무 환경 = 청록). 직무는 둘러보기의 직무 꼬리표 노랑, 연봉은 회색
const NEUTRAL = { text: '#5F6670', bg: '#F0F1F3', line: '#E2E4E8' }
const JOB = { text: '#8A5E00', bg: '#FFF4CC', line: '#F5DC85' }

const axis = (k: BrowseAxisKey) => axes.value?.axes.find((a) => a.key === k)
const names = (k: BrowseAxisKey, n: number) => (axis(k)?.items ?? []).filter((i) => !i.redirect).slice(0, n).map((i) => i.name).join('·')

const tiles = computed(() => {
  const g = axis('group')
  const jobsHint = g?.items ? `${g.items.length}분야 ${g.items.reduce((s, t) => s + (t.children?.length ?? 0), 0)}직무` : '분야에서 직무로'
  return [
    { key: 'group' as const, name: '직무', icon: 'service-job-experience', color: JOB, hint: jobsHint },
    { key: 'interest' as const, name: '관심 분야', icon: 'result-interest', color: AREA_COLOR.likes, hint: '국어·생물·디자인…' },
    { key: 'env' as const, name: '업무 환경', icon: 'area-environment', color: AREA_COLOR.environment, hint: '앉아서·바깥·재택…' },
    { key: 'talent' as const, name: '재능', icon: 'result-talent', color: AREA_COLOR.likes, hint: axes.value ? `${names('talent', 2)}…` : '언어·논리수학…' },
    { key: 'value' as const, name: '가치관', icon: 'result-values', color: AREA_COLOR.likes, hint: '안정·자율·성취…' },
    { key: 'salary' as const, name: '연봉', icon: 'browse-salary', color: NEUTRAL, hint: '○천만 원 이상' },
  ]
})

// 재능 이름은 서버 이름(검사 결과와 같은 말)으로. 축을 못 받았으면 비워 둔다
const talentName = computed(() => {
  const code = mine.value?.talentCode
  return code ? (axis('talent')?.items?.find((i) => i.code === code)?.name ?? null) : null
})

// 검사 안내 — 비회원은 비회원 검사(/start), 검사 전 회원은 자기이해 검사로
const hintTo = computed(() => (guest ? '/start' : noSurvey.value ? '/self-understanding' : null))

function openAxis(key: BrowseAxisKey) {
  router.push({ path: `/career-encyclopedia/browse/${key}` })
}
function openMine() {
  if (!mine.value) return
  router.push({ path: '/career-encyclopedia/browse', query: queryFromState(mine.value.state) })
}

onMounted(() => {
  loadAxes()
  loadMine()
})
</script>

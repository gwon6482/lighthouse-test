<template>
  <!-- 분류로 찾기 입구(2026-11-17 시안 2판) — 검색 바로 아래, 진로 둘러보기 위(2026-11-21 오너: 둘러보기 위로 올림).
       단계 0(필요를 못 느낌)에게는 고르는 화면보다 둘러보기가 먼저라 그 아래에 둔다(진로상담) -->
  <section class="be">
    <h2 class="be__title">분류로 찾기</h2>
    <div class="be__grid">
      <button v-for="t in tiles" :key="t.key" type="button" class="be__tile" @click="openAxis(t.key)">
        <span class="be__icon" :style="{ color: t.color.text, background: t.color.bg }"><AppIcon :name="t.icon" /></span>
        <b class="be__name">{{ t.name }}<AppIcon v-if="t.locked" name="ui-privacy" :size="11" class="be__lock" aria-label="가입 후" /></b>
        <span class="be__hint">{{ t.hint }}</span>
      </button>
    </div>
    <!-- 실제로 채우는 항목을 그대로 보여 준다(사용성 확인 — 무엇이 채워지는지 알고 누르게) -->
    <button v-if="mine" type="button" class="be__mine" @click="openMine">
      <span class="be__mine-text">
        <span class="be__mine-lead">내 검사 결과로 찾기</span>
        <span class="be__mine-items">{{ mine.labels.join(' · ') }}</span>
      </span>
      <AppIcon name="ui-chevron-right" class="be__mine-arrow" />
    </button>
    <RouterLink v-else-if="hintTo" :to="hintTo" class="be__hintline">
      <span>검사를 하면 내 결과로 바로 찾을 수 있어요</span>
      <AppIcon name="ui-chevron-right" class="be__hintline-arrow" />
    </RouterLink>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import { AREA_COLOR } from '@/modules/survey/surveyIcons'
import { useAuthStore } from '@/shared/stores/auth'
import { useBrowseAxes, useMyBrowseStart } from '../../../composables/useJobBrowse'
import { listQuery } from '../../../lib/browseQuery'
import type { BrowseAxisKey } from '../../../types/browse'

const router = useRouter()
const auth = useAuthStore()
const guest = !auth.isLoggedIn
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
    { key: 'group' as const, name: '직무', icon: 'service-job-experience', color: JOB, hint: jobsHint, locked: false },
    { key: 'interest' as const, name: '관심 분야', icon: 'result-interest', color: AREA_COLOR.likes, hint: '국어·생물·디자인…', locked: false },
    { key: 'env' as const, name: '업무 환경', icon: 'area-environment', color: AREA_COLOR.environment, hint: '앉아서·실외·재택…', locked: false },
    { key: 'talent' as const, name: '재능', icon: 'result-talent', color: AREA_COLOR.likes, hint: axes.value ? `${names('talent', 2)}…` : '언어·논리수학…', locked: false },
    { key: 'value' as const, name: '가치관', icon: 'result-values', color: AREA_COLOR.likes, hint: '안정·자율·성취…', locked: false },
    // 비회원은 연봉 분류가 잠겨 있다(직업 상세의 연봉 잠금과 같게) — 칸에 자물쇠를 보인다
    { key: 'salary' as const, name: '연봉', icon: 'browse-salary', color: NEUTRAL, hint: '4천만 원 이상부터', locked: guest },
  ]
})

// 검사 안내 — 비회원은 비회원 검사(/start), 검사 전 회원은 자기이해 검사로
const hintTo = computed(() => (guest ? '/start' : noSurvey.value ? '/self-understanding' : null))

/** 고르기 화면은 이 화면 위에 한 칸으로 쌓인다(pd = 고르기 화면 깊이) — 적용하면 그만큼 되돌아온 뒤 목록을 연다 */
function openAxis(key: BrowseAxisKey) {
  router.push({ path: `/career-encyclopedia/browse/${key}`, query: { pd: '1' } })
}
function openMine() {
  if (!mine.value) return
  router.push({ path: '/career-encyclopedia/browse', query: listQuery(mine.value.state, ['interest', 'talent'], { mine: '1' }) })
}

onMounted(() => {
  loadAxes()
  loadMine()
})
</script>

<template>
  <!-- 주간결산 모아보기(2026-10-30) — 마이페이지 '진로 관리'에서. 마친 결산만(건너뛴 주는 기록이 없다) -->
  <div class="rc">
    <header class="rc-bar">
      <button type="button" class="rvl-back" aria-label="뒤로" @click="safeBack(router, '/mypage')"><AppIcon name="ui-back" /></button>
      <h1 class="rc-bar__title">주간결산 모아보기</h1>
      <span class="rc-bar__sub">{{ reviews.length }}주</span>
    </header>

    <div v-if="loading" class="ah__loading">불러오는 중...</div>
    <p v-else-if="!reviews.length" class="rc-empty">
      <AppIcon name="ui-weekly-review" />
      아직 마친 주간결산이 없어요.<br>한 주가 끝나면 홈에서 결산할 수 있어요.
    </p>

    <ul v-else class="rvl">
      <li v-for="r in reviews" :key="r.weekStart" class="rvl-card">
        <div class="rvl-card__head">
          <strong>{{ r.weekNo ? `${r.weekNo}주차` : '한 주' }}</strong>
          <span>{{ range(r) }}</span>
          <span class="rvl-card__stars" :aria-label="`만족도 ${r.satisfaction}`"><AppIcon v-for="n in 5" :key="n" name="ui-star" :class="{ on: n <= (r.satisfaction ?? 0) }" /></span>
        </div>
        <div class="rvl-card__nums">
          <div><b>{{ r.stats.percent }}%</b><small>완료</small></div>
          <div><b>{{ r.stats.progressBefore }}→{{ r.stats.progressAfter }}%</b><small>전체 진행</small></div>
          <div><b>{{ r.stats.fullDays }}/{{ r.stats.workDays }}일</b><small>다 해낸 날</small></div>
        </div>
        <p v-if="r.note" class="rvl-card__note">{{ r.note }}</p>
        <p v-if="r.pledge" class="rvl-card__pledge"><AppIcon name="ui-target" /> {{ r.pledge }}</p>
        <p v-if="r.paceTo && r.paceFrom && r.paceTo !== r.paceFrom" class="rvl-card__pace">
          속도 {{ paceTitle(r.paceFrom) }} → <b>{{ paceTitle(r.paceTo) }}</b>
          <template v-if="r.endDateFrom && r.endDateTo"> · 완료 예정 {{ md(r.endDateFrom) }} → {{ md(r.endDateTo) }}</template>
        </p>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import { safeBack } from '@/shared/utils/navigation'
import { useAchievementStore } from '@/shared/stores/achievement'
import { fetchWeeklyReviews, type WeeklyReviewDto } from '../achievement.api'
import { paceByKey } from '@/modules/career-design/composables/usePlanPace'

const router = useRouter()
const store = useAchievementStore()
const loading = ref(true)
const reviews = ref<WeeklyReviewDto[]>([])
const DOW = ['일', '월', '화', '수', '목', '금', '토']
const md = (k: string) => { const [y, m, d] = k.split('-').map(Number); return `${m}/${d}` }
const range = (r: WeeklyReviewDto) => {
  const f = (k: string) => { const [y, m, d] = k.split('-').map(Number); return `${m}/${d}(${DOW[new Date(y!, m! - 1, d!).getDay()]})` }
  return r.weekEnd ? `${f(r.weekStart)} ~ ${f(r.weekEnd)}` : f(r.weekStart)
}
const paceTitle = (k: string) => paceByKey(k)?.title ?? k

onMounted(async () => {
  try {
    await store.loadActivePlan()
    if (store.plan) reviews.value = await fetchWeeklyReviews(store.plan.planId)
  } catch { /* 빈 목록 */ } finally { loading.value = false }
})
</script>

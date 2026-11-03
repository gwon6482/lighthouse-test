<template>
  <!-- 주간결산 모아보기(2026-10-30) — 마이페이지 '진로 관리'에서.
       지나간 주를 모두 최신 주부터 보여 준다(2026-11-04). 결산을 건너뛴 주도 성과는 기록에서 다시 계산하고,
       사용자가 입력하는 것(만족도·메모·다짐·속도 변경)만 빠진다 -->
  <div class="rc">
    <header class="rc-bar">
      <button type="button" class="rvl-back" aria-label="뒤로" @click="safeBack(router, '/mypage')"><AppIcon name="ui-back" /></button>
      <h1 class="rc-bar__title">주간결산 모아보기</h1>
      <span class="rc-bar__sub">{{ rows.length }}주</span>
    </header>

    <div v-if="loading" class="ah__loading">불러오는 중...</div>
    <p v-else-if="!rows.length" class="rc-empty">
      <AppIcon name="ui-weekly-review" />
      아직 지나간 주가 없어요.<br>한 주가 끝나면 홈에서 결산할 수 있어요.
    </p>

    <ul v-else class="rvl">
      <li v-for="r in rows" :key="r.weekStart" class="rvl-card">
        <div class="rvl-card__head">
          <strong>{{ r.weekNo ? `${r.weekNo}주차` : '한 주' }}</strong>
          <span>{{ range(r) }}</span>
          <span v-if="r.review" class="rvl-card__stars" :aria-label="`만족도 ${r.review.satisfaction}`"><AppIcon v-for="n in 5" :key="n" name="ui-star" :class="{ on: n <= (r.review.satisfaction ?? 0) }" /></span>
          <span v-else class="rvl-card__skip">결산 안 함</span>
        </div>
        <div class="rvl-card__nums">
          <div><b>{{ r.percent }}%</b><small>완료</small></div>
          <div><b>{{ r.progressBefore }}→{{ r.progressAfter }}%</b><small>전체 진행</small></div>
          <div><b>{{ r.fullDays }}/{{ r.workDays }}일</b><small>다 해낸 날</small></div>
        </div>
        <template v-if="r.review">
          <p v-if="r.review.note" class="rvl-card__note">{{ r.review.note }}</p>
          <p v-if="r.review.pledge" class="rvl-card__pledge"><AppIcon name="ui-target" /> {{ r.review.pledge }}</p>
          <p v-if="r.review.paceTo && r.review.paceFrom && r.review.paceTo !== r.review.paceFrom" class="rvl-card__pace">
            속도 {{ paceTitle(r.review.paceFrom) }} → <b>{{ paceTitle(r.review.paceTo) }}</b>
            <template v-if="r.review.endDateFrom && r.review.endDateTo"> · 완료 예정 {{ md(r.review.endDateFrom) }} → {{ md(r.review.endDateTo) }}</template>
          </p>
        </template>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import { safeBack } from '@/shared/utils/navigation'
import { fetchWeeklyReviews, type WeeklyReviewDto } from '../achievement.api'
import { paceByKey } from '@/modules/career-design/composables/usePlanPace'
import { weekDateRange, weekOfDate } from '@/modules/career-design/composables/usePlanTimeline'
import { usePlanBoard } from '../composables/usePlanBoard'
import { parseDateKey, toDateKey } from '../composables/useWeeklySchedule'
import { progressUpToWeek } from '../lib/planBoard'

interface Row {
  weekStart: string; weekEnd: string; weekNo: number | null
  percent: number; progressBefore: number; progressAfter: number; fullDays: number; workDays: number
  review: WeeklyReviewDto | null // 마친 결산(없으면 건너뛴 주)
}

const router = useRouter()
const board = usePlanBoard()
const { plan, todayKey } = board
const loading = ref(true)
const reviews = ref<WeeklyReviewDto[]>([])
const DOW = ['일', '월', '화', '수', '목', '금', '토']
const md = (k: string) => { const [, m, d] = k.split('-').map(Number); return `${m}/${d}` }
const range = (r: Row) => {
  const f = (k: string) => { const [y, m, d] = k.split('-').map(Number); return `${m}/${d}(${DOW[new Date(y!, m! - 1, d!).getDay()]})` }
  return r.weekEnd ? `${f(r.weekStart)} ~ ${f(r.weekEnd)}` : f(r.weekStart)
}
const paceTitle = (k: string) => paceByKey(k)?.title ?? k

// 결산을 건너뛴 주 — 결산 화면(useWeekReview)과 같은 규칙으로 그 주 7일의 기록을 센다
function computedRow(weekNo: number, weekStart: string, weekEnd: string): Row {
  const pl = plan.value!
  let planned = 0, done = 0, fullDays = 0, workDays = 0
  const d = parseDateKey(weekStart)!
  for (let i = 0; i < 7; i++, d.setDate(d.getDate() + 1)) {
    const key = toDateKey(d)
    if (key < pl.startDate) continue
    const items = board.itemsOn(d)
    const n = items.filter((it) => board.itemDone(it, key)).length
    planned += items.length; done += n
    if (items.length) { workDays++; if (n >= items.length) fullDays++ }
  }
  const upTo = (w: number) => progressUpToWeek(pl.projects, pl.timeline, w, board.isItemDone)
  return {
    weekStart, weekEnd, weekNo,
    percent: planned ? Math.round((done / planned) * 100) : 0,
    progressBefore: upTo(weekNo - 1), progressAfter: upTo(weekNo),
    fullDays, workDays, review: null,
  }
}

// 지나간 주(끝난 주) + 마친 결산(이번 주를 미리 결산했을 수 있다) — 최신 주가 위
const rows = computed<Row[]>(() => {
  const pl = plan.value
  if (!pl?.startDate) return []
  const done = new Map(reviews.value.filter((r) => r.completedAt).map((r) => [r.weekStart, r]))
  const out: Row[] = []
  const last = weekOfDate(pl.startDate, parseDateKey(todayKey.value)!, pl.reviewDay) ?? 0
  for (let w = 1; w <= last; w++) {
    const wr = weekDateRange(pl.startDate, w, pl.reviewDay)
    if (!wr) continue
    if (!done.has(wr.start) && wr.end < todayKey.value) out.push(computedRow(w, wr.start, wr.end))
  }
  // 마친 결산은 저장된 값 그대로 — 주 기준이 바뀌기 전(2026-10-30 이전) 결산도 빠지지 않게 따로 넣는다
  for (const r of done.values()) {
    out.push({
      weekStart: r.weekStart, weekEnd: r.weekEnd, weekNo: r.weekNo,
      percent: r.stats.percent, progressBefore: r.stats.progressBefore, progressAfter: r.stats.progressAfter,
      fullDays: r.stats.fullDays, workDays: r.stats.workDays, review: r,
    })
  }
  return out.sort((a, b) => b.weekStart.localeCompare(a.weekStart))
})

onMounted(async () => {
  try {
    await board.load()
    if (plan.value) reviews.value = await fetchWeeklyReviews(plan.value.planId)
  } catch { /* 빈 목록 */ } finally { loading.value = false }
})
</script>

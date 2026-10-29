<template>
  <!-- 로그(하단 탭, 2026-10-29 기획회의) — 진로 달성 기록을 한 번에: 요약 → 달마다(기록한 날 달력 + 카드: 사진·난이도·메모) -->
  <div class="rc">
    <header class="rc-bar">
      <h1 class="rc-bar__title">로그</h1>
      <span class="rc-bar__sub">진로 달성 기록</span>
    </header>

    <!-- 요약 -->
    <div v-if="records.length" class="rc-sum">
      <div class="rc-sum__item"><strong>{{ records.length }}</strong><span>완료 기록</span></div>
      <div class="rc-sum__item"><strong>{{ totalHours }}</strong><span>쌓은 시간</span></div>
      <div class="rc-sum__item"><strong>{{ activeDays }}일</strong><span>기록한 날</span></div>
      <div class="rc-sum__item"><strong>{{ photoCount }}</strong><span>사진</span></div>
    </div>

    <div v-if="loading" class="ah__loading">불러오는 중...</div>
    <p v-else-if="!records.length" class="rc-empty">
      <AppIcon name="ui-photo" />
      아직 남긴 기록이 없어요.<br>프로젝트를 완료할 때 사진과 메모를 남기면 여기에 모여요.
    </p>

    <section v-for="g in groups" :key="g.month" class="rc-month">
      <h2 class="rc-month__title">{{ g.label }} <small>{{ g.items.length }}개</small></h2>
      <!-- 기록한 날 달력 — 진하기 = 그날 완료한 일 수(프로젝트 + 루틴) -->
      <div class="rc-cal" aria-hidden="true">
        <span v-for="w in WEEK_HEAD" :key="w" class="rc-cal__head">{{ w }}</span>
        <span v-for="n in g.lead" :key="'b' + n" />
        <span
          v-for="d in g.days" :key="d.day" class="rc-cal__day"
          :class="[`rc-cal__day--lv${d.level}`, { 'rc-cal__day--today': d.today }]"
        >{{ d.day }}</span>
      </div>
      <ul class="rc-grid">
        <li v-for="e in g.items" :key="e.date + e.itemId" class="rc-card">
          <div class="rc-card__photo" :style="e.photoUrl ? undefined : { background: tint(categoryColor(e.itemCategory)), color: categoryColor(e.itemCategory) }">
            <img v-if="e.photoUrl" :src="e.photoUrl" :alt="e.itemName" loading="lazy">
            <AppIcon v-else name="ui-done" />
          </div>
          <div class="rc-card__body">
            <span class="rc-card__name">{{ e.itemName || '프로젝트' }}</span>
            <span class="rc-card__meta">
              {{ dayLabel(e.date) }}<template v-if="e.elapsedSec"> · {{ Math.max(1, Math.round(e.elapsedSec / 60)) }}분</template>
            </span>
            <span class="rc-card__stars" :aria-label="`체감난이도 ${e.difficulty}`">
              <AppIcon v-for="n in 5" :key="n" name="ui-star" :class="{ 'rc-card__star--on': n <= e.difficulty }" />
            </span>
            <p v-if="e.note" class="rc-card__note">{{ e.note }}</p>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppIcon from '@/shared/components/AppIcon.vue'
import { useAchievementStore } from '@/shared/stores/achievement'
import { useAchievementEntries } from '../composables/useAchievementEntries'
import { useAchievement } from '../composables/useAchievement'
import { categoryColor } from '../lib/planBoard'
import { getToday } from '@/shared/utils/dev-date'
import { toDateKey } from '../composables/useWeeklySchedule'

const store = useAchievementStore()
const { feedSorted, entries } = useAchievementEntries()
const { getDay } = useAchievement()

const loading = ref(true)
// 루틴은 사진·메모를 남기지 않는다 — 프로젝트 완료 기록만
const records = computed(() => { void entries.value; return feedSorted().filter((e) => e.itemType === 'project') })
const WEEK_HEAD = ['일', '월', '화', '수', '목', '금', '토']
const todayKey = computed(() => toDateKey(getToday()))
const groups = computed(() => {
  const out: { month: string; label: string; items: typeof records.value; lead: number; days: { day: number; level: number; today: boolean }[] }[] = []
  for (const e of records.value) {
    const month = e.date.slice(0, 7)
    let g = out.find((x) => x.month === month)
    if (!g) {
      const [y, m] = month.split('-').map(Number)
      g = { month, label: `${y}년 ${m}월`, items: [], lead: new Date(y!, m! - 1, 1).getDay(), days: [] }
      out.push(g)
    }
    g.items.push(e)
  }
  for (const g of out) {
    const [y, m] = g.month.split('-').map(Number)
    const count = new Map<number, number>()
    const last = new Date(y!, m!, 0).getDate()
    for (let d = 1; d <= last; d++) {
      const day = getDay(`${g.month}-${String(d).padStart(2, '0')}`)
      count.set(d, day.projects.length + day.routines.length)
    }
    g.days = Array.from({ length: last }, (_, i) => {
      const n = count.get(i + 1) ?? 0
      return { day: i + 1, level: n === 0 ? 0 : n <= 1 ? 1 : n <= 2 ? 2 : 3, today: `${g.month}-${String(i + 1).padStart(2, '0')}` === todayKey.value }
    })
  }
  return out
})
const totalHours = computed(() => {
  const min = records.value.reduce((n, e) => n + (e.elapsedSec ? e.elapsedSec / 60 : e.duration), 0)
  return min >= 60 ? `${Math.round(min / 60)}시간` : `${Math.round(min)}분`
})
const activeDays = computed(() => new Set(records.value.map((e) => e.date)).size)
const photoCount = computed(() => records.value.filter((e) => e.photoUrl).length)

const tint = (c: string) => `color-mix(in srgb, ${c} 14%, white)`
const DOW = ['일', '월', '화', '수', '목', '금', '토']
const dayLabel = (k: string) => { const [y, m, d] = k.split('-').map(Number); return `${m}/${d} (${DOW[new Date(y!, m! - 1, d!).getDay()]})` }

onMounted(async () => {
  try { await store.loadActivePlan() } finally { loading.value = false }
})
</script>

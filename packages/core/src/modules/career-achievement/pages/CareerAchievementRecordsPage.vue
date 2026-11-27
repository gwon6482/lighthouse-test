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
    <!-- 계획이 없으면 하단 메뉴가 없다 — 나가는 길을 남긴다(2026-11-26 나가는 길 점검) -->
    <RouterLink v-if="!loading && !store.hasActivePlan" to="/mypage" class="ah__empty-link rc-exit"><AppIcon name="ui-avatar" />내 계정</RouterLink>

    <section v-for="g in groups" :key="g.month" class="rc-month">
      <h2 class="rc-month__title">{{ g.label }} <small>{{ g.items.length }}개</small></h2>
      <!-- 기록한 날 달력 — 진하기 = 그날 완료한 일 수(프로젝트 + 루틴) + 바로 집중 기록 수(2026-11-26 — 쉬는 날 바로 집중도 '기록한 날') -->
      <div class="rc-cal" aria-hidden="true">
        <span v-for="w in WEEK_HEAD" :key="w" class="rc-cal__head">{{ w }}</span>
        <span v-for="n in g.lead" :key="'b' + n" />
        <span
          v-for="d in g.days" :key="d.day" class="rc-cal__day"
          :class="[`rc-cal__day--lv${d.level}`, { 'rc-cal__day--today': d.today }]"
        >{{ d.day }}</span>
      </div>
      <ul class="rc-grid">
        <li
          v-for="e in g.items" :key="e.date + e.itemId" class="rc-card"
          :class="{ 'rc-card--focus': focusKey === `${e.date}:${e.itemType}:${e.itemId}` }" :data-rec="`${e.date}:${e.itemType}:${e.itemId}`"
        >
          <div class="rc-card__photo" :style="e.photoUrl ? undefined : { background: tint(cardColor(e)), color: cardColor(e) }">
            <img v-if="e.photoUrl" :src="e.photoUrl" :alt="cardName(e)" loading="lazy">
            <AppIcon v-else :name="e.itemType === 'free' ? 'ui-duration' : e.itemType === 'routine' ? 'ui-repeat' : 'ui-done'" />
          </div>
          <div class="rc-card__body">
            <!-- 루틴·바로 집중(2026-11-26)은 꼬리표 — 프로젝트는 지금 그대로 -->
            <span v-if="e.itemType !== 'project'" class="rc-card__tag" :class="`rc-card__tag--${e.itemType}`">{{ e.itemType === 'free' ? FREE_LABEL : '루틴' }}</span>
            <span class="rc-card__name">{{ cardName(e) }}</span>
            <span class="rc-card__meta">
              {{ dayLabel(e.date) }}<template v-if="e.elapsedSec"> · {{ logMinutesLabel(e.elapsedSec) }}</template><template v-if="e.itemType === 'free' && projectName(e.projectId)"> · {{ projectName(e.projectId) }}</template>
            </span>
            <span v-if="e.itemType !== 'free'" class="rc-card__stars" :aria-label="`체감난이도 ${e.difficulty}`">
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
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import { useAchievementStore } from '@/shared/stores/achievement'
import { useAchievementEntries } from '../composables/useAchievementEntries'
import { useAchievement } from '../composables/useAchievement'
import { categoryColor } from '../lib/planBoard'
import { logMinutesLabel } from '../lib/focusTimer'
import { cardName, minutesByKind, FREE_LABEL } from '../lib/focusLog'
import { ROUTINE_COLOR } from '../composables/usePlanBoard'
import type { AchievementEntry } from '../composables/useAchievementEntries'
import { getToday } from '@/shared/utils/dev-date'
import { toDateKey } from '../composables/useWeeklySchedule'

const store = useAchievementStore()
const { feedSorted, entries } = useAchievementEntries()
const { getDay } = useAchievement()

const loading = ref(true)
// 기록 화면에서 저장한 것 모두(2026-11-26 집중모드 넓히기 — 오너 결정 3·6): 프로젝트 · 집중으로 남긴 루틴 · 바로 집중.
// '완료'만 누른 루틴은 기록(doneAt)이 없어 여기 오지 않는다
const records = computed(() => { void entries.value; return feedSorted() })
const FREE_COLOR = '#6B6B6B'
const cardColor = (e: AchievementEntry) => (e.itemType === 'free' ? FREE_COLOR : e.itemType === 'routine' ? ROUTINE_COLOR : categoryColor(e.itemCategory))
const projectName = (id?: string) => (id ? store.plan?.projects.find((p) => p.id === id)?.name ?? '' : '')
// 바로 집중은 완료가 아니라 getDay(완료 표시)에 없다 — 달력 진하기에는 기록 수로 더한다
const freeByDate = computed(() => {
  const m = new Map<string, number>()
  for (const e of records.value) if (e.itemType === 'free') m.set(e.date, (m.get(e.date) ?? 0) + 1)
  return m
})
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
      const key = `${g.month}-${String(d).padStart(2, '0')}`
      const day = getDay(key)
      count.set(d, day.projects.length + day.routines.length + (freeByDate.value.get(key) ?? 0))
    }
    g.days = Array.from({ length: last }, (_, i) => {
      const n = count.get(i + 1) ?? 0
      return { day: i + 1, level: n === 0 ? 0 : n <= 1 ? 1 : n <= 2 ? 2 : 3, today: `${g.month}-${String(i + 1).padStart(2, '0')}` === todayKey.value }
    })
  }
  return out
})
// 쌓은 시간 — 프로젝트는 집중한 시간(없으면 계획 시간), 루틴·바로 집중은 집중한 시간만(lib/focusLog)
const totalHours = computed(() => {
  const min = minutesByKind(records.value).total
  return min >= 60 ? `${Math.round(min / 60)}시간` : `${Math.round(min)}분`
})
const activeDays = computed(() => new Set(records.value.map((e) => e.date)).size)
const photoCount = computed(() => records.value.filter((e) => e.photoUrl).length)

const tint = (c: string) => `color-mix(in srgb, ${c} 14%, white)`
const DOW = ['일', '월', '화', '수', '목', '금', '토']
const dayLabel = (k: string) => { const [y, m, d] = k.split('-').map(Number); return `${m}/${d} (${DOW[new Date(y!, m! - 1, d!).getDay()]})` }

// 홈의 끝낸 줄 메뉴 '기록 보기'(#101, 2026-11-26) — 로그 상세(#98)가 생기기 전까지 그 카드로 내려 주고 잠깐 노랗게
const route = useRoute()
const focusKey = ref(typeof route.query.focus === 'string' ? route.query.focus : '')

onMounted(async () => {
  try { await store.loadActivePlan() } finally { loading.value = false }
  if (!focusKey.value) return
  await nextTick()
  const el = Array.from(document.querySelectorAll<HTMLElement>('[data-rec]')).find((x) => x.dataset.rec === focusKey.value)
  el?.scrollIntoView({ block: 'center' })
  setTimeout(() => { focusKey.value = '' }, 2500)
})
</script>

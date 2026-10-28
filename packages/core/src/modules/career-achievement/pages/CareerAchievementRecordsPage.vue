<template>
  <!-- 기록 모아보기(2026-10-28) — 프로젝트를 완료하며 남긴 사진·난이도·메모를 달마다. 마이페이지 '전체보기'·메인 타일에서 온다 -->
  <div class="rc">
    <header class="rc-bar">
      <button type="button" class="rc-bar__back" aria-label="뒤로" @click="safeBack(router, '/mypage')"><AppIcon name="ui-back" /></button>
      <h1 class="rc-bar__title">기록 모아보기</h1>
      <span class="rc-bar__count">{{ records.length }}개</span>
    </header>

    <div v-if="loading" class="ah__loading">불러오는 중...</div>
    <p v-else-if="!records.length" class="rc-empty">
      <AppIcon name="ui-photo" />
      아직 남긴 기록이 없어요.<br>프로젝트를 완료할 때 사진과 메모를 남기면 여기에 모여요.
    </p>

    <section v-for="g in groups" :key="g.month" class="rc-month">
      <h2 class="rc-month__title">{{ g.label }} <small>{{ g.items.length }}개</small></h2>
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
import { useRouter } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import { safeBack } from '@/shared/utils/navigation'
import { useAchievementStore } from '@/shared/stores/achievement'
import { useAchievementEntries } from '../composables/useAchievementEntries'
import { categoryColor } from '../lib/planBoard'

const router = useRouter()
const store = useAchievementStore()
const { feedSorted, entries } = useAchievementEntries()

const loading = ref(true)
// 루틴은 사진·메모를 남기지 않는다 — 프로젝트 완료 기록만
const records = computed(() => { void entries.value; return feedSorted().filter((e) => e.itemType === 'project') })
const groups = computed(() => {
  const out: { month: string; label: string; items: typeof records.value }[] = []
  for (const e of records.value) {
    const month = e.date.slice(0, 7)
    let g = out.find((x) => x.month === month)
    if (!g) { const [y, m] = month.split('-'); g = { month, label: `${y}년 ${+m!}월`, items: [] }; out.push(g) }
    g.items.push(e)
  }
  return out
})

const tint = (c: string) => `color-mix(in srgb, ${c} 14%, white)`
const DOW = ['일', '월', '화', '수', '목', '금', '토']
const dayLabel = (k: string) => { const [y, m, d] = k.split('-').map(Number); return `${m}/${d} (${DOW[new Date(y!, m! - 1, d!).getDay()]})` }

onMounted(async () => {
  try { await store.loadActivePlan() } finally { loading.value = false }
})
</script>

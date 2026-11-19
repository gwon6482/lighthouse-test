<template>
  <!-- 분류로 찾기 — 직업 목록(2026-11-17 시안 2판 · 같은 날 밤 사용성 확인 조정). 조건 칩, 조건 더하기(탭 3개까지),
       0개·적을 때 '하나 빼면'과 '하나만 빼고 맞아요'. 목록은 '나에게 맞는'이 아니라 '이것을 많이 쓰는' 직업이다 -->
  <div class="bl">
    <header class="bhd">
      <button type="button" class="bhd__back" aria-label="뒤로 가기" @click="back"><AppIcon name="ui-back" /></button>
      <span class="bhd__title">분류로 찾기</span>
      <button type="button" class="bhd__home" @click="goHome">진로백과 홈</button>
    </header>

    <div v-if="empty" class="bl__body">
      <BrowseEntry />
    </div>

    <div v-else class="bl__body">
      <p v-if="fromMine" class="bl__mine">내 검사 결과로 채웠어요 · 지울 수 있어요</p>
      <p class="bl__count">
        <template v-if="result">직업 {{ result.total }}개</template>
        <template v-else-if="failed">목록을 불러오지 못했어요</template>
        <template v-else>찾는 중…</template>
      </p>

      <div v-if="result" class="bl__chips">
        <span v-for="c in result.applied.conditions" :key="c.id" class="bl-chip">
          <button type="button" class="bl-chip__label" @click="editCondition(c.axis)">{{ c.label }}</button>
          <button type="button" class="bl-chip__x" :aria-label="`${c.label} 지우기`" @click="remove(c.id)">×</button>
        </span>
        <button v-if="canAdd" type="button" class="bl-add" @click="addCondition">+ 조건 더하기</button>
        <span v-else class="bl-add bl-add--full">조건 {{ MAX_CONDITIONS }}개를 다 골랐어요</span>
      </div>

      <!-- 결과가 없을 때 -->
      <div v-if="result && result.total === 0" class="bl-empty">
        <b>{{ condWord }} 조건을 다 갖춘 직업은<br />{{ jobsTotal }}개 중에 없어요</b>
        <span v-if="result.relax?.length">조건 하나를 빼면 더 볼 수 있어요</span>
      </div>

      <div v-if="result" class="bl__list">
        <BrowseJobCard v-for="row in result.data" :key="row.jobCode" :row="row" :guest="guest" @open="openRow(row)" />
      </div>
      <button v-if="result && result.data.length < result.total" type="button" class="bl__more" :disabled="loading" @click="loadMore">
        더 보기 <span>(남은 {{ result.total - result.data.length }}개)</span>
      </button>

      <!-- 결과가 적을 때 — 조건 하나씩 빼기(나중에 더한 것부터) · 하나만 빼고 맞는 직업(빠진 조건마다) -->
      <section v-if="result?.relax?.length" class="bl-relax">
        <p v-if="result.total > 0" class="bl-relax__lead">조건 하나를 빼면 더 볼 수 있어요</p>
        <button
          v-for="r in result.relax" :key="r.id" type="button" class="bl-drop"
          :class="{ 'bl-drop--zero': r.count === 0 }" :disabled="r.count === 0" @click="remove(r.id)"
        >
          <span class="bl-drop__label">'{{ r.label }}' 빼기</span> <span class="bl-drop__n">{{ r.count > 0 ? `${r.count}개 ›` : '그래도 0개' }}</span>
        </button>
      </section>
      <section v-if="nearGroups.length" class="bl-near">
        <h2 class="bl-near__title">
          하나만 빼고 맞아요
          <span>{{ nearTitleCount }}</span>
        </h2>
        <div v-for="g in nearGroups" :key="g.id" class="bl-near__group">
          <p class="bl-near__miss">'{{ g.label }}'만 안 맞아요 <span>{{ g.total }}개</span></p>
          <div class="bl__list">
            <BrowseJobCard v-for="row in g.rows" :key="`n-${row.jobCode}`" :row="row" :guest="guest" @open="openRow(row)" />
          </div>
          <button
            v-if="g.canMore && g.rows.length < g.total" type="button" class="bl__more"
            :disabled="nearLoading === g.id" @click="loadMoreNear(g.id)"
          >
            더 보기 <span>(남은 {{ g.total - g.rows.length }}개)</span>
          </button>
        </div>
        <RouterLink to="/career-encyclopedia" class="bl-near__explore">진로 둘러보기 <AppIcon name="ui-chevron-right" /></RouterLink>
      </section>

      <p v-if="result" class="bl__src">
        고용24 직업정보<template v-if="year">({{ year }}년 재직자 조사)</template> 기준이에요.<br />{{ jobsTotal }}개 직업 안에서 찾았어요.
      </p>
    </div>

    <!-- 묶음 직업 — 누른 이름과 열린 제목이 달라지지 않게 구성원을 고른다 -->
    <JobGroupPicker v-model="pickerOpen" :group-title="pickerTitle" :members="pickerMembers" @select="goJob" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import JobGroupPicker from '@/shared/components/JobGroupPicker.vue'
import { useAuthStore } from '@/shared/stores/auth'
import { features } from '@/shared/config/features'
import { safeBack } from '@/shared/utils/navigation'
import BrowseEntry from '../components/page/browse/BrowseEntry.vue'
import BrowseJobCard from '../components/page/browse/BrowseJobCard.vue'
import { useBrowseAxes, useBrowseQuery } from '../composables/useJobBrowse'
import {
  MAX_CONDITIONS, canAddCondition, conditionCount, isEmptyState, listQuery, nextAxisToAdd, orderFromQuery,
  groupNear, paramsFromState, stateFromQuery, withoutCondition,
} from '../lib/browseQuery'
import type { BrowseAxisKey, BrowseRow } from '../types/browse'

const PAGE = 30
const MAX_RESTORE = 150   // 서버 limit 상한과 같다 — 상세에서 돌아오면 펼쳤던 만큼 한 번에 다시 받는다
const SCROLL_KEY = 'lh_browse_scroll'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const guest = features.guestEntry && !auth.isLoggedIn
const { axes, load: loadAxes } = useBrowseAxes()
const { result, loading, failed, run, more, moreNear, nearLoading } = useBrowseQuery()

const state = computed(() => stateFromQuery(route.query))
const order = computed(() => orderFromQuery(route.query))
const empty = computed(() => isEmptyState(state.value))
const canAdd = computed(() => canAddCondition(state.value))
const fromMine = computed(() => route.query.mine === '1')
const jobsTotal = computed(() => axes.value?.jobs ?? 537)
const year = computed(() => axes.value?.source.surveyYear ?? null)
const condWord = computed(() => ({ 2: '두', 3: '세' } as Record<number, string>)[conditionCount(state.value)] ?? '모든')

const opts = (limit: number) => ({
  limit,
  ...(order.value.length ? { sort: order.value[0]!, order: order.value.join(',') } : {}),
})
// 조건·순서가 바뀔 때만 다시 받는다(펼친 수 n 은 주소에만 남긴다)
watch(() => JSON.stringify([paramsFromState(state.value), order.value]), () => {
  if (empty.value) return
  const n = Math.min(Number(route.query.n) || 0, MAX_RESTORE)
  run(state.value, opts(Math.max(PAGE, n)))
}, { immediate: true })
async function loadMore() {
  await more(state.value, opts(PAGE))
  const shown = result.value?.data.length ?? 0
  if (shown > PAGE) router.replace({ query: { ...route.query, n: String(shown) } })
}

// ── 상세에서 돌아오면 보던 자리로 ──
onBeforeRouteLeave((to) => {
  if (!to.path.startsWith('/career-encyclopedia/job/')) return
  try { sessionStorage.setItem(SCROLL_KEY, JSON.stringify({ path: route.fullPath, y: window.scrollY })) } catch { /* 없음 */ }
})
watch(() => result.value, async (r) => {
  if (!r) return
  let saved: { path: string; y: number } | null = null
  try { saved = JSON.parse(sessionStorage.getItem(SCROLL_KEY) || 'null') } catch { /* 없음 */ }
  if (!saved || saved.path !== route.fullPath) return
  await nextTick()
  window.scrollTo(0, saved.y)
  try { sessionStorage.removeItem(SCROLL_KEY) } catch { /* 없음 */ }
})

// ── 조건 바꾸기 — 이 자리를 바꾼다(replace). 뒤로 가기가 지나온 목록을 하나씩 되짚지 않게 ──
function remove(id: string) {
  const next = withoutCondition(state.value, id)
  router.replace({ path: route.path, query: listQuery(next, order.value) })
}
function editCondition(axis: BrowseAxisKey) {
  router.push({ path: `/career-encyclopedia/browse/${axis}`, query: { ...listQuery(state.value, order.value), from: 'list', pd: '1' } })
}
function addCondition() {
  const axis = nextAxisToAdd(state.value)
  if (axis) editCondition(axis)
}

// ── 하나만 빼고 맞아요 — 빠진 조건마다 묶는다(서버가 나중에 더한 조건부터, 묶음마다 몇 줄씩 이어 보낸다) ──
// 묶음 수는 자르기 전 전체 수(nearGroups.total). 옛 서버(nearGroups 없음)면 받은 줄 수를 쓰고 더 보기를 두지 않는다
const nearGroups = computed(() => groupNear(result.value?.near, result.value?.nearGroups))
const nearTitleCount = computed(() => {
  const shown = result.value?.near?.length ?? 0
  const total = result.value?.nearTotal ?? shown
  // 묶음마다 더 볼 수 있으면 전체 수만, 옛 서버처럼 잘렸는데 더 볼 수 없으면 '전체 중 몇'
  if (result.value?.nearGroups || total <= shown) return `${total}개`
  return `${total}개 중 ${shown}개`
})
function loadMoreNear(id: string) {
  moreNear(state.value, id, opts(PAGE))
}

// ── 묶음 직업 ──
const pickerOpen = ref(false)
const pickerTitle = ref('')
const pickerMembers = ref<{ jobCode: string; title: string }[]>([])
function openRow(row: BrowseRow) {
  if ((row.members?.length ?? 1) > 1) {
    pickerTitle.value = row.title
    pickerMembers.value = row.members ?? []
    pickerOpen.value = true
    return
  }
  goJob(row.jobCode)
}
function goJob(jobCode: string) {
  router.push(`/career-encyclopedia/job/${jobCode}`)
}
function back() {
  safeBack(router, '/career-encyclopedia')
}
/** 진로백과 홈 — 홈에서 왔으면 되돌아가고(쌓지 않게), 아니면 연다 */
function goHome() {
  if (window.history.state?.back === '/career-encyclopedia') router.back()
  else router.push('/career-encyclopedia')
}
onMounted(loadAxes)
</script>

<template>
  <!-- 분류로 찾기 — 직업 목록(2026-11-17 시안 2판 · 같은 날 밤 사용성 확인 조정). 조건 칩, 조건 더하기(탭 3개까지),
       0개·적을 때 '하나 빼면'과 '하나만 빼고 맞아요'. 목록은 '나에게 맞는'이 아니라 '이것을 많이 쓰는' 직업이다 -->
  <div class="bl">
    <header class="bhd">
      <button type="button" class="bhd__back" aria-label="뒤로" @click="back"><AppIcon name="ui-back" /></button>
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
        <!-- 칩 앞에 탭 이름을 옅게(2026-11-19 다듬기 2차 11). 같은 탭 여럿은 '또는' — 글은 서버가 만들고 '또는'·'· 빼기'만 옅게 -->
        <span v-for="c in result.applied.conditions" :key="c.id" class="bl-chip">
          <button type="button" class="bl-chip__label" :aria-label="chipAriaLabel(c, '고치기')" @click="editCondition(c.axis)">
            <span v-if="axisName(c.axis)" class="bl-chip__ax">{{ axisName(c.axis) }}</span>
            <template v-for="(p, i) in chipPieces(c.label)" :key="i"><span v-if="p.faint" class="bl-chip__or">{{ p.text }}</span><template v-else>{{ p.text }}</template></template>
          </button>
          <button type="button" class="bl-chip__x" :aria-label="chipAriaLabel(c, '지우기')" @click="remove(c.id)">×</button>
        </span>
        <button v-if="canAdd" type="button" class="bl-add" @click="addCondition">+ 조건 더하기</button>
        <span v-else class="bl-add bl-add--full">조건 {{ MAX_CONDITIONS }}개를 다 골랐어요</span>
      </div>

      <!-- 결과가 없을 때 -->
      <div v-if="result && result.total === 0" class="bl-empty">
        <b>{{ condWord }} 조건을 다 갖춘 직업은<br />{{ jobsTotal }}개 중에 없어요</b>
        <span v-if="relaxMore.length">조건 하나를 빼면 더 볼 수 있어요</span>
      </div>

      <div v-if="result" class="bl__list">
        <BrowseJobCard v-for="row in result.data" :key="row.jobCode" :row="row" :guest="guest" @open="openRow(row)" />
      </div>
      <button v-if="result && result.data.length < result.total" type="button" class="bl__more" :disabled="loading" @click="loadMore">
        더 보기 <span>(남은 {{ result.total - result.data.length }}개)</span>
      </button>

      <!-- 결과가 적을 때 — 조건 하나씩 빼기(나중에 더한 것부터) · 하나만 빼고 맞는 직업(빠진 조건마다) -->
      <!-- 숫자는 '더 볼 수 있는' 수 = 아래 '○○만 안 맞아요' 묶음 수와 같은 기준(지금 결과는 빼고). 더 볼 게 없는 조건은 숨긴다(2026-11-19 다듬기 3차) -->
      <section v-if="result && relaxMore.length" class="bl-relax">
        <p v-if="result.total > 0" class="bl-relax__lead">조건 하나를 빼면 더 볼 수 있어요</p>
        <button v-for="r in relaxMore" :key="r.id" type="button" class="bl-drop" @click="remove(r.id)">
          <span class="bl-drop__label">'{{ r.label }}' 빼기</span> <span class="bl-drop__n">{{ r.more }}개 더 ›</span>
        </button>
      </section>
      <section v-if="nearGroups.length" class="bl-near">
        <h2 class="bl-near__title">
          하나만 빼고 맞아요
          <span>{{ nearTitleCount }}</span>
        </h2>
        <!-- 묶음 제목은 스크롤해도 위에 붙고(그 묶음 안에서), 탭 이름으로 짧게. 칸 이름은 카드의 '안 맞아요' 줄에 맡긴다(2026-11-19 다듬기 2차 10) -->
        <div v-for="(g, gi) in nearGroups" :id="`near-${g.id}`" :key="g.id" class="bl-near__group">
          <div class="bl-near__miss">
            <p :id="`near-${g.id}-title`" class="bl-near__miss-title" tabindex="-1">{{ nearGroupTitle(g) }} <span>{{ g.total }}개</span></p>
            <button
              v-if="nearGroups[gi + 1]" type="button" class="bl-near__jump"
              :aria-label="`${nearGroupTitle(nearGroups[gi + 1]!)} ${nearGroups[gi + 1]!.total}개로 내려가기`"
              @click="jumpNear(nearGroups[gi + 1]!.id)"
            >
              {{ nearJumpLabel(nearGroups[gi + 1]!) }} {{ nearGroups[gi + 1]!.total }}개 <AppIcon name="ui-chevron-down" :size="12" />
            </button>
          </div>
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
import { safeBack } from '@/shared/utils/navigation'
import BrowseEntry from '../components/page/browse/BrowseEntry.vue'
import BrowseJobCard from '../components/page/browse/BrowseJobCard.vue'
import { useBrowseAxes, useBrowseQuery } from '../composables/useJobBrowse'
import {
  MAX_CONDITIONS, axisName, canAddCondition, chipAriaLabel, chipPieces, conditionCount, isEmptyState, listQuery, nextAxisToAdd,
  orderFromQuery, groupNear, paramsFromState, relaxWithMore, stateFromQuery, withoutCondition, type NearGroup,
} from '../lib/browseQuery'
import { clearPosition, positionKey, readPosition, savePosition, type BrowsePosition } from '../lib/browsePosition'
import type { BrowseAxisKey, BrowseRow } from '../types/browse'

const PAGE = 30
const MAX_RESTORE = 150   // 서버 limit·nearLimit 상한과 같다 — 돌아오면 펼쳤던 만큼 한 번에 다시 받는다

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const guest = !auth.isLoggedIn
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
// 조건·순서가 바뀔 때만 다시 받는다. 펼친 수는 주소(n)와 '보던 자리'(상세·로그인에서 돌아올 때) 중 큰 쪽만큼 한 번에 받는다
const listKey = computed(() => positionKey(state.value, order.value))
watch(listKey, async () => {
  if (empty.value) return
  const pos = readPosition(listKey.value)
  // 다른 목록을 열었으면 남은 자리는 버린다 — 조건을 더했다 다시 뺐을 때 옛 자리로 뛰지 않게
  if (!pos) clearPosition()
  const n = Math.min(Math.max(Number(route.query.n) || 0, pos?.n ?? 0), MAX_RESTORE)
  const r = await run(state.value, opts(Math.max(PAGE, n)))
  if (!r) return
  if (pos) await restorePosition(pos)
}, { immediate: true })
// 펼친 수는 주소에 쓰지 않는다 — router.replace 가 라우터 scrollBehavior(top 0)를 불러 '더 보기'를 누르면 맨 위로 튀었다(2026-11-19 발견).
// 돌아올 때 펼친 수는 '보던 자리'가 지킨다. 예전 주소의 n 은 그대로 읽는다
function loadMore() {
  more(state.value, opts(PAGE))
}

// ── 보던 자리 — 상세, 조건 고치기(→ 가입·로그인)로 떠날 때 남기고, 같은 조건 목록으로 돌아오면 되살린다 ──
const KEEP_FOR = ['/career-encyclopedia/job/', '/career-encyclopedia/browse/', '/onboarding/auth']
onBeforeRouteLeave((to) => {
  if (!result.value || !KEEP_FOR.some((p) => to.path.startsWith(p))) return
  const near: Record<string, number> = {}
  for (const g of nearGroups.value) near[g.id] = g.rows.length
  savePosition({ key: listKey.value, n: result.value.data.length, near, y: window.scrollY })
})
/** '하나만 빼고 맞아요' 묶음마다 펼쳤던 만큼 더 받은 뒤 스크롤을 되돌린다. 한 번 쓰면 지운다 */
async function restorePosition(pos: BrowsePosition) {
  for (const [id, want] of Object.entries(pos.near)) {
    const g = nearGroups.value.find((x) => x.id === id)
    if (!g?.canMore || g.rows.length >= Math.min(want, g.total)) continue
    await moreNear(state.value, id, opts(PAGE), Math.min(want - g.rows.length, MAX_RESTORE))
  }
  clearPosition()
  await nextTick()
  window.scrollTo(0, pos.y)
}

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
const relaxMore = computed(() => relaxWithMore(result.value))
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
/**
 * '업무 환경만 안 맞아요' — 칸 이름은 카드의 '안 맞아요' 줄에 맡긴다. 옛 서버(카드에 missing.parts 가 없다)면
 * 카드에 그 줄이 없으므로 예전처럼 조건 글을 제목에 쓴다('…'만 안 맞아요)
 */
const nearGroupShort = (g: NearGroup) => {
  const cardsTell = g.rows.some((r) => r.missing?.parts !== undefined || r.missing?.noData !== undefined)
  return cardsTell && axisName(g.axis) ? `${axisName(g.axis)}만` : `'${g.label}'만`
}
const nearGroupTitle = (g: NearGroup) => `${nearGroupShort(g)} 안 맞아요`
/** 다음 묶음 바로가기는 늘 짧게(탭 이름) */
const nearJumpLabel = (g: NearGroup) => (axisName(g.axis) ? `${axisName(g.axis)}만` : nearGroupShort(g))
/** 다음 묶음으로 내려가기 — 제목에 초점을 옮겨 화면 읽기도 따라가게 */
function jumpNear(id: string) {
  const el = document.getElementById(`near-${id}`)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  document.getElementById(`near-${id}-title`)?.focus({ preventScroll: true })
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

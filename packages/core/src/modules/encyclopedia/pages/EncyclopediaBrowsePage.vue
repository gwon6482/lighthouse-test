<template>
  <!-- 분류로 찾기 — 직업 목록(2026-11-17 시안 2판). 조건 칩, 조건 더하기(3개까지), 0개·적을 때 '하나 빼면'과 '하나만 빼고 맞아요'.
       목록은 '나에게 맞는'이 아니라 '이것을 많이 쓰는' 직업이다 — 점수·순위·'추천'을 쓰지 않는다 -->
  <div class="bl">
    <header class="bhd">
      <button type="button" class="bhd__back" aria-label="뒤로" @click="back"><AppIcon name="ui-back" /></button>
      <span class="bhd__title">분류로 찾기</span>
    </header>

    <div v-if="empty" class="bl__body">
      <BrowseEntry />
    </div>

    <div v-else class="bl__body">
      <p class="bl__count">
        <template v-if="result">직업 {{ result.total }}개</template>
        <template v-else-if="failed">목록을 불러오지 못했어요</template>
        <template v-else>찾는 중…</template>
      </p>

      <div v-if="result" class="bl__chips">
        <span v-for="c in result.applied.conditions" :key="c.id" class="bl-chip">
          <button type="button" class="bl-chip__label" @click="editCondition(c.axis)">{{ c.label }}</button>
          <button type="button" class="bl-chip__x" :aria-label="`${c.label} 빼기`" @click="remove(c.id)">×</button>
        </span>
        <template v-if="!groupList">
          <button v-if="canAdd" type="button" class="bl-add" @click="addCondition">+ 조건 더하기</button>
          <span v-else class="bl-add bl-add--full">조건 {{ MAX_CONDITIONS }}개를 다 골랐어요</span>
        </template>
      </div>

      <!-- 결과가 없을 때 -->
      <div v-if="result && result.total === 0" class="bl-empty">
        <b>{{ condWord }} 조건을 다 갖춘 직업은<br />{{ jobsTotal }}개 중에 없어요</b>
        <span v-if="result.relax?.length">조건 하나를 빼면 더 볼 수 있어요</span>
      </div>

      <div v-if="result" class="bl__list">
        <BrowseJobCard v-for="row in result.data" :key="row.jobCode" :row="row" :guest="guest" @open="openRow(row)" />
      </div>
      <button v-if="result && result.data.length < result.total" type="button" class="bl__more" :disabled="loading" @click="loadMore">더 보기</button>

      <!-- 결과가 적을 때 — 조건 하나씩 빼기 · 하나만 빼고 맞는 직업 -->
      <section v-if="result?.relax?.length" class="bl-relax">
        <p v-if="result.total > 0" class="bl-relax__lead">조건 하나를 빼면 더 볼 수 있어요</p>
        <button
          v-for="r in result.relax" :key="r.id" type="button" class="bl-drop"
          :class="{ 'bl-drop--zero': r.count === 0 }" :disabled="r.count === 0" @click="remove(r.id)"
        >
          '{{ r.label }}' 빼기 <span>{{ r.count > 0 ? `${r.count}개 ›` : '그래도 0개' }}</span>
        </button>
      </section>
      <section v-if="result?.near?.length" class="bl-near">
        <h2 class="bl-near__title">하나만 빼고 맞아요 <span>{{ result.near.length }}개</span></h2>
        <div class="bl__list">
          <BrowseJobCard v-for="row in result.near" :key="`n-${row.jobCode}`" :row="row" :guest="guest" @open="openRow(row)" />
        </div>
        <RouterLink to="/career-encyclopedia" class="bl-near__explore">진로 둘러보기</RouterLink>
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
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import JobGroupPicker from '@/shared/components/JobGroupPicker.vue'
import { useAuthStore } from '@/shared/stores/auth'
import { features } from '@/shared/config/features'
import { safeBack } from '@/shared/utils/navigation'
import BrowseEntry from '../components/page/browse/BrowseEntry.vue'
import BrowseJobCard from '../components/page/browse/BrowseJobCard.vue'
import { useBrowseAxes, useBrowseQuery } from '../composables/useJobBrowse'
import {
  MAX_CONDITIONS, canAddCondition, conditionCount, isEmptyState, isGroupList, nextAxisToAdd,
  paramsFromState, queryFromState, stateFromQuery, withoutCondition,
} from '../lib/browseQuery'
import type { BrowseAxisKey, BrowseRow } from '../types/browse'

const PAGE = 30
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const guest = features.guestEntry && !auth.isLoggedIn
const { axes, load: loadAxes } = useBrowseAxes()
const { result, loading, failed, run, more } = useBrowseQuery()

const state = computed(() => stateFromQuery(route.query))
const sortQ = computed(() => (typeof route.query.sort === 'string' ? route.query.sort : ''))
const empty = computed(() => isEmptyState(state.value))
const groupList = computed(() => isGroupList(state.value))
const canAdd = computed(() => canAddCondition(state.value))
const jobsTotal = computed(() => axes.value?.jobs ?? 537)
const year = computed(() => axes.value?.source.surveyYear ?? null)
const condWord = computed(() => ({ 2: '두', 3: '세', 4: '네' } as Record<number, string>)[conditionCount(state.value)] ?? '모든')

const opts = () => ({ limit: PAGE, ...(sortQ.value ? { sort: sortQ.value } : {}) })
watch(() => JSON.stringify([paramsFromState(state.value), sortQ.value]), () => {
  if (!empty.value) run(state.value, opts())
}, { immediate: true })
function loadMore() {
  more(state.value, opts())
}

const keepSort = (): Record<string, string> => (sortQ.value ? { sort: sortQ.value } : {})
function remove(id: string) {
  router.replace({ path: route.path, query: queryFromState(withoutCondition(state.value, id), keepSort()) })
}
function editCondition(axis: BrowseAxisKey) {
  router.push({ path: `/career-encyclopedia/browse/${axis}`, query: { ...route.query, from: 'list' } })
}
function addCondition() {
  const axis = nextAxisToAdd(state.value)
  if (axis) editCondition(axis)
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
onMounted(loadAxes)
</script>

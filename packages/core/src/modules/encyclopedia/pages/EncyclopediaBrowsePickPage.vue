<template>
  <!-- 분류로 찾기 — 고르기 화면(2026-11-17 시안 2판 · 같은 날 밤 사용성 확인 조정).
       탭 하나 = 조건 하나. 탭 안 체크박스 여럿은 '또는', 업무 환경의 자세·고객 상대·빼기는 그 탭 안에서 함께 적용.
       고른 것은 주소(query)에 담는다 — 뒤로 가기·안드로이드 뒤로 버튼(R4)이 그대로 맞는다 -->
  <div class="bp">
    <header class="bhd">
      <button type="button" class="bhd__back" aria-label="뒤로 가기" @click="back"><AppIcon name="ui-back" /></button>
      <span class="bhd__title">{{ topItem ? topItem.name : '분류로 찾기' }}</span>
    </header>

    <div class="bp__body">
      <div v-if="!topCode" ref="tabsEl" class="bp__tabs" role="tablist">
        <button
          v-for="k in BROWSE_AXES" :key="k" type="button" role="tab" class="bp__tab"
          :class="{ 'bp__tab--on': k === axisKey }" :aria-selected="k === axisKey"
          :disabled="k !== axisKey && !canUseAxis(tentative, k)" @click="switchAxis(k)"
        >
          {{ AXIS_NAME[k] }}<AppIcon v-if="k === 'salary' && guest" name="ui-privacy" :size="11" class="bp__tab-lock" aria-label="가입 후" />
          <i v-if="k !== axisKey && tentative[k].length" class="bp__tab-dot" aria-hidden="true" />
        </button>
      </div>

      <h1 class="bp__q">{{ topCode ? '직무를 골라요' : QUESTION[axisKey] }}</h1>
      <p v-if="axesFailed" class="bp__fail">분류를 불러오지 못했어요. 잠시 후 다시 시도해 주세요</p>
      <p v-else-if="!axes" class="bp__loading">불러오는 중…</p>
      <p v-else-if="limited" class="bp__limit">조건은 {{ MAX_CONDITIONS }}개까지 고를 수 있어요. 다른 조건을 빼면 고를 수 있어요</p>

      <template v-if="axes">
        <!-- 직무: 대분류 → 직무. 직무 단위로 다른 조건과 섞어도 된다(남는 수를 미리 보여 주고 0개 보기는 흐리므로) -->
        <div v-if="axisKey === 'group'" class="bp__list">
          <template v-if="!topCode">
            <button
              v-for="t in axisOf('group')?.items ?? []" :key="t.code" type="button" class="bp-row"
              :class="{ 'bp-row--on': pickedUnder(t), ...dimClass('group', t.code) }"
              :disabled="isOff('group', t.code)" @click="openTop(t.code)"
            >
              <span class="bp-row__name">{{ t.name }}<small v-if="t.fullName && squash(t.fullName) !== squash(t.name)">{{ t.fullName }}</small></span>
              <span class="bp-row__n">{{ countOf('group', t.code) ?? '' }}</span>
              <AppIcon name="ui-chevron-right" class="bp-row__go" />
            </button>
          </template>
          <template v-else>
            <label class="bp-rd bp-rd--all" :class="{ 'bp-rd--on': draft.includes(topCode), ...dimClass('group', topCode) }">
              <input type="radio" class="bp__input" name="group" :checked="draft.includes(topCode)" :disabled="isOff('group', topCode)" @change="draft = [topCode]" />
              <i class="bp-rd__dot" aria-hidden="true" />
              <span class="bp-ck__name">{{ topItem?.name }} 전체</span>
              <span class="bp-ck__n">{{ countOf('group', topCode) ?? '' }}</span>
            </label>
            <label
              v-for="g in topItem?.children ?? []" :key="g.code" class="bp-rd"
              :class="{ 'bp-rd--on': draft.includes(g.code), ...dimClass('group', g.code) }"
            >
              <input type="radio" class="bp__input" name="group" :checked="draft.includes(g.code)" :disabled="isOff('group', g.code)" @change="draft = [g.code]" />
              <i class="bp-rd__dot" aria-hidden="true" />
              <span class="bp-ck__name">{{ g.name }}</span>
              <span class="bp-ck__n">{{ countOf('group', g.code) ?? '' }}</span>
            </label>
          </template>
        </div>

        <!-- 관심 분야: 7묶음 33개, 여럿 고르면 '또는' -->
        <template v-else-if="axisKey === 'interest'">
          <div class="bp__groups">
            <section v-for="g in axisOf('interest')?.items ?? []" :key="g.code" class="bp-grp">
              <button type="button" class="bp-grp__head" :aria-expanded="isOpen(g.code)" @click="toggleOpen(g.code)">
                <span class="bp-grp__name">{{ g.name }}</span>
                <span v-if="pickedIn(g)" class="bp-grp__picked">{{ pickedIn(g) }}개 고름</span>
                <AppIcon name="ui-chevron-down" class="bp-grp__chev" :class="{ 'bp-grp__chev--open': isOpen(g.code) }" />
              </button>
              <div v-if="isOpen(g.code)" class="bp__list bp__list--in">
                <label class="bp-ck bp-ck--all" :class="{ 'bp-ck--on': allPicked(g), ...dimClass('interest', '', true) }">
                  <input type="checkbox" class="bp__input" :checked="allPicked(g)" :disabled="!canPick" @change="toggleAll(g)" />
                  <i class="bp-ck__box" aria-hidden="true" />
                  <span class="bp-ck__name">{{ g.name }} 전체</span>
                  <span class="bp-ck__n">{{ hasOthers ? '' : g.count }}</span>
                </label>
                <label v-for="f in g.children ?? []" :key="f.code" class="bp-ck" :class="{ 'bp-ck--on': draft.includes(f.code), ...dimClass('interest', f.code) }">
                  <input type="checkbox" class="bp__input" :checked="draft.includes(f.code)" :disabled="isOff('interest', f.code)" @change="toggle(f.code)" />
                  <i class="bp-ck__box" aria-hidden="true" />
                  <span class="bp-ck__name">{{ f.name }}</span>
                  <span class="bp-ck__n">{{ countOf('interest', f.code) ?? '' }}</span>
                </label>
              </div>
            </section>
          </div>
          <p class="bp__or">여럿 고르면 하나라도 맞는 직업을 보여 줘요</p>
        </template>

        <!-- 업무 환경: 탭 전체가 조건 하나. 자세·고객 상대는 하나만(동그라미), '이런 일이면 좋아요'는 또는(네모), '빼고 싶어요'는 모두 뺀다 -->
        <div v-else-if="axisKey === 'env'" class="bp__env">
          <template v-for="sec in axisOf('env')?.sections ?? []" :key="sec.key">
            <p class="bp__sub">{{ sec.name }} <span>{{ sec.select === 'single' ? '하나만' : '여럿' }}</span></p>
            <div class="bp__list">
              <template v-if="sec.select === 'single'">
                <label class="bp-rd" :class="{ 'bp-rd--on': !sectionPick(sec.items) }">
                  <input type="radio" class="bp__input" :name="`env-${sec.key}`" :checked="!sectionPick(sec.items)" @change="setSection(sec.items, null)" />
                  <i class="bp-rd__dot" aria-hidden="true" />
                  <span class="bp-ck__name">상관없어요</span>
                </label>
                <label v-for="it in sec.items" :key="it.code" class="bp-rd" :class="{ 'bp-rd--on': draft.includes(it.code), ...dimClass('env', it.code) }">
                  <input type="radio" class="bp__input" :name="`env-${sec.key}`" :checked="draft.includes(it.code)" :disabled="isOff('env', it.code)" @change="setSection(sec.items, it.code)" />
                  <i class="bp-rd__dot" aria-hidden="true" />
                  <span class="bp-ck__name">{{ it.name }}</span>
                  <span class="bp-ck__n">{{ countOf('env', it.code) ?? '' }}</span>
                </label>
              </template>
              <template v-else>
                <label v-for="it in sec.items" :key="it.code" class="bp-ck" :class="{ 'bp-ck--on': draft.includes(it.code), ...dimClass('env', it.code) }">
                  <input type="checkbox" class="bp__input" :checked="draft.includes(it.code)" :disabled="isOff('env', it.code)" @change="toggle(it.code)" />
                  <i class="bp-ck__box" aria-hidden="true" />
                  <span class="bp-ck__name">{{ it.name }}</span>
                  <span class="bp-ck__n">{{ countOf('env', it.code) ?? '' }}</span>
                </label>
              </template>
            </div>
            <p v-if="sec.key === 'prefer'" class="bp__or">여럿 고르면 하나라도 맞는 직업을 보여 줘요</p>
          </template>
        </div>

        <!-- 재능 · 가치관: 여럿 고르면 '또는'. 가치관 '경제적 보상'은 연봉으로 안내 -->
        <template v-else-if="axisKey === 'talent' || axisKey === 'value'">
          <div class="bp__list">
            <template v-for="it in axisOf(axisKey)?.items ?? []" :key="it.code">
              <button v-if="it.redirect" type="button" class="bp-row bp-row--redirect" @click="switchAxis(it.redirect)">
                <span class="bp-row__name">{{ it.name }}<small>연봉으로 찾아요</small></span>
                <AppIcon name="ui-chevron-right" class="bp-row__go" />
              </button>
              <label v-else class="bp-ck" :class="{ 'bp-ck--on': draft.includes(it.code), ...dimClass(axisKey, it.code) }">
                <input type="checkbox" class="bp__input" :checked="draft.includes(it.code)" :disabled="isOff(axisKey, it.code)" @change="toggle(it.code)" />
                <i class="bp-ck__box" aria-hidden="true" />
                <span class="bp-ck__name">{{ it.name }}<small v-if="it.basis?.length">{{ it.basis.join('·') }}</small><small v-else-if="it.desc">{{ it.desc }}</small></span>
                <span class="bp-ck__n">{{ countOf(axisKey, it.code) ?? '' }}</span>
              </label>
            </template>
          </div>
          <p class="bp__or">여럿 고르면 하나라도 맞는 직업을 보여 줘요</p>
        </template>

        <!-- 연봉: '이 정도 이상' 하나. 비회원은 잠근다(직업 상세의 연봉 잠금과 같게) -->
        <div v-else-if="axisKey === 'salary'">
          <div v-if="guest" class="bp-lock">
            <span class="bp-lock__icon"><AppIcon name="ui-privacy" /></span>
            <b>가입하면 연봉으로도 찾을 수 있어요</b>
            <RouterLink :to="signupTo" class="bp-lock__cta">가입하고 연봉 보기</RouterLink>
          </div>
          <template v-else>
            <div class="bp__list">
              <label class="bp-rd" :class="{ 'bp-rd--on': !draft.length }">
                <input type="radio" class="bp__input" name="salary" :checked="!draft.length" @change="draft = []" />
                <i class="bp-rd__dot" aria-hidden="true" />
                <span class="bp-ck__name">상관없어요</span>
              </label>
              <label v-for="it in axisOf('salary')?.items ?? []" :key="it.code" class="bp-rd" :class="{ 'bp-rd--on': draft.includes(it.code), ...dimClass('salary', it.code) }">
                <input type="radio" class="bp__input" name="salary" :checked="draft.includes(it.code)" :disabled="isOff('salary', it.code)" @change="draft = [it.code]" />
                <i class="bp-rd__dot" aria-hidden="true" />
                <span class="bp-ck__name">{{ it.name }}</span>
                <span class="bp-ck__n">{{ countOf('salary', it.code) ?? '' }}</span>
              </label>
            </div>
            <p class="bp__note">이 일을 하는 사람들 연봉의 <b>중간값</b>이에요. 경력이 쌓인 사람도 들어 있어 첫 연봉과 달라요.<template v-if="axes.source.surveyYear"> 고용24 {{ axes.source.surveyYear }}년 조사예요.</template></p>
          </template>
        </div>
      </template>
    </div>

    <div v-if="showCta" class="bp__foot">
      <button type="button" class="bp__cta" :disabled="ctaDisabled" @click="applyCodes(draft)">{{ ctaLabel }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/shared/components/AppIcon.vue'
import { useAuthStore } from '@/shared/stores/auth'
import { features } from '@/shared/config/features'
import { safeBack } from '@/shared/utils/navigation'
import { useBrowseAxes, useBrowseQuery } from '../composables/useJobBrowse'
import {
  BROWSE_AXES, MAX_CONDITIONS, canUseAxis, conditionCount, isEmptyState, listQuery, nextOrder, orderFromQuery,
  paramsFromState, stateFromQuery, withAxis, type BrowseState,
} from '../lib/browseQuery'
import type { BrowseAxisKey, BrowseOption } from '../types/browse'

const AXIS_NAME: Record<BrowseAxisKey, string> = { group: '직무', interest: '관심 분야', env: '업무 환경', talent: '재능', value: '가치관', salary: '연봉' }
const QUESTION: Record<BrowseAxisKey, string> = {
  group: '어떤 일을 하고 싶어요?',
  interest: '어떤 분야에 관심이 있어요?',
  env: '어떻게 일하고 싶어요?',
  talent: '어떤 재능을 쓰고 싶어요?',
  value: '일할 때 무엇이 중요해요?',
  salary: '연봉은 이 정도면 좋아요',
}

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const guest = features.guestEntry && !auth.isLoggedIn
const { axes, failed: axesFailed, load: loadAxes } = useBrowseAxes()
const baseQ = useBrowseQuery()   // 이 탭을 뺀 나머지 조건 — 보기마다 개수(같은 탭 안의 다른 선택과 상관없이)
const tentQ = useBrowseQuery()   // 지금 고른 것까지 — 버튼의 직업 수, 업무 환경 보기 개수(그 보기를 넣었을 때)

const axisKey = computed<BrowseAxisKey>(() => {
  const a = String(route.params.axis ?? '')
  return (BROWSE_AXES as string[]).includes(a) ? (a as BrowseAxisKey) : 'interest'
})
const fromList = computed(() => route.query.from === 'list')
/** 고르기 화면 깊이 — 이 화면이 연 곳(홈·목록) 위에 몇 칸 쌓였나. 적용하면 그만큼 되돌아간다 */
const pd = computed(() => Number(route.query.pd) || 0)
const state = computed(() => stateFromQuery(route.query))
const order = computed(() => orderFromQuery(route.query))
const base = computed(() => withAxis(state.value, axisKey.value, []))
const hasOthers = computed(() => conditionCount(base.value) > 0)
const draft = ref<string[]>([])
watch(() => [axisKey.value, String(route.query[axisKey.value] ?? '')], () => { draft.value = [...state.value[axisKey.value]] }, { immediate: true })
const tentative = computed(() => withAxis(state.value, axisKey.value, draft.value))

const axisOf = (k: BrowseAxisKey) => axes.value?.axes.find((a) => a.key === k)
const squash = (s: string) => s.replace(/\s/g, '')

// ── 직무 ──
const topCode = computed(() => (axisKey.value === 'group' && typeof route.query.top === 'string' ? route.query.top : ''))
const topItem = computed(() => (topCode.value ? axisOf('group')?.items?.find((t) => t.code === topCode.value) ?? null : null))
const pickedUnder = (t: BrowseOption) => draft.value.some((c) => c === t.code || (t.children ?? []).some((g) => g.code === c))
function openTop(code: string) {
  // 대분류 → 직무로 내려간다(한 칸 쌓는다 — 뒤로 가면 대분류 목록)
  router.push({ path: route.path, query: { ...route.query, [axisKey.value]: draft.value.join(',') || undefined, top: code, pd: String(pd.value + 1) } })
}

// ── 개수 ── 다른 조건이 없으면 고르기 화면 개수(축 응답), 있으면 서버가 센 '넣었을 때' 개수
function axesCount(k: BrowseAxisKey, code: string): number | undefined {
  const a = axisOf(k)
  if (!a) return undefined
  if (a.sections) return a.sections.flatMap((s) => s.items).find((i) => i.code === code)?.count
  for (const it of a.items ?? []) {
    if (it.code === code) return it.count
    const c = it.children?.find((x) => x.code === code)
    if (c) return c.count
  }
  return undefined
}
function countOf(k: BrowseAxisKey, code: string): number | undefined {
  // 업무 환경은 탭 안에서 서로 얽히므로(자세·빼기는 함께, 좋아요는 또는) 지금 고른 것까지 넣고 센다 — '빼기'도 그 보기를 넣으면 남는 수
  if (k === 'env') return tentQ.result.value?.next.env?.[code] ?? (hasOthers.value || draft.value.length ? undefined : axesCount(k, code))
  if (!hasOthers.value) return axesCount(k, code)
  return baseQ.result.value?.next[k]?.[code]
}

// ── 고를 수 있나 ── 0개라서 흐린 것과 조건 한도 때문에 흐린 것을 나눠 보인다
/** 이 탭을 새로 쓰면 조건이 하나 늘어난다 — 이미 3개면 고를 수 없다(탭에서 막지만 주소로 바로 들어온 경우까지) */
const canPick = computed(() => state.value[axisKey.value].length > 0 || draft.value.length > 0 || conditionCount(base.value) < MAX_CONDITIONS)
const limited = computed(() => !!axes.value && !canPick.value)
const isZero = (k: BrowseAxisKey, code: string) => !!code && !draft.value.includes(code) && countOf(k, code) === 0
const isOff = (k: BrowseAxisKey, code: string) => !canPick.value || isZero(k, code)
const dimClass = (k: BrowseAxisKey, code: string, onlyLimit = false) => ({
  'bp-dim--limit': !canPick.value,
  'bp-dim--zero': canPick.value && !onlyLimit && isZero(k, code),
})

function toggle(code: string) {
  draft.value = draft.value.includes(code) ? draft.value.filter((c) => c !== code) : [...draft.value, code]
}
const sectionPick = (items: BrowseOption[]) => items.find((i) => draft.value.includes(i.code))?.code ?? null
function setSection(items: BrowseOption[], code: string | null) {
  const codes = new Set(items.map((i) => i.code))
  draft.value = [...draft.value.filter((c) => !codes.has(c)), ...(code ? [code] : [])]
}

// 관심 분야 묶음 — 고른 것이 있는 묶음은 펼쳐 둔다. 처음엔 첫 묶음만
const openSet = ref<Set<string>>(new Set())
const isOpen = (g: string) => openSet.value.has(g)
function toggleOpen(g: string) {
  const n = new Set(openSet.value)
  if (n.has(g)) n.delete(g)
  else n.add(g)
  openSet.value = n
}
const fieldsOf = (g: BrowseOption) => (g.children ?? []).map((f) => f.code)
const pickedIn = (g: BrowseOption) => fieldsOf(g).filter((c) => draft.value.includes(c)).length
const allPicked = (g: BrowseOption) => fieldsOf(g).length > 0 && pickedIn(g) === fieldsOf(g).length
function toggleAll(g: BrowseOption) {
  const fs = new Set(fieldsOf(g))
  draft.value = allPicked(g) ? draft.value.filter((c) => !fs.has(c)) : [...new Set([...draft.value, ...fs])]
}
watch(() => axes.value, () => {
  const groups = axisOf('interest')?.items ?? []
  const withPick = groups.filter((g) => pickedIn(g) > 0).map((g) => g.code)
  openSet.value = new Set(withPick.length ? withPick : groups.slice(0, 1).map((g) => g.code))
}, { immediate: true })

// ── 버튼 ──
const showCta = computed(() => !(axisKey.value === 'salary' && guest) && !(axisKey.value === 'group' && !topCode.value && !draft.value.length && !hasOthers.value))
const ctaDisabled = computed(() => isEmptyState(tentative.value))
const ctaLabel = computed(() => {
  const t = tentQ.result.value?.total
  return t != null && !tentQ.loading.value ? `직업 ${t}개 보기` : '직업 보기'
})

/** 비회원 연봉 잠금 → 가입·로그인 뒤 돌아올 곳: 지금 고른 조건의 목록(없으면 이 탭) */
const signupTo = computed(() => {
  const next = isEmptyState(base.value)
    ? '/career-encyclopedia/browse/salary'
    : router.resolve({ path: '/career-encyclopedia/browse', query: listQuery(base.value, order.value) }).fullPath
  return { path: '/onboarding/auth', query: { next } }
})

/**
 * 목록으로 — 고르기 화면만큼(pd) 되돌아간 뒤, 목록에서 왔으면 그 목록 자리를 바꾸고(replace) 홈에서 왔으면 목록을 하나 연다.
 * 그래서 뒤로 가기가 지나온 목록을 하나씩 되짚지 않는다(사용성 확인). 바로 들어온 주소면 이 자리를 바꾼다
 */
function goList(next: BrowseState) {
  const to = { path: '/career-encyclopedia/browse', query: listQuery(next, nextOrder(order.value, next, [axisKey.value])) }
  if (pd.value > 0 && window.history.state?.back != null) {
    const list = fromList.value
    const stop = router.afterEach(() => {
      stop()
      if (list) router.replace(to)
      else router.push(to)
    })
    router.go(-pd.value)
  } else {
    router.replace(to)
  }
}
function applyCodes(codes: string[]) {
  goList(withAxis(state.value, axisKey.value, codes))
}
/** 탭을 옮기면 지금 고른 것을 들고 간다(이 칸을 바꾼다 — 깊이는 그대로) */
function switchAxis(k: BrowseAxisKey) {
  if (k === axisKey.value) return
  const keep: Record<string, string> = { pd: String(Math.max(1, pd.value - (topCode.value ? 1 : 0))) }
  if (fromList.value) keep.from = 'list'
  const q = listQuery(tentative.value, nextOrder(order.value, tentative.value, [axisKey.value]), keep)
  router.replace({ path: `/career-encyclopedia/browse/${k}`, query: q })
}
function back() {
  safeBack(router, '/career-encyclopedia')
}

// 선택된 탭을 화면 안으로(연봉 탭이 잘리지 않게)
const tabsEl = ref<HTMLElement | null>(null)
watch(() => [axisKey.value, topCode.value], async () => {
  await nextTick()
  tabsEl.value?.querySelector('.bp__tab--on')?.scrollIntoView({ inline: 'center', block: 'nearest' })
}, { immediate: true })

// ── 불러오기 ──
watch(() => JSON.stringify([axisKey.value, paramsFromState(base.value)]), () => {
  if (hasOthers.value) baseQ.run(base.value, { limit: 1 })
}, { immediate: true })
let timer: ReturnType<typeof setTimeout> | null = null
watch(() => JSON.stringify(paramsFromState(tentative.value)), () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => { tentQ.run(tentative.value, { limit: 1 }) }, 250)
}, { immediate: true })
onMounted(loadAxes)
</script>
